"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Hash,
  Loader2,
  Plus,
  Tags,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { clientService } from "@/features/clients/services/client.service";
import { employeeService } from "@/features/employees/services/employee.service";
import { taskService } from "@/features/tasks/services/task.service";
import { workCategoryService } from "@/features/work-categories/services/workCategory.service";

import type { Client } from "@/features/clients/types/client.types";

import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";

import type {
  CreateTaskRequest,
  TaskPriority,
} from "@/features/tasks/types/task.types";

import type { WorkCategory } from "@/features/work-categories/types/workCategory.types";

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
  if (!value) {
    return "—";
  }

  if (typeof value === "string") {
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
   * Task creation requires BOTH permissions.
   */
  const canCreateTask =
    permissions.includes("task.create") && permissions.includes("task.assign");

  const isTeamLead = role?.code === "TEAM_LEAD";
  const isEmployee = role?.code === "EMPLOYEE";

  /**
   * ==========================================================
   * DATA
   * ==========================================================
   */

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [clients, setClients] = useState<Client[]>([]);

  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);

  /**
   * ==========================================================
   * LOADING STATES
   * ==========================================================
   */

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const [isLoadingWorkCategories, setIsLoadingWorkCategories] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const [clientId, setClientId] = useState("");

  const [assigneeId, setAssigneeId] = useState("");

  const [workCategoryId, setWorkCategoryId] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const [dueDate, setDueDate] = useState("");

  /**
   * ==========================================================
   * LOAD CLIENTS
   * ==========================================================
   */

  const loadClients = useCallback(async () => {
    if (!company?._id) {
      setIsLoadingClients(false);
      return;
    }

    try {
      setIsLoadingClients(true);

      const result = await clientService.getClients(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "name",
        sortOrder: "asc",
      });

      setClients(result.records);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingClients(false);
    }
  }, [company?._id]);

  /**
   * ==========================================================
   * LOAD EMPLOYEES
   * ==========================================================
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
      setIsLoadingClients(false);
      return;
    }

    void Promise.all([loadClients(), loadEmployees()]);
  }, [canCreateTask, isEmployee, loadClients, loadEmployees]);

  /**
   * ==========================================================
   * AVAILABLE ASSIGNEES
   * ==========================================================
   */

  const availableEmployees = useMemo(() => {
    /**
     * Company-scoped users can use whatever employees
     * the backend has returned.
     */
    if (!isTeamLead) {
      return employees;
    }

    /**
     * Team Lead UI restriction.
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
   * Team Lead may assign a task to himself.
   */
  const canAssignToSelf =
    isTeamLead && Boolean(companyAccess?._id) && Boolean(companyAccess?.teamId);

  /**
   * Avoid duplicate Team Lead option if employee endpoint
   * already includes the current Team Lead.
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
   * ==========================================================
   * SELECTED ASSIGNEE
   * ==========================================================
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
   * SELECTED DEPARTMENT + TEAM
   * ==========================================================
   *
   * IMPORTANT:
   *
   * We do NOT ask the user to manually choose department/team.
   *
   * They are derived from the selected assignee.
   */

  const selectedDepartmentId = useMemo(() => {
    if (!assigneeId) {
      return null;
    }

    if (isSelfSelected) {
      return companyAccess?.departmentId ?? null;
    }

    return getReferenceId(selectedEmployeeAccess?.departmentId);
  }, [
    assigneeId,
    isSelfSelected,
    companyAccess?.departmentId,
    selectedEmployeeAccess,
  ]);

  const selectedTeamId = useMemo(() => {
    if (!assigneeId) {
      return null;
    }

    if (isSelfSelected) {
      return companyAccess?.teamId ?? null;
    }

    return getReferenceId(selectedEmployeeAccess?.teamId);
  }, [
    assigneeId,
    isSelfSelected,
    companyAccess?.teamId,
    selectedEmployeeAccess,
  ]);

  /**
   * Human-readable Department name.
   */
  const selectedDepartmentName = useMemo(() => {
    if (!assigneeId) {
      return "—";
    }

    if (isSelfSelected) {
      return "Your assigned department";
    }

    return getReferenceName(selectedEmployeeAccess?.departmentId);
  }, [assigneeId, isSelfSelected, selectedEmployeeAccess]);

  /**
   * Human-readable Team name.
   */
  const selectedTeamName = useMemo(() => {
    if (!assigneeId) {
      return "—";
    }

    if (isSelfSelected) {
      return "Your assigned team";
    }

    return getReferenceName(selectedEmployeeAccess?.teamId);
  }, [assigneeId, isSelfSelected, selectedEmployeeAccess]);

  /**
   * ==========================================================
   * LOAD WORK CATEGORIES
   * ==========================================================
   *
   * Department + Team come from the selected assignee.
   *
   * Therefore categories shown here can only belong to:
   *
   * selected assignee
   *      ↓
   * department
   *      ↓
   * team
   *      ↓
   * work category
   */

  const loadWorkCategories = useCallback(async () => {
    if (!company?._id || !selectedDepartmentId || !selectedTeamId) {
      setWorkCategories([]);
      setWorkCategoryId("");
      return;
    }

    try {
      setIsLoadingWorkCategories(true);

      const result = await workCategoryService.getWorkCategories(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        departmentId: selectedDepartmentId,
        teamId: selectedTeamId,
        sortBy: "name",
        sortOrder: "asc",
      });

      setWorkCategories(result.records);
    } catch (error: unknown) {
      setWorkCategories([]);

      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingWorkCategories(false);
    }
  }, [company?._id, selectedDepartmentId, selectedTeamId]);

  /**
   * Whenever assignee / department / team changes:
   *
   * clear previous category and load valid categories.
   */
  useEffect(() => {
    setWorkCategoryId("");

    if (!assigneeId || !selectedDepartmentId || !selectedTeamId) {
      setWorkCategories([]);
      return;
    }

    void loadWorkCategories();
  }, [assigneeId, selectedDepartmentId, selectedTeamId, loadWorkCategories]);

  /**
   * ==========================================================
   * SELECTED CLIENT
   * ==========================================================
   */

  const selectedClient = useMemo(() => {
    return clients.find((client) => client._id === clientId);
  }, [clients, clientId]);

  /**
   * ==========================================================
   * SELECTED CATEGORY
   * ==========================================================
   */

  const selectedWorkCategory = useMemo(() => {
    return workCategories.find((category) => category._id === workCategoryId);
  }, [workCategories, workCategoryId]);

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

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    if (!assigneeId) {
      toast.error("Please select an assignee.");
      return;
    }

    if (!selectedDepartmentId || !selectedTeamId) {
      toast.error(
        "Selected assignee does not have a valid department and team.",
      );

      return;
    }

    if (!workCategoryId) {
      toast.error("Please select a work category.");

      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Quantity must be a whole number of at least 1.");

      return;
    }

    if (!title.trim()) {
      toast.error("Ticket title is required.");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    const payload: CreateTaskRequest = {
      clientId,

      workCategoryId,

      title: title.trim(),

      description: description.trim(),

      quantity,

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

  const today = new Date().toISOString().split("T")[0];

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
      {/* ======================================================
          HEADER
      ====================================================== */}

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
            WORK CONTEXT
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">Work context</h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the client, assignee and type of work being assigned.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ================================================
                CLIENT
            ================================================ */}

            <div>
              <label
                htmlFor="client"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Client
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                disabled={isLoadingClients}
                required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isLoadingClients ? "Loading clients..." : "Select client"}
                </option>

                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                    {client.code ? ` (${client.code})` : ""}
                  </option>
                ))}
              </select>

              {selectedClient && (
                <p className="mt-1.5 text-xs text-slate-500">
                  {selectedClient.clientType}
                  {" · "}
                  {selectedClient.engagementType}
                  {selectedClient.industry
                    ? ` · ${selectedClient.industry}`
                    : ""}
                </p>
              )}
            </div>

            {/* ================================================
                ASSIGNEE
            ================================================ */}

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

                {canAssignToSelf && !selfAlreadyInEmployeeList && (
                  <option value={companyAccess!._id}>
                    {user?.displayName || user?.firstName || "Me"} (Me)
                  </option>
                )}

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

            {/* ================================================
                DEPARTMENT
            ================================================ */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Department
              </label>

              <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                {assigneeId
                  ? selectedDepartmentName
                  : "Select an assignee first"}
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Derived automatically from the assignee.
              </p>
            </div>

            {/* ================================================
                TEAM
            ================================================ */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Team
              </label>

              <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                {assigneeId ? selectedTeamName : "Select an assignee first"}
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Derived automatically from the assignee.
              </p>
            </div>

            {/* ================================================
                WORK CATEGORY
            ================================================ */}

            <div>
              <label
                htmlFor="workCategory"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Work category
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <div className="relative">
                <Tags className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  id="workCategory"
                  value={workCategoryId}
                  onChange={(event) => setWorkCategoryId(event.target.value)}
                  disabled={
                    !assigneeId ||
                    !selectedDepartmentId ||
                    !selectedTeamId ||
                    isLoadingWorkCategories
                  }
                  required
                  className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {!assigneeId
                      ? "Select assignee first"
                      : isLoadingWorkCategories
                        ? "Loading work categories..."
                        : workCategories.length === 0
                          ? "No active work categories"
                          : "Select work category"}
                  </option>

                  {workCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                      {category.code ? ` (${category.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorkCategory && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Unit: {selectedWorkCategory.unitLabel}
                  {" · "}
                  Workload weight: {selectedWorkCategory.workloadWeight}
                </p>
              )}
            </div>

            {/* ================================================
                QUANTITY
            ================================================ */}

            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Quantity
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <div className="relative">
                <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                {selectedWorkCategory
                  ? `${quantity} ${selectedWorkCategory.unitLabel}`
                  : "Number of work units included in this ticket."}
              </p>
            </div>
          </div>
        </section>

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
                Describe the work and define its priority and due date.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ================================================
                TITLE
            ================================================ */}

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
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Keep the summary short and action-oriented.
              </p>
            </div>

            {/* ================================================
                DESCRIPTION
            ================================================ */}

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

            {/* ================================================
                PRIORITY
            ================================================ */}

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

            {/* ================================================
                DUE DATE
            ================================================ */}

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
                  min={today}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* ================================================
                INITIAL STATUS
            ================================================ */}

            <div className="lg:col-span-2">
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
            ASSIGNMENT SUMMARY
        ==================================================== */}

        {assigneeId && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-950">
                  Assignment summary
                </h2>

                <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryItem
                    label="Client"
                    value={selectedClient?.name || "—"}
                  />

                  <SummaryItem
                    label="Department"
                    value={selectedDepartmentName}
                  />

                  <SummaryItem label="Team" value={selectedTeamName} />

                  <SummaryItem
                    label="Category"
                    value={selectedWorkCategory?.name || "Not selected"}
                  />

                  <SummaryItem
                    label="Quantity"
                    value={
                      selectedWorkCategory
                        ? `${quantity} ${selectedWorkCategory.unitLabel}`
                        : String(quantity)
                    }
                  />

                  <SummaryItem
                    label="Assignee"
                    value={
                      isSelfSelected
                        ? user?.displayName || user?.firstName || "You"
                        : selectedEmployee
                          ? getEmployeeUser(selectedEmployee)?.displayName ||
                            "Unnamed employee"
                          : "—"
                    }
                  />

                  <SummaryItem
                    label="Designation"
                    value={
                      isSelfSelected
                        ? companyAccess?.designation || "—"
                        : selectedEmployeeAccess?.designation || "—"
                    }
                  />

                  <SummaryItem label="Priority" value={priority} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            WORKFLOW
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
              isLoadingClients ||
              isLoadingWorkCategories ||
              !clientId ||
              !assigneeId ||
              !selectedDepartmentId ||
              !selectedTeamId ||
              !workCategoryId ||
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              !title.trim() ||
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
 * SUMMARY ITEM
 * ============================================================
 */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-800">{value}</p>
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
