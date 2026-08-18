"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCcw,
  Repeat2,
  RotateCcw,
  Send,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";
import { taskService } from "@/features/tasks/services/task.service";

import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";

import type {
  Task,
  TaskActivity,
  TaskActivityListResult,
  TaskCompanyAccessReference,
  TaskStatus,
  TaskUserReference,
} from "@/features/tasks/types/task.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * STATUS DISPLAY
 * ============================================================
 */

const statusLabels: Record<TaskStatus, string> = {
  ASSIGNED: "To Do",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "In Review",
  COMPLETED: "Done",
  REOPENED: "Reopened",
  CANCELLED: "Cancelled",
};

const statusClassNames: Record<TaskStatus, string> = {
  ASSIGNED: "border-slate-200 bg-slate-50 text-slate-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  SUBMITTED: "border-violet-200 bg-violet-50 text-violet-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REOPENED: "border-amber-200 bg-amber-50 text-amber-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

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
      "Unable to process ticket."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process ticket.";
}

/**
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * ============================================================
 * TASK POPULATED REFERENCES
 * ============================================================
 */

function isPopulatedCompanyAccess(
  value:
    | Task["assigneeId"]
    | Task["assignedById"]
    | Task["submittedById"]
    | Task["completedById"]
    | Task["lastReopenedById"]
    | Task["cancelledById"]
    | TaskActivity["performedById"],
): value is TaskCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedUser(
  value: string | TaskUserReference,
): value is TaskUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getAccessUserName(
  value:
    | Task["assigneeId"]
    | Task["assignedById"]
    | Task["submittedById"]
    | Task["completedById"]
    | Task["lastReopenedById"]
    | Task["cancelledById"]
    | TaskActivity["performedById"],
) {
  if (!value || !isPopulatedCompanyAccess(value)) {
    return "—";
  }

  const user = value.userId;

  if (!isPopulatedUser(user)) {
    return "—";
  }

  return user.displayName || "Unnamed user";
}

function getAccessEmployeeCode(
  value: Task["assigneeId"] | Task["assignedById"],
) {
  if (!isPopulatedCompanyAccess(value)) {
    return "—";
  }

  return value.employeeCode || "—";
}

function getReferenceName(value: Task["departmentId"] | Task["teamId"]) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

/**
 * ============================================================
 * EMPLOYEE POPULATED REFERENCES
 * ============================================================
 */

function isPopulatedEmployeeUser(
  value: Employee["userId"],
): value is EmployeeUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedEmployeeAccess(
  value: Employee["companyAccessId"],
): value is EmployeeCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getEmployeeAccess(employee: Employee) {
  return isPopulatedEmployeeAccess(employee.companyAccessId)
    ? employee.companyAccessId
    : null;
}

function getEmployeeName(employee: Employee) {
  if (!isPopulatedEmployeeUser(employee.userId)) {
    return "Unnamed employee";
  }

  return employee.userId.displayName || "Unnamed employee";
}

function getEmployeeReferenceId(
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

/**
 * ============================================================
 * ACTIVITY DISPLAY
 * ============================================================
 */

function getActivityTitle(activity: TaskActivity) {
  switch (activity.activityType) {
    case "CREATED":
      return "Created ticket";

    case "STARTED":
      return "Started work";

    case "PROGRESS_UPDATED":
      return "Updated progress";

    case "SUBMITTED":
      return "Submitted for review";

    case "COMPLETED":
      return "Marked ticket as done";

    case "REOPENED":
      return "Reopened ticket";

    case "UPDATED":
      return "Updated ticket";

    case "REASSIGNED":
      return "Reassigned ticket";

    case "DUE_DATE_CHANGED":
      return "Changed due date";

    case "PRIORITY_CHANGED":
      return "Changed priority";

    case "CANCELLED":
      return "Cancelled ticket";

    case "DELETED":
      return "Deleted ticket";

    default:
      return activity.activityType;
  }
}

function getActivityDescription(activity: TaskActivity) {
  const metadata = activity.metadata ?? {};

  /**
   * Progress update.
   */
  if (activity.activityType === "PROGRESS_UPDATED") {
    const previousProgress = metadata.previousProgress;
    const newProgress = metadata.newProgress;

    if (
      typeof previousProgress === "number" &&
      typeof newProgress === "number"
    ) {
      return `${previousProgress}% → ${newProgress}%`;
    }
  }

  /**
   * Reassignment.
   *
   * The activity API currently stores CompanyAccess IDs
   * in metadata, so we display the most useful information
   * available here: status + progress at handoff.
   */
  if (activity.activityType === "REASSIGNED") {
    const progressAtReassignment = metadata.progressAtReassignment;
    const statusAtReassignment = metadata.statusAtReassignment;

    const parts: string[] = [];

    if (
      typeof statusAtReassignment === "string" &&
      statusAtReassignment in statusLabels
    ) {
      parts.push(`Status: ${statusLabels[statusAtReassignment as TaskStatus]}`);
    }

    if (typeof progressAtReassignment === "number") {
      parts.push(`Progress: ${progressAtReassignment}%`);
    }

    if (parts.length > 0) {
      return parts.join(" • ");
    }

    return "Ticket ownership transferred";
  }

  /**
   * Status transition.
   */
  if (activity.fromStatus && activity.toStatus) {
    return `${statusLabels[activity.fromStatus]} → ${
      statusLabels[activity.toStatus]
    }`;
  }

  return null;
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function TaskDetailsPage() {
  const params = useParams<{ taskId: string }>();

  const company = useAuthStore((state) => state.company);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const permissions = useAuthStore((state) => state.permissions);

  const taskId = params.taskId;

  /**
   * ==========================================================
   * TASK + ACTIVITY STATE
   * ==========================================================
   */

  const [task, setTask] = useState<Task | null>(null);

  const [activities, setActivities] = useState<TaskActivityListResult>({
    taskId: "",
    records: [],
    totalRecords: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * ==========================================================
   * EMPLOYEE WORK STATE
   * ==========================================================
   */

  const [progressPercentage, setProgressPercentage] = useState(0);

  const [workNote, setWorkNote] = useState("");

  const [submissionNote, setSubmissionNote] = useState("");

  /**
   * ==========================================================
   * MANAGER WORKFLOW STATE
   * ==========================================================
   */

  const [completionNote, setCompletionNote] = useState("");

  const [reopenReason, setReopenReason] = useState("");

  const [cancellationReason, setCancellationReason] = useState("");

  /**
   * ==========================================================
   * REASSIGNMENT STATE
   * ==========================================================
   */

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [newAssigneeId, setNewAssigneeId] = useState("");

  const [reassignmentReason, setReassignmentReason] = useState("");

  /**
   * ==========================================================
   * PERMISSIONS
   * ==========================================================
   */

  const canUpdate = permissions.includes("task.update");

  const canSubmit = permissions.includes("task.submit");

  const canComplete = permissions.includes("task.complete");

  const canReopen = permissions.includes("task.reopen");

  const canCancel = permissions.includes("task.cancel");

  const canReassign = permissions.includes("task.reassign");

  /**
   * ==========================================================
   * OWNERSHIP
   * ==========================================================
   */

  const isOwnTask = useMemo(() => {
    if (!task || !companyAccess?._id) {
      return false;
    }

    if (!isPopulatedCompanyAccess(task.assigneeId)) {
      return false;
    }

    return task.assigneeId._id === companyAccess._id;
  }, [task, companyAccess?._id]);

  /**
   * ==========================================================
   * AVAILABLE ACTIONS
   * ==========================================================
   */

  const canStartTask =
    isOwnTask &&
    canUpdate &&
    ["ASSIGNED", "REOPENED"].includes(task?.status ?? "");

  const canUpdateProgress =
    isOwnTask && canUpdate && task?.status === "IN_PROGRESS";

  const canSubmitTask =
    isOwnTask && canSubmit && task?.status === "IN_PROGRESS";

  const canCompleteTask = canComplete && task?.status === "SUBMITTED";

  const canReopenTask =
    canReopen && ["SUBMITTED", "COMPLETED"].includes(task?.status ?? "");

  const canCancelTask =
    canCancel &&
    Boolean(task) &&
    !["COMPLETED", "CANCELLED"].includes(task?.status ?? "");

  /**
   * Reassignment is allowed by our backend only for:
   *
   * ASSIGNED
   * IN_PROGRESS
   * REOPENED
   */
  const canReassignTask =
    canReassign &&
    Boolean(task) &&
    ["ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(task?.status ?? "");

  /**
   * ==========================================================
   * LOAD TICKET
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

      const [taskResult, activityResult] = await Promise.all([
        taskService.getTaskById(company._id, taskId),

        taskService.getTaskActivities(company._id, taskId),
      ]);

      setTask(taskResult);

      setActivities(activityResult);

      setProgressPercentage(taskResult.progressPercentage);

      setWorkNote(taskResult.workNote || "");

      setSubmissionNote("");

      setCompletionNote("");

      setReopenReason("");

      setCancellationReason("");

      setNewAssigneeId("");

      setReassignmentReason("");
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
   * LOAD EMPLOYEES FOR REASSIGNMENT
   * ==========================================================
   */

  const loadEmployeesForReassignment = useCallback(async () => {
    if (!company?._id || !task || !canReassignTask) {
      setEmployees([]);

      return;
    }

    try {
      setIsLoadingEmployees(true);

      const result = await employeeService.getEmployees(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      /**
       * Current ticket team.
       */
      const taskTeamId =
        typeof task.teamId === "string" ? task.teamId : task.teamId._id;

      /**
       * Current assignee CompanyAccess ID.
       */
      const currentAssigneeId =
        typeof task.assigneeId === "string"
          ? task.assigneeId
          : task.assigneeId._id;

      /**
       * Frontend safety:
       *
       * - same team only
       * - active employee only
       * - current assignee excluded
       *
       * Backend still remains the source of truth.
       */
      const filteredEmployees = result.records.filter((employee) => {
        const access = getEmployeeAccess(employee);

        if (!access) {
          return false;
        }

        const employeeTeamId = getEmployeeReferenceId(access.teamId);

        return (
          employeeTeamId === taskTeamId &&
          access._id !== currentAssigneeId &&
          access.status === "ACTIVE"
        );
      });

      setEmployees(filteredEmployees);
    } catch (error: unknown) {
      setEmployees([]);

      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [company?._id, task, canReassignTask]);

  useEffect(() => {
    if (!canReassignTask) {
      setEmployees([]);

      setNewAssigneeId("");

      setReassignmentReason("");

      return;
    }

    void loadEmployeesForReassignment();
  }, [canReassignTask, loadEmployeesForReassignment]);

  /**
   * ==========================================================
   * COMMON ACTION RUNNER
   * ==========================================================
   */

  async function runAction(
    action: () => Promise<Task>,
    successMessage: string,
  ) {
    try {
      setIsActionLoading(true);

      const updatedTask = await action();

      setTask(updatedTask);

      setProgressPercentage(updatedTask.progressPercentage);

      setWorkNote(updatedTask.workNote || "");

      setSubmissionNote("");

      setCompletionNote("");

      setReopenReason("");

      setCancellationReason("");

      setNewAssigneeId("");

      setReassignmentReason("");

      /**
       * Refresh Jira-style activity stream
       * after every ticket operation.
       */
      if (company?._id) {
        const activityResult = await taskService.getTaskActivities(
          company._id,
          updatedTask._id,
        );

        setActivities(activityResult);
      }

      toast.success(successMessage);

      return updatedTask;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));

      return null;
    } finally {
      setIsActionLoading(false);
    }
  }

  /**
   * ==========================================================
   * START
   * ==========================================================
   */

  async function handleStartTask() {
    if (!company?._id || !task) {
      return;
    }

    await runAction(
      () => taskService.startTask(company._id, task._id),

      task.status === "REOPENED"
        ? "Work resumed successfully."
        : "Work started successfully.",
    );
  }

  /**
   * ==========================================================
   * PROGRESS
   * ==========================================================
   */

  async function handleProgressUpdate() {
    if (!company?._id || !task) {
      return;
    }

    await runAction(
      () =>
        taskService.updateTaskProgress(company._id, task._id, {
          progressPercentage,

          workNote: workNote.trim(),
        }),

      "Progress updated successfully.",
    );
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmitTask() {
    if (!company?._id || !task) {
      return;
    }

    await runAction(
      () =>
        taskService.submitTask(company._id, task._id, {
          submissionNote: submissionNote.trim(),
        }),

      "Ticket submitted for review.",
    );
  }

  /**
   * ==========================================================
   * COMPLETE
   * ==========================================================
   */

  async function handleCompleteTask() {
    if (!company?._id || !task) {
      return;
    }

    await runAction(
      () =>
        taskService.completeTask(company._id, task._id, {
          completionNote: completionNote.trim(),
        }),

      "Ticket marked as done.",
    );
  }

  /**
   * ==========================================================
   * REOPEN
   * ==========================================================
   */

  async function handleReopenTask() {
    if (!company?._id || !task) {
      return;
    }

    if (!reopenReason.trim()) {
      toast.error("Please provide a reason for reopening the ticket.");

      return;
    }

    await runAction(
      () =>
        taskService.reopenTask(company._id, task._id, {
          reopenReason: reopenReason.trim(),
        }),

      "Ticket reopened successfully.",
    );
  }

  /**
   * ==========================================================
   * REASSIGN
   * ==========================================================
   */

  async function handleReassignTask() {
    if (!company?._id || !task) {
      return;
    }

    if (!canReassignTask) {
      toast.error("You do not have permission to reassign this ticket.");

      return;
    }

    if (!newAssigneeId) {
      toast.error("Please select a new assignee.");

      return;
    }

    if (!reassignmentReason.trim()) {
      toast.error("Reassignment reason is required.");

      return;
    }

    await runAction(
      () =>
        taskService.reassignTask(company._id, task._id, {
          newAssigneeId,

          reassignmentReason: reassignmentReason.trim(),
        }),

      "Ticket reassigned successfully.",
    );

    /**
     * No manual employee reload is required here.
     *
     * runAction updates `task`.
     *
     * Since task.assigneeId changes,
     * loadEmployeesForReassignment will automatically
     * run again through the useEffect above.
     */
  }

  /**
   * ==========================================================
   * CANCEL
   * ==========================================================
   */

  async function handleCancelTask() {
    if (!company?._id || !task) {
      return;
    }

    if (!cancellationReason.trim()) {
      toast.error("Cancellation reason is required.");

      return;
    }

    await runAction(
      () =>
        taskService.cancelTask(company._id, task._id, {
          cancellationReason: cancellationReason.trim(),
        }),

      "Ticket cancelled successfully.",
    );
  }

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (isLoading) {
    return <TaskDetailsSkeleton />;
  }

  /**
   * ==========================================================
   * ERROR
   * ==========================================================
   */

  if (errorMessage || !task) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">
          Unable to load ticket
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {errorMessage || "Ticket not found."}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/tasks"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>

          <button
            type="button"
            onClick={() => void loadTask()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/tasks"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">
              #{task._id.slice(-8).toUpperCase()}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                statusClassNames[task.status]
              }`}
            >
              {statusLabels[task.status]}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {task.title}
          </h1>

          <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-500">
            {task.description || "No description provided."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTask()}
          disabled={isActionLoading}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ======================================================
          TOP CARDS
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={UserRound}
          label="Assignee"
          value={getAccessUserName(task.assigneeId)}
          description={getAccessEmployeeCode(task.assigneeId)}
        />

        <InfoCard
          icon={CalendarDays}
          label="Due date"
          value={formatDate(task.dueDate)}
          description={
            task.startDate
              ? `Started ${formatDate(task.startDate)}`
              : "Work not started"
          }
        />

        <InfoCard
          icon={Clock3}
          label="Progress"
          value={`${task.progressPercentage}%`}
          description={statusLabels[task.status]}
        />

        <InfoCard
          icon={RotateCcw}
          label="Reopens"
          value={task.reopenCount}
          description={
            task.lastReopenedAt
              ? `Last ${formatDateTime(task.lastReopenedAt)}`
              : "Never reopened"
          }
        />
      </div>

      {/* ======================================================
          MAIN LAYOUT
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        {/* ====================================================
            LEFT COLUMN
        ==================================================== */}

        <div className="space-y-6">
          {/* ==================================================
              TICKET DETAILS
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Ticket details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assignment and ticket information.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Priority" value={task.priority} />

              <DetailItem
                label="Department"
                value={getReferenceName(task.departmentId)}
              />

              <DetailItem label="Team" value={getReferenceName(task.teamId)} />

              <DetailItem
                label="Assigned by"
                value={getAccessUserName(task.assignedById)}
              />

              <DetailItem
                label="Created"
                value={formatDateTime(task.createdAt)}
              />

              <DetailItem
                label="Actual start"
                value={formatDateTime(task.startDate)}
              />

              <DetailItem label="Due date" value={formatDate(task.dueDate)} />

              <DetailItem
                label="Current status"
                value={statusLabels[task.status]}
              />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Current work note
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {task.workNote || "No work note added yet."}
              </p>
            </div>

            {task.submissionNote && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Latest submission note
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {task.submissionNote}
                </p>
              </div>
            )}

            {task.completionNote && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Latest completion note
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {task.completionNote}
                </p>
              </div>
            )}

            {task.reopenReason && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-amber-700">
                  Latest reopen reason
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {task.reopenReason}
                </p>
              </div>
            )}
          </section>

          {/* ==================================================
              REASSIGNMENT
          ================================================== */}

          {canReassignTask && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6">
              <div className="flex items-start gap-3">
                <Repeat2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-950">
                    Reassign ticket
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Transfer this ticket to another employee in the same team.
                    Existing progress, start time, work notes and ticket history
                    will be preserved.
                  </p>

                  <div className="mt-5 rounded-xl border border-indigo-100 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      Current assignee
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-900">
                        {getAccessUserName(task.assigneeId)}
                      </span>

                      <span className="text-xs text-slate-400">
                        {getAccessEmployeeCode(task.assigneeId)}
                      </span>

                      <span className="text-xs font-medium text-slate-500">
                        • {task.progressPercentage}% progress
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="newAssigneeId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      New assignee
                    </label>

                    <select
                      id="newAssigneeId"
                      value={newAssigneeId}
                      onChange={(event) => setNewAssigneeId(event.target.value)}
                      disabled={isLoadingEmployees || isActionLoading}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingEmployees
                          ? "Loading employees..."
                          : "Select employee"}
                      </option>

                      {employees.map((employee) => {
                        const access = getEmployeeAccess(employee);

                        if (!access) {
                          return null;
                        }

                        return (
                          <option key={employee._id} value={access._id}>
                            {getEmployeeName(employee)}
                            {access.employeeCode
                              ? ` (${access.employeeCode})`
                              : ""}
                          </option>
                        );
                      })}
                    </select>

                    {!isLoadingEmployees && employees.length === 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        No other active employee is currently available in this
                        team.
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="reassignmentReason"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Reassignment reason
                    </label>

                    <textarea
                      id="reassignmentReason"
                      value={reassignmentReason}
                      onChange={(event) =>
                        setReassignmentReason(event.target.value)
                      }
                      placeholder="Explain why this ticket is being reassigned"
                      rows={4}
                      maxLength={3000}
                      disabled={isActionLoading}
                      className="w-full resize-y rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100"
                    />

                    <div className="mt-1 text-right text-xs text-slate-400">
                      {reassignmentReason.length}/3000
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      disabled={
                        isActionLoading ||
                        isLoadingEmployees ||
                        !newAssigneeId ||
                        !reassignmentReason.trim()
                      }
                      onClick={() => void handleReassignTask()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Repeat2 className="h-4 w-4" />
                      )}
                      Reassign ticket
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              ASSIGNEE START
          ================================================== */}

          {canStartTask && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {task.status === "REOPENED"
                      ? "Resume work"
                      : "Ready to start?"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {task.status === "REOPENED"
                      ? "This ticket was reopened. Start work again when you are ready."
                      : "Move this ticket from To Do to In Progress."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => void handleStartTask()}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}

                  {task.status === "REOPENED" ? "Resume work" : "Start work"}
                </button>
              </div>
            </section>
          )}

          {/* ==================================================
              PROGRESS
          ================================================== */}

          {canUpdateProgress && (
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Work progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your current progress and work note.
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="progressPercentage"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Progress
                  </label>

                  <span className="text-sm font-bold text-blue-600">
                    {progressPercentage}%
                  </span>
                </div>

                <input
                  id="progressPercentage"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressPercentage}
                  onChange={(event) =>
                    setProgressPercentage(Number(event.target.value))
                  }
                  className="mt-4 w-full"
                />

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(progressPercentage, 0),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="workNote"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Work note
                </label>

                <textarea
                  id="workNote"
                  value={workNote}
                  onChange={(event) => setWorkNote(event.target.value)}
                  placeholder="What have you worked on?"
                  rows={4}
                  maxLength={3000}
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => void handleProgressUpdate()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isActionLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Update progress
                </button>
              </div>
            </section>
          )}

          {/* ==================================================
              SUBMIT
          ================================================== */}

          {canSubmitTask && (
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Submit for review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                When your work is ready, send the ticket to the Team Lead for
                review.
              </p>

              <textarea
                value={submissionNote}
                onChange={(event) => setSubmissionNote(event.target.value)}
                placeholder="Describe what was completed..."
                rows={4}
                maxLength={3000}
                className="mt-5 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => void handleSubmitTask()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit for review
                </button>
              </div>
            </section>
          )}

          {/* ==================================================
              IN REVIEW — MANAGER
          ================================================== */}

          {canCompleteTask && (
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-violet-600">
                  In Review
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Review submitted work
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Verify the work and close the ticket if everything is
                  complete.
                </p>
              </div>

              {task.submissionNote && (
                <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                    Submission note
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {task.submissionNote}
                  </p>
                </div>
              )}

              <textarea
                value={completionNote}
                onChange={(event) => setCompletionNote(event.target.value)}
                placeholder="Optional completion note"
                rows={4}
                maxLength={3000}
                className="mt-5 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => void handleCompleteTask()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark as done
                </button>
              </div>
            </section>
          )}

          {/* ==================================================
              REOPEN
          ================================================== */}

          {canReopenTask && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6">
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div className="flex-1">
                  <h2 className="font-semibold text-slate-950">
                    Reopen ticket
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {task.status === "COMPLETED"
                      ? "Reopen this completed ticket when additional work is required."
                      : "Return this submitted ticket to the assignee when corrections are required."}
                  </p>

                  <textarea
                    value={reopenReason}
                    onChange={(event) => setReopenReason(event.target.value)}
                    placeholder="Explain what needs to be corrected or added"
                    rows={4}
                    maxLength={3000}
                    className="mt-4 w-full resize-y rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => void handleReopenTask()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Reopen ticket
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              CANCEL
          ================================================== */}

          {canCancelTask && (
            <section className="rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                <div className="flex-1">
                  <h2 className="font-semibold text-slate-950">
                    Cancel ticket
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Cancel this ticket only if the work is no longer required.
                  </p>

                  <textarea
                    value={cancellationReason}
                    onChange={(event) =>
                      setCancellationReason(event.target.value)
                    }
                    placeholder="Cancellation reason"
                    rows={3}
                    maxLength={2000}
                    className="mt-4 w-full resize-y rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  />

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => void handleCancelTask()}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                      Cancel ticket
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ====================================================
            RIGHT COLUMN — ACTIVITY
        ==================================================== */}

        <section className="self-start rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity className="h-4 w-4" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">Activity</h2>

                <p className="text-xs text-slate-500">
                  {activities.totalRecords} events
                </p>
              </div>
            </div>
          </div>

          {activities.records.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No ticket activity available.
            </div>
          ) : (
            <div className="max-h-[760px] overflow-y-auto p-5">
              <div className="space-y-0">
                {activities.records.map((activity, index) => (
                  <ActivityItem
                    key={activity._id}
                    activity={activity}
                    isLast={index === activities.records.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * INFO CARD
 * ============================================================
 */

function InfoCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-1 truncate text-lg font-bold text-slate-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * DETAIL
 * ============================================================
 */

function DetailItem({
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

      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

/**
 * ============================================================
 * ACTIVITY ITEM
 * ============================================================
 */

function ActivityItem({
  activity,
  isLast,
}: {
  activity: TaskActivity;
  isLast: boolean;
}) {
  const actor = getAccessUserName(activity.performedById);

  const description = getActivityDescription(activity);

  const isReassignment = activity.activityType === "REASSIGNED";

  return (
    <div className="relative flex gap-3 pb-6">
      {!isLast && (
        <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow ring-1 ring-slate-200 ${
          isReassignment ? "bg-indigo-500" : "bg-blue-500"
        }`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-slate-700">
          <span className="font-semibold text-slate-900">{actor}</span>{" "}
          {getActivityTitle(activity).toLowerCase()}
        </p>

        {description && (
          <p
            className={`mt-1 text-xs font-medium ${
              isReassignment ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        )}

        {activity.note && (
          <div
            className={`mt-2 rounded-lg px-3 py-2 ${
              isReassignment ? "bg-indigo-50" : "bg-slate-50"
            }`}
          >
            <p className="whitespace-pre-wrap text-xs leading-5 text-slate-600">
              {activity.note}
            </p>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-400">
          {formatDateTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * SKELETON
 * ============================================================
 */

function TaskDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />

        <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
