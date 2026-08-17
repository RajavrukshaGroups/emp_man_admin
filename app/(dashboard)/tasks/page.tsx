"use client";

import axios from "axios";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { taskService } from "@/features/tasks/services/task.service";

import type {
  Task,
  TaskCompanyAccessReference,
  TaskListResult,
  TaskPriority,
  TaskStatus,
  TaskUserReference,
} from "@/features/tasks/types/task.types";

import { useAuthStore } from "@/store/auth.store";

const PAGE_SIZE = 10;

/**
 * Jira-style labels shown in the UI.
 *
 * Backend values remain unchanged.
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

const priorityClassNames: Record<TaskPriority, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700",
  URGENT: "border-rose-200 bg-rose-50 text-rose-700",
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to retrieve tasks."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to retrieve tasks.";
}

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

function getReferenceName(value: Task["departmentId"] | Task["teamId"]) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

function isOverdue(task: Task) {
  if (["COMPLETED", "CANCELLED"].includes(task.status)) {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

export default function TasksPage() {
  const company = useAuthStore((state) => state.company);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);

  const isTeamScoped = role?.scopeType === "TEAM";
  const isDepartmentScoped = role?.scopeType === "DEPARTMENT";
  const isEmployee = role?.code === "EMPLOYEE";

  const canCreateTask =
    permissions.includes("task.create") && permissions.includes("task.assign");

  const [result, setResult] = useState<TaskListResult>({
    records: [],
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      totalRecords: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      setErrorMessage("Active company context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const taskResult = await taskService.getTasks(company._id, {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setResult(taskResult);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, search, status, priority]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: TaskStatus | "") {
    setPage(1);
    setStatus(value);
  }

  function handlePriorityChange(value: TaskPriority | "") {
    setPage(1);
    setPriority(value);
  }

  const completedCount = useMemo(
    () => result.records.filter((task) => task.status === "COMPLETED").length,
    [result.records],
  );

  const inReviewCount = useMemo(
    () => result.records.filter((task) => task.status === "SUBMITTED").length,
    [result.records],
  );

  const overdueCount = useMemo(
    () => result.records.filter(isOverdue).length,
    [result.records],
  );

  const pageDescription = isEmployee
    ? "Track your assigned tickets, progress and review status."
    : isTeamScoped
      ? "Manage and monitor tickets for your managed teams."
      : isDepartmentScoped
        ? "Manage and monitor tickets within your department."
        : "Manage and monitor company-wide task tickets.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Task management</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Tickets
          </h1>

          <p className="mt-1 text-sm text-slate-500">{pageDescription}</p>
        </div>

        {canCreateTask && (
          <Link
            href="/tasks/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create ticket
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ClipboardList}
          label={
            isEmployee
              ? "My tickets"
              : isTeamScoped
                ? "Team tickets"
                : "Total tickets"
          }
          value={result.pagination.totalRecords}
        />

        <SummaryCard icon={UserRound} label="In review" value={inReviewCount} />

        <SummaryCard
          icon={CheckCircle2}
          label="Done on page"
          value={completedCount}
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Overdue on page"
          value={overdueCount}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search ticket title or description"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as TaskStatus | "")
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All statuses</option>
              <option value="ASSIGNED">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">In Review</option>
              <option value="COMPLETED">Done</option>
              <option value="REOPENED">Reopened</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priority}
              onChange={(event) =>
                handlePriorityChange(event.target.value as TaskPriority | "")
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <button
              type="button"
              onClick={() => void loadTasks()}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <TasksTableSkeleton />
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load tickets
            </h2>

            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadTasks()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : result.records.length === 0 ? (
          <TaskEmptyState
            hasFilters={Boolean(search || status || priority)}
            canCreateTask={canCreateTask}
            isEmployee={isEmployee}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <TableHeading>Ticket</TableHeading>

                    {!isEmployee && <TableHeading>Assignee</TableHeading>}

                    <TableHeading>Team</TableHeading>
                    <TableHeading>Priority</TableHeading>
                    <TableHeading>Progress</TableHeading>
                    <TableHeading>Due date</TableHeading>
                    <TableHeading>Status</TableHeading>

                    <TableHeading align="right">Actions</TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {result.records.map((task) => {
                    const overdue = isOverdue(task);

                    return (
                      <tr
                        key={task._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <TableCell>
                          <div className="max-w-[330px]">
                            <Link
                              href={`/tasks/${task._id}`}
                              className="block truncate font-semibold text-slate-950 hover:text-blue-600"
                            >
                              {task.title}
                            </Link>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {task.description || "No description"}
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-slate-400">
                              #{task._id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                        </TableCell>

                        {!isEmployee && (
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-800">
                                {getAssigneeName(task)}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {getAssigneeCode(task)}
                              </p>
                            </div>
                          </TableCell>
                        )}

                        <TableCell>{getReferenceName(task.teamId)}</TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              priorityClassNames[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-[120px]">
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">
                                {task.progressPercentage}%
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{
                                  width: `${Math.min(
                                    Math.max(task.progressPercentage, 0),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p
                              className={
                                overdue
                                  ? "font-semibold text-rose-600"
                                  : "font-medium text-slate-700"
                              }
                            >
                              {formatDate(task.dueDate)}
                            </p>

                            {overdue && (
                              <p className="mt-0.5 text-xs font-medium text-rose-500">
                                Overdue
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              statusClassNames[task.status]
                            }`}
                          >
                            {statusLabels[task.status]}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/tasks/${task._id}`}
                              title="Open ticket"
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                              Open
                            </Link>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {result.records.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {result.pagination.totalRecords}
                </span>{" "}
                {isEmployee
                  ? "assigned tickets"
                  : isTeamScoped
                    ? "team tickets"
                    : "tickets"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!result.pagination.hasPreviousPage || isLoading}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="px-2 text-sm font-medium text-slate-600">
                  Page {result.pagination.page} of{" "}
                  {result.pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={!result.pagination.hasNextPage || isLoading}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-5 py-4 text-sm text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function TasksTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function TaskEmptyState({
  hasFilters,
  canCreateTask,
  isEmployee,
}: {
  hasFilters: boolean;
  canCreateTask: boolean;
  isEmployee: boolean;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <CalendarClock className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters ? "No matching tickets" : "No tickets available"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No ticket matches the selected search, status or priority."
          : isEmployee
            ? "You currently have no assigned tickets."
            : "No tickets have been created for your current scope yet."}
      </p>

      {!hasFilters && canCreateTask && (
        <Link
          href="/tasks/new"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Create ticket
        </Link>
      )}
    </div>
  );
}
