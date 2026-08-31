"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Hash,
  Loader2,
  Save,
  Tags,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { clientService } from "@/features/clients/services/client.service";
import { taskService } from "@/features/tasks/services/task.service";
import { workCategoryService } from "@/features/work-categories/services/workCategory.service";

import type { Client } from "@/features/clients/types/client.types";

import type {
  Task,
  TaskCompanyAccessReference,
  TaskPriority,
  TaskUserReference,
  UpdateTaskRequest,
} from "@/features/tasks/types/task.types";

import type { WorkCategory } from "@/features/work-categories/types/workCategory.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * ERROR
 * ============================================================
 */

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to update ticket."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update ticket.";
}

/**
 * ============================================================
 * DATE
 * ============================================================
 */

function formatDateForInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

/**
 * ============================================================
 * TASK REFERENCE HELPERS
 * ============================================================
 */

function getReferenceId(value: Task["departmentId"] | Task["teamId"]) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id;
}

function getReferenceName(value: Task["departmentId"] | Task["teamId"]) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

function getClientId(task: Task) {
  if (!task.clientId) {
    return "";
  }

  if (typeof task.clientId === "string") {
    return task.clientId;
  }

  return task.clientId._id;
}

function getWorkCategoryId(task: Task) {
  if (!task.workCategoryId) {
    return "";
  }

  if (typeof task.workCategoryId === "string") {
    return task.workCategoryId;
  }

  return task.workCategoryId._id;
}

function isPopulatedCompanyAccess(
  value: Task["assigneeId"],
): value is TaskCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedUser(
  value: string | TaskUserReference,
): value is TaskUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getAssigneeName(task: Task) {
  if (!isPopulatedCompanyAccess(task.assigneeId)) {
    return "—";
  }

  const user = task.assigneeId.userId;

  if (!isPopulatedUser(user)) {
    return "—";
  }

  return user.displayName || "Unnamed employee";
}

function getAssigneeCode(task: Task) {
  if (!isPopulatedCompanyAccess(task.assigneeId)) {
    return "—";
  }

  return task.assigneeId.employeeCode || "—";
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function EditTaskPage() {
  const params = useParams<{ taskId: string }>();

  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);

  const taskId = params.taskId;

  /**
   * ==========================================================
   * PERMISSION
   * ==========================================================
   */

  const canUpdateTask =
    permissions.includes("task.update") && role?.code !== "EMPLOYEE";
  /**
   * ==========================================================
   * DATA
   * ==========================================================
   */

  const [task, setTask] = useState<Task | null>(null);

  const [clients, setClients] = useState<Client[]>([]);

  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const [clientId, setClientId] = useState("");

  const [workCategoryId, setWorkCategoryId] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const [dueDate, setDueDate] = useState("");

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const [isLoadingWorkCategories, setIsLoadingWorkCategories] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * ==========================================================
   * STATUS RULES
   * ==========================================================
   */

  const canEditTicket = Boolean(
    task && ["ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(task.status),
  );

  /**
   * Structural fields can be edited only before
   * work has actually started.
   */
  const canEditStructuralFields = task?.status === "ASSIGNED";

  /**
   * ==========================================================
   * TASK CONTEXT
   * ==========================================================
   */

  const taskDepartmentId = useMemo(() => {
    if (!task) {
      return null;
    }

    return getReferenceId(task.departmentId);
  }, [task]);

  const taskTeamId = useMemo(() => {
    if (!task) {
      return null;
    }

    return getReferenceId(task.teamId);
  }, [task]);

  const taskDepartmentName = useMemo(() => {
    if (!task) {
      return "—";
    }

    return getReferenceName(task.departmentId);
  }, [task]);

  const taskTeamName = useMemo(() => {
    if (!task) {
      return "—";
    }

    return getReferenceName(task.teamId);
  }, [task]);

  /**
   * ==========================================================
   * LOAD TASK
   * ==========================================================
   */

  const loadTask = useCallback(async () => {
    if (!company?._id || !taskId) {
      setIsLoading(false);
      setErrorMessage("Ticket context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const taskResult = await taskService.getTaskById(company._id, taskId);

      setTask(taskResult);

      /**
       * Populate form with existing ticket values.
       */
      setClientId(getClientId(taskResult));

      setWorkCategoryId(getWorkCategoryId(taskResult));

      setQuantity(taskResult.quantity);

      setTitle(taskResult.title);

      setDescription(taskResult.description || "");

      setPriority(taskResult.priority);

      setDueDate(formatDateForInput(taskResult.dueDate));
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  /**
   * ==========================================================
   * LOAD CLIENTS
   * ==========================================================
   */

  const loadClients = useCallback(async () => {
    if (!company?._id) {
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
   * Load clients only when structural edit
   * is actually allowed.
   */
  useEffect(() => {
    if (!task || !canEditStructuralFields) {
      return;
    }

    void loadClients();
  }, [task, canEditStructuralFields, loadClients]);

  /**
   * ==========================================================
   * LOAD WORK CATEGORIES
   * ==========================================================
   *
   * Important:
   *
   * Edit Ticket does NOT derive department/team
   * from an assignee selection.
   *
   * The existing ticket department/team remain fixed.
   */

  const loadWorkCategories = useCallback(async () => {
    if (!company?._id || !taskDepartmentId || !taskTeamId) {
      setWorkCategories([]);
      return;
    }

    try {
      setIsLoadingWorkCategories(true);

      const result = await workCategoryService.getWorkCategories(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        departmentId: taskDepartmentId,
        teamId: taskTeamId,
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
  }, [company?._id, taskDepartmentId, taskTeamId]);

  useEffect(() => {
    if (!task || !canEditStructuralFields) {
      return;
    }

    void loadWorkCategories();
  }, [task, canEditStructuralFields, loadWorkCategories]);

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
   * SELECTED WORK CATEGORY
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

    if (!task) {
      toast.error("Ticket is unavailable.");
      return;
    }

    if (!canUpdateTask) {
      toast.error("You do not have permission to edit tickets.");
      return;
    }

    if (!canEditTicket) {
      toast.error(`Ticket cannot be edited while status is ${task.status}.`);

      return;
    }

    if (!title.trim()) {
      toast.error("Ticket summary is required.");
      return;
    }

    if (title.trim().length < 3) {
      toast.error("Ticket summary must contain at least 3 characters.");
      return;
    }

    if (title.trim().length > 200) {
      toast.error("Ticket summary cannot exceed 200 characters.");
      return;
    }

    if (description.trim().length > 5000) {
      toast.error("Ticket description cannot exceed 5000 characters.");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    /**
     * Common fields remain editable while:
     *
     * ASSIGNED
     * IN_PROGRESS
     * REOPENED
     */
    const payload: UpdateTaskRequest = {
      title: title.trim(),

      description: description.trim(),

      priority,

      dueDate,
    };

    /**
     * Structural fields are included ONLY
     * while the ticket is still ASSIGNED.
     */
    if (canEditStructuralFields) {
      if (!clientId) {
        toast.error("Please select a client.");
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

      payload.clientId = clientId;

      payload.workCategoryId = workCategoryId;

      payload.quantity = quantity;
    }

    try {
      setIsSubmitting(true);

      const updatedTask = await taskService.updateTask(
        company._id,
        task._id,
        payload,
      );

      toast.success("Ticket updated successfully.");

      router.push(`/tasks/${updatedTask._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

        <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />

        <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  /**
   * ==========================================================
   * ERROR
   * ==========================================================
   */

  if (errorMessage || !task) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Unable to load ticket
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {errorMessage || "Ticket not found."}
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
   * PERMISSION DENIED
   * ==========================================================
   */

  if (!canUpdateTask) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-rose-500" />

        <h1 className="mt-4 text-xl font-bold text-rose-900">
          Ticket editing unavailable
        </h1>

        <p className="mt-2 text-sm text-rose-700">
          You do not have permission to edit this ticket.
        </p>

        <Link
          href={`/tasks/${task._id}`}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ticket
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * STATUS LOCK
   * ==========================================================
   */

  if (!canEditTicket) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-amber-600" />

        <h1 className="mt-4 text-xl font-bold text-amber-950">
          Ticket cannot be edited
        </h1>

        <p className="mt-2 text-sm text-amber-700">
          Tickets cannot be edited while status is{" "}
          <span className="font-semibold">{task.status}</span>.
        </p>

        <Link
          href={`/tasks/${task._id}`}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ticket
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
          href={`/tasks/${task._id}`}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ticket
        </Link>

        <p className="text-sm font-semibold text-blue-600">Task management</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Edit ticket
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update ticket details while preserving assignment and workflow
          history.
        </p>

        <p className="mt-2 font-mono text-xs text-slate-400">
          #{task._id.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* ======================================================
          STRUCTURAL LOCK NOTICE
      ====================================================== */}

      {!canEditStructuralFields && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            Work has already started
          </h2>

          <p className="mt-1 text-sm leading-6 text-amber-700">
            Client, work category and quantity are locked once work has started.
            You can still update the summary, description, priority and due
            date.
          </p>
        </section>
      )}

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
                Review the assignment and update the ticket work context where
                allowed.
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

              {canEditStructuralFields ? (
                <>
                  <select
                    id="client"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    disabled={isLoadingClients || isSubmitting}
                    required
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      {isLoadingClients
                        ? "Loading clients..."
                        : "Select client"}
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
                </>
              ) : (
                <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  {typeof task.clientId === "string"
                    ? "Existing client"
                    : `${task.clientId.name}${
                        task.clientId.code ? ` (${task.clientId.code})` : ""
                      }`}
                </div>
              )}
            </div>

            {/* ================================================
                ASSIGNEE
            ================================================ */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Assignee
              </label>

              <div className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                <span>{getAssigneeName(task)}</span>

                {getAssigneeCode(task) !== "—" && (
                  <span className="text-xs text-slate-400">
                    {getAssigneeCode(task)}
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Use the Reassign ticket workflow to change the assignee.
              </p>
            </div>

            {/* ================================================
                DEPARTMENT
            ================================================ */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Department
              </label>

              <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                {taskDepartmentName}
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Department remains tied to the existing task assignment.
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
                {taskTeamName}
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Team remains unchanged through normal ticket editing.
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

              {canEditStructuralFields ? (
                <>
                  <div className="relative">
                    <Tags className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      id="workCategory"
                      value={workCategoryId}
                      onChange={(event) =>
                        setWorkCategoryId(event.target.value)
                      }
                      disabled={isLoadingWorkCategories || isSubmitting}
                      required
                      className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingWorkCategories
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
                </>
              ) : (
                <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  {typeof task.workCategoryId === "string"
                    ? "Existing work category"
                    : `${task.workCategoryId.name}${
                        task.workCategoryId.code
                          ? ` (${task.workCategoryId.code})`
                          : ""
                      }`}
                </div>
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
                  disabled={!canEditStructuralFields || isSubmitting}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                {selectedWorkCategory
                  ? `${quantity} ${selectedWorkCategory.unitLabel}`
                  : typeof task.workCategoryId !== "string" &&
                      task.workCategoryId.unitLabel
                    ? `${quantity} ${task.workCategoryId.unitLabel}`
                    : "Number of work units in this ticket."}
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
                Update the task summary, description, priority and due date.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ================================================
                SUMMARY
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
                disabled={isSubmitting}
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              />

              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Keep the summary short and action-oriented.
                </p>

                <span className="text-xs text-slate-400">
                  {title.length}/200
                </span>
              </div>
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
                disabled={isSubmitting}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
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
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
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
                  onChange={(event) => setDueDate(event.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                The backend prevents a due date earlier than the actual task
                start time.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            ASSIGNMENT SUMMARY
        ==================================================== */}

        <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950">Ticket summary</h2>

              <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryItem label="Assignee" value={getAssigneeName(task)} />

                <SummaryItem label="Department" value={taskDepartmentName} />

                <SummaryItem label="Team" value={taskTeamName} />

                <SummaryItem label="Status" value={task.status} />

                <SummaryItem
                  label="Client"
                  value={
                    selectedClient?.name ||
                    (typeof task.clientId !== "string"
                      ? task.clientId.name
                      : "—")
                  }
                />

                <SummaryItem
                  label="Category"
                  value={
                    selectedWorkCategory?.name ||
                    (typeof task.workCategoryId !== "string"
                      ? task.workCategoryId.name
                      : "—")
                  }
                />

                <SummaryItem
                  label="Quantity"
                  value={
                    selectedWorkCategory
                      ? `${quantity} ${selectedWorkCategory.unitLabel}`
                      : typeof task.workCategoryId !== "string" &&
                          task.workCategoryId.unitLabel
                        ? `${quantity} ${task.workCategoryId.unitLabel}`
                        : String(quantity)
                  }
                />

                <SummaryItem label="Priority" value={priority} />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/tasks/${task._id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !title.trim() ||
              !dueDate ||
              (canEditStructuralFields &&
                (isLoadingClients ||
                  isLoadingWorkCategories ||
                  !clientId ||
                  !workCategoryId ||
                  !Number.isInteger(quantity) ||
                  quantity < 1))
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
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
