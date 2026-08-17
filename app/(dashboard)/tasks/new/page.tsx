"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Loader2,
  Plus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";

import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";

import { taskService } from "@/features/tasks/services/task.service";

import type {
  CreateTaskRequest,
  TaskPriority,
} from "@/features/tasks/types/task.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * ERROR MESSAGE
 * ============================================================
 */

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to create ticket."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create ticket.";
}

/**
 * ============================================================
 * EMPLOYEE HELPERS
 * ============================================================
 */

function isPopulatedUser(
  value: Employee["userId"],
): value is EmployeeUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedCompanyAccess(
  value: Employee["companyAccessId"],
): value is EmployeeCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getEmployeeUser(employee: Employee) {
  return isPopulatedUser(employee.userId) ? employee.userId : null;
}

function getCompanyAccess(employee: Employee) {
  return isPopulatedCompanyAccess(employee.companyAccessId)
    ? employee.companyAccessId
    : null;
}

function getReferenceId(
  value:
    | EmployeeCompanyAccessReference["departmentId"]
    | EmployeeCompanyAccessReference["teamId"],
) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id;
}

function getReferenceName(
  value:
    | EmployeeCompanyAccessReference["departmentId"]
    | EmployeeCompanyAccessReference["teamId"],
) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function CreateTaskPage() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const permissions = useAuthStore((state) => state.permissions);

  /**
   * Creating a ticket requires both permissions.
   */
  const canCreateTask =
    permissions.includes("task.create") && permissions.includes("task.assign");

  const isTeamLead = role?.code === "TEAM_LEAD";
  const isEmployee = role?.code === "EMPLOYEE";

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Form
   */
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  /**
   * CompanyAccess ID.
   */
  const [assigneeId, setAssigneeId] = useState("");

  const [dueDate, setDueDate] = useState("");

  /**
   * ==========================================================
   * LOAD AVAILABLE EMPLOYEES
   * ==========================================================
   *
   * The backend remains the final authority on scope.
   *
   * For Team Leads, employee APIs should already be scoped,
   * but we additionally filter to the current team here.
   */

  const loadEmployees = useCallback(async () => {
    if (!company?._id) {
      setIsLoadingEmployees(false);
      return;
    }

    try {
      setIsLoadingEmployees(true);

      const result = await employeeService.getEmployees(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      setEmployees(result.records);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [company?._id]);

  useEffect(() => {
    if (!canCreateTask || isEmployee) {
      setIsLoadingEmployees(false);
      return;
    }

    void loadEmployees();
  }, [canCreateTask, isEmployee, loadEmployees]);

  /**
   * ==========================================================
   * AVAILABLE ASSIGNEES
   * ==========================================================
   */

  const availableEmployees = useMemo(() => {
    /**
     * Company / department scoped users can use
     * whatever records the backend employee API returns.
     */
    if (!isTeamLead) {
      return employees;
    }

    /**
     * Team Lead frontend restriction.
     */
    const ownTeamId = companyAccess?.teamId;

    if (!ownTeamId) {
      return [];
    }

    return employees.filter((employee) => {
      const access = getCompanyAccess(employee);

      if (!access) {
        return false;
      }

      return getReferenceId(access.teamId) === ownTeamId;
    });
  }, [employees, isTeamLead, companyAccess?.teamId]);

  /**
   * Team Lead can assign a ticket to himself.
   */
  const canAssignToSelf =
    isTeamLead && Boolean(companyAccess?._id) && Boolean(companyAccess?.teamId);

  /**
   * Avoid duplicating Team Lead if they are already
   * returned by employeeService.
   */
  const selfAlreadyInEmployeeList = useMemo(() => {
    if (!companyAccess?._id) {
      return false;
    }

    return availableEmployees.some((employee) => {
      const access = getCompanyAccess(employee);

      return access?._id === companyAccess._id;
    });
  }, [availableEmployees, companyAccess?._id]);

  /**
   * Selected employee details.
   */
  const selectedEmployee = useMemo(() => {
    return availableEmployees.find((employee) => {
      const access = getCompanyAccess(employee);

      return access?._id === assigneeId;
    });
  }, [availableEmployees, assigneeId]);

  const selectedEmployeeAccess = selectedEmployee
    ? getCompanyAccess(selectedEmployee)
    : null;

  const isSelfSelected =
    Boolean(companyAccess?._id) && assigneeId === companyAccess?._id;

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Active company context is unavailable.");
      return;
    }

    if (!canCreateTask) {
      toast.error("You do not have permission to create tickets.");
      return;
    }

    if (!title.trim()) {
      toast.error("Ticket title is required.");
      return;
    }

    if (!assigneeId) {
      toast.error("Please select an assignee.");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    /**
     * Backend createTask automatically sets:
     *
     * status = ASSIGNED
     * progressPercentage = 0
     * startDate = null
     *
     * Actual startDate will be recorded when the
     * assignee clicks "Start work".
     */
    const payload: CreateTaskRequest = {
      title: title.trim(),

      description: description.trim(),

      priority,

      assigneeId,

      dueDate,
    };

    try {
      setIsSubmitting(true);

      const task = await taskService.createTask(company._id, payload);

      toast.success("Ticket created successfully.");

      router.push(`/tasks/${task._id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
   */

  if (!canCreateTask || isEmployee) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Ticket creation unavailable
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          You do not have permission to create and assign task tickets.
        </p>

        <Link
          href="/tasks"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/tasks"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        <p className="text-sm font-semibold text-blue-600">Task management</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Create ticket
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {isTeamLead
            ? "Create and assign a new ticket within your managed team."
            : "Create and assign a new employee ticket."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====================================================
            TICKET DETAILS
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">Ticket details</h2>

              <p className="mt-1 text-sm text-slate-500">
                Describe the work, select an assignee and define the due date.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Title */}

            <div className="lg:col-span-2">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Summary
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to be done?"
                maxLength={200}
                required
                autoFocus
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Keep the summary short and action-oriented.
              </p>
            </div>

            {/* Description */}

            <div className="lg:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the requirement, expected result, acceptance details or other useful context..."
                rows={7}
                maxLength={5000}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-1.5 flex justify-end">
                <span className="text-xs text-slate-400">
                  {description.length}/5000
                </span>
              </div>
            </div>

            {/* Assignee */}

            <div>
              <label
                htmlFor="assignee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assignee
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                disabled={isLoadingEmployees}
                required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isLoadingEmployees
                    ? "Loading assignees..."
                    : "Select assignee"}
                </option>

                {/* Team Lead self assignment */}

                {canAssignToSelf && !selfAlreadyInEmployeeList && (
                  <option value={companyAccess!._id}>
                    {user?.displayName || user?.firstName || "Me"} (Me)
                  </option>
                )}

                {/* Employee options */}

                {availableEmployees.map((employee) => {
                  const employeeUser = getEmployeeUser(employee);

                  const access = getCompanyAccess(employee);

                  if (!access) {
                    return null;
                  }

                  const isCurrentUser = access._id === companyAccess?._id;

                  return (
                    <option key={access._id} value={access._id}>
                      {employeeUser?.displayName || "Unnamed employee"}

                      {isCurrentUser
                        ? " (Me)"
                        : access.employeeCode
                          ? ` (${access.employeeCode})`
                          : ""}
                    </option>
                  );
                })}
              </select>

              {isTeamLead && (
                <p className="mt-1.5 text-xs text-slate-500">
                  You can assign tickets only inside your managed team,
                  including yourself.
                </p>
              )}
            </div>

            {/* Priority */}

            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="LOW">Low</option>

                <option value="MEDIUM">Medium</option>

                <option value="HIGH">High</option>

                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Due date */}

            <div>
              <label
                htmlFor="dueDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Due date
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Initial status */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Initial status
              </label>

              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  To Do
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                The assignee moves it to In Progress by clicking Start work.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            SELECTED ASSIGNEE
        ==================================================== */}

        {assigneeId && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-slate-950">Assignment</h2>

                {isSelfSelected ? (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    <span>
                      <strong className="text-slate-800">Assignee:</strong>{" "}
                      {user?.displayName || user?.firstName || "You"}
                    </span>

                    <span>
                      <strong className="text-slate-800">Employee code:</strong>{" "}
                      {companyAccess?.employeeCode || "—"}
                    </span>

                    <span>
                      <strong className="text-slate-800">Designation:</strong>{" "}
                      {companyAccess?.designation || "—"}
                    </span>
                  </div>
                ) : selectedEmployeeAccess ? (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    <span>
                      <strong className="text-slate-800">Department:</strong>{" "}
                      {getReferenceName(selectedEmployeeAccess.departmentId)}
                    </span>

                    <span>
                      <strong className="text-slate-800">Team:</strong>{" "}
                      {getReferenceName(selectedEmployeeAccess.teamId)}
                    </span>

                    <span>
                      <strong className="text-slate-800">Designation:</strong>{" "}
                      {selectedEmployeeAccess.designation || "—"}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Assignee selected.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            WORKFLOW INFORMATION
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Ticket workflow
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <WorkflowStatus>To Do</WorkflowStatus>

            <WorkflowArrow />

            <WorkflowStatus>In Progress</WorkflowStatus>

            <WorkflowArrow />

            <WorkflowStatus>In Review</WorkflowStatus>

            <WorkflowArrow />

            <WorkflowStatus>Done</WorkflowStatus>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Tickets may also be reopened from In Review or Done when additional
            work is required.
          </p>
        </section>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/tasks"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingEmployees ||
              !title.trim() ||
              !assigneeId ||
              !dueDate
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * ============================================================
 * WORKFLOW DISPLAY
 * ============================================================
 */

function WorkflowStatus({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function WorkflowArrow() {
  return <span className="text-slate-400">→</span>;
}
