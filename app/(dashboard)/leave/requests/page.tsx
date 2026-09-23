"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ThumbsUp,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { leaveRequestService } from "@/features/leave/services/leave-request.service";
import type {
  LeaveRequest,
  LeaveRequestStatus,
} from "@/features/leave/types/leave.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

/* =========================================================
   TYPES
   ========================================================= */

type ActionType =
  | "RECOMMEND"
  | "APPROVE"
  | "REJECT"
  | "CANCEL"
  | "REQUEST_CANCELLATION"
  | "APPROVE_CANCELLATION"
  | "REJECT_CANCELLATION";

interface ActionState {
  type: ActionType;
  request: LeaveRequest;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function LeaveRequestsPage() {
  const company = useAuthStore((state) => state.company);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("leave.read");
  const canApply = permissions.includes("leave.apply");
  const canRecommend = permissions.includes("leave.recommend");
  const canApprove = permissions.includes("leave.approve");
  const canReject = permissions.includes("leave.reject");
  const canCancel = permissions.includes("leave.cancel");

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | "ALL">(
    "ALL",
  );

  const [search, setSearch] = useState("");

  const [actionState, setActionState] = useState<ActionState | null>(null);

  const [actionNote, setActionNote] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  /* =========================================================
     LOAD REQUESTS
     ========================================================= */

  const loadRequests = useCallback(async () => {
    if (!company?._id || !canRead) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await leaveRequestService.list(company._id, {
        page: 1,
        limit: 100,

        status: statusFilter === "ALL" ? undefined : statusFilter,
      });

      setRequests(result.items);
    } catch (error) {
      setRequests([]);

      toast.error(getApiErrorMessage(error, "Unable to load leave requests."));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, canRead, statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((request) => {
      const employeeName = getEmployeeName(request).toLowerCase();

      const leaveType =
        `${request.leaveTypeName} ${request.leaveTypeCode}`.toLowerCase();

      const reason = request.reason.toLowerCase();

      return (
        employeeName.includes(normalizedSearch) ||
        leaveType.includes(normalizedSearch) ||
        reason.includes(normalizedSearch)
      );
    });
  }, [requests, search]);

  /* =========================================================
     SUMMARY
     ========================================================= */

  const summary = useMemo(() => {
    return requests.reduce(
      (result, request) => {
        if (request.status === "PENDING") {
          result.pending += 1;
        }

        if (request.status === "RECOMMENDED") {
          result.recommended += 1;
        }

        if (request.status === "APPROVED") {
          result.approved += 1;
        }

        if (request.cancellationStatus === "PENDING") {
          result.cancellationPending += 1;
        }

        return result;
      },
      {
        pending: 0,
        recommended: 0,
        approved: 0,
        cancellationPending: 0,
      },
    );
  }, [requests]);

  /* =========================================================
     ACTION MODAL
     ========================================================= */

  function openAction(type: ActionType, request: LeaveRequest) {
    setActionState({
      type,
      request,
    });

    setActionNote("");
  }

  function closeAction() {
    if (isSubmittingAction) {
      return;
    }

    setActionState(null);
    setActionNote("");
  }

  /* =========================================================
     EXECUTE ACTION
     ========================================================= */

  async function handleAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id || !actionState) {
      return;
    }

    const requestId = actionState.request._id;
    const note = actionNote.trim();

    if (requiresReason(actionState.type) && note.length < 3) {
      toast.error("Please provide a reason.");
      return;
    }

    try {
      setIsSubmittingAction(true);

      switch (actionState.type) {
        case "RECOMMEND":
          await leaveRequestService.recommend(
            company._id,
            requestId,
            note ? { note } : {},
          );

          toast.success("Leave request recommended successfully.");
          break;

        case "APPROVE":
          await leaveRequestService.approve(
            company._id,
            requestId,
            note ? { note } : {},
          );

          toast.success("Leave request approved successfully.");
          break;

        case "REJECT":
          await leaveRequestService.reject(company._id, requestId, {
            reason: note,
          });

          toast.success("Leave request rejected successfully.");
          break;

        case "CANCEL":
          await leaveRequestService.cancel(company._id, requestId, {
            reason: note,
          });

          toast.success("Leave request cancelled successfully.");
          break;

        case "REQUEST_CANCELLATION":
          await leaveRequestService.requestCancellation(
            company._id,
            requestId,
            {
              reason: note,
            },
          );

          toast.success("Leave cancellation requested successfully.");
          break;

        case "APPROVE_CANCELLATION":
          await leaveRequestService.approveCancellation(
            company._id,
            requestId,
            note ? { note } : {},
          );

          toast.success("Leave cancellation approved successfully.");
          break;

        case "REJECT_CANCELLATION":
          await leaveRequestService.rejectCancellation(
            company._id,
            requestId,
            note ? { note } : {},
          );

          toast.success("Leave cancellation rejected successfully.");
          break;
      }

      setActionState(null);
      setActionNote("");

      await loadRequests();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to complete leave action."),
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }

  /* =========================================================
     ACCESS
     ========================================================= */

  if (!canRead) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <EmptyState
          title="Leave requests unavailable"
          description="You do not have permission to view leave requests."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {canApply && (
            <Link
              href="/leave/apply"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apply Leave
            </Link>
          )}
        </div>
      </div>

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Pending" value={summary.pending} />

        <SummaryCard title="Recommended" value={summary.recommended} />

        <SummaryCard title="Approved" value={summary.approved} />

        <SummaryCard
          title="Cancellation Requests"
          value={summary.cancellationPending}
        />
      </div>

      {/* =====================================================
          FILTERS
         ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, leave type or reason..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as LeaveRequestStatus | "ALL")
            }
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </section>

      {/* =====================================================
          LIST
         ===================================================== */}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />

          <p className="mt-3 text-sm text-slate-500">
            Loading leave requests...
          </p>
        </section>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No leave requests found"
          description="No leave requests match the selected filters."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-slate-950">Leave Requests</h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing requests available within your authorized scope.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRequests.map((request) => {
              const isOwnRequest =
                getCompanyAccessId(request.companyAccessId) ===
                companyAccess?._id;

              return (
                <RequestRow
                  key={request._id}
                  request={request}
                  isOwnRequest={isOwnRequest}
                  canRecommend={canRecommend}
                  canApprove={canApprove}
                  canReject={canReject}
                  canCancel={canCancel}
                  onAction={openAction}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================
          ACTION MODAL
         ===================================================== */}

      {actionState && (
        <ActionModal
          actionState={actionState}
          note={actionNote}
          setNote={setActionNote}
          isSubmitting={isSubmittingAction}
          onClose={closeAction}
          onSubmit={handleAction}
        />
      )}
    </div>
  );
}

/* =========================================================
   REQUEST ROW
   ========================================================= */

function RequestRow({
  request,
  isOwnRequest,
  canRecommend,
  canApprove,
  canReject,
  canCancel,
  onAction,
}: {
  request: LeaveRequest;
  isOwnRequest: boolean;
  canRecommend: boolean;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
  onAction: (type: ActionType, request: LeaveRequest) => void;
}) {
  const canRecommendRequest =
    canRecommend && !isOwnRequest && request.status === "PENDING";

  const policy =
    typeof request.leavePolicyId === "string" ? null : request.leavePolicyId;

  const requiresRecommendation =
    policy?.approvalWorkflow === "RECOMMEND_THEN_APPROVE" &&
    policy?.allowApprovalWithoutRecommendation !== true;

  const canApproveRequest =
    canApprove &&
    (request.status === "RECOMMENDED" ||
      (request.status === "PENDING" && !requiresRecommendation));

  const canRejectRequest =
    canReject &&
    (request.status === "PENDING" || request.status === "RECOMMENDED");

  const canCancelRequest =
    canCancel &&
    isOwnRequest &&
    (request.status === "PENDING" || request.status === "RECOMMENDED");

  const canRequestApprovedCancellation =
    canCancel &&
    isOwnRequest &&
    request.status === "APPROVED" &&
    request.cancellationStatus !== "PENDING" &&
    request.cancellationStatus !== "APPROVED";

  const canReviewCancellation =
    request.status === "APPROVED" && request.cancellationStatus === "PENDING";

  return (
    <article className="px-5 py-5 sm:px-6">
      <div
        className="
    grid gap-x-6 gap-y-5
    md:grid-cols-2
    xl:grid-cols-[minmax(180px,1.15fr)_minmax(150px,0.95fr)_minmax(180px,1.15fr)_130px_minmax(220px,auto)]
    xl:items-center
  "
      >
        {/* =====================================================
            EMPLOYEE / LEAVE TYPE
           ===================================================== */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-slate-950">
              {getEmployeeName(request)}
            </h3>

            {isOwnRequest && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                You
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm font-medium text-blue-700">
            {request.leaveTypeName} ({request.leaveTypeCode})
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {getDepartmentTeam(request)}
          </p>
        </div>

        {/* =====================================================
            LEAVE PERIOD
           ===================================================== */}

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Leave period
          </p>

          <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

            <div className="flex flex-wrap items-center gap-1">
              <span>{formatDate(request.fromDate)}</span>

              {request.fromDate !== request.toDate && (
                <>
                  <span className="text-slate-400">–</span>

                  <span>{formatDate(request.toDate)}</span>
                </>
              )}
            </div>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {formatDays(request.requestedDays)}
          </p>
        </div>

        {/* =====================================================
            REASON
           ===================================================== */}

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Reason
          </p>

          <p className="mt-1.5 line-clamp-2 break-words text-sm leading-5 text-slate-700">
            {request.reason || "—"}
          </p>
        </div>

        {/* =====================================================
            STATUS
           ===================================================== */}

        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Status
          </p>

          <StatusBadge status={request.status} />

          {request.cancellationStatus !== "NOT_REQUESTED" && (
            <p className="mt-2 text-xs font-medium text-slate-500">
              {request.cancellationStatus === "PENDING" &&
                "Cancellation request pending"}

              {request.cancellationStatus === "APPROVED" &&
                "Cancellation request approved"}

              {request.cancellationStatus === "REJECTED" &&
                "Cancellation request rejected"}
            </p>
          )}
        </div>

        {/* =====================================================
            ACTIONS
           ===================================================== */}

        <div className="flex min-h-10 flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-start">
          {canRecommendRequest && (
            <ActionButton
              label="Recommend"
              icon={<ThumbsUp className="h-4 w-4" />}
              onClick={() => onAction("RECOMMEND", request)}
            />
          )}
          {canApproveRequest && (
            <ActionButton
              label="Approve"
              icon={<Check className="h-4 w-4" />}
              onClick={() => onAction("APPROVE", request)}
            />
          )}
          {canRejectRequest && (
            <ActionButton
              label="Reject"
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => onAction("REJECT", request)}
              danger
            />
          )}
          {canCancelRequest && (
            <ActionButton
              label="Cancel"
              icon={<X className="h-4 w-4" />}
              onClick={() => onAction("CANCEL", request)}
              danger
            />
          )}
          {canRequestApprovedCancellation && (
            <ActionButton
              label="Request Cancellation"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => onAction("REQUEST_CANCELLATION", request)}
            />
          )}
          {canReviewCancellation && canApprove && (
            <ActionButton
              label="Approve Cancellation"
              icon={<Check className="h-4 w-4" />}
              onClick={() => onAction("APPROVE_CANCELLATION", request)}
            />
          )}
          {canReviewCancellation && canReject && (
            <ActionButton
              label="Reject Cancellation"
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => onAction("REJECT_CANCELLATION", request)}
              danger
            />
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ACTION MODAL
   ========================================================= */

function ActionModal({
  actionState,
  note,
  setNote,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  actionState: ActionState;
  note: string;
  setNote: (value: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const config = getActionConfig(actionState.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{config.title}</h2>

            <p className="mt-1 text-sm text-slate-500">
              {getEmployeeName(actionState.request)} ·{" "}
              {actionState.request.leaveTypeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                {formatDate(actionState.request.fromDate)}
                {actionState.request.fromDate !== actionState.request.toDate &&
                  ` – ${formatDate(actionState.request.toDate)}`}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formatDays(actionState.request.requestedDays)}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {config.fieldLabel}
                {requiresReason(actionState.type) && " *"}
              </label>

              <textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isSubmitting}
                placeholder={config.placeholder}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
                config.danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-slate-950 hover:bg-slate-800"
              }`}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {config.buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function PageHeader() {
  return (
    <div className="flex items-start gap-3">
      <Link
        href="/leave"
        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Leave Requests
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review and manage leave requests available within your authorized
          scope.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

      <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </section>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
        danger
          ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  const styles: Record<LeaveRequestStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",

    RECOMMENDED: "bg-blue-50 text-blue-700 ring-blue-600/20",

    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

    REJECTED: "bg-red-50 text-red-700 ring-red-600/20",

    CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${styles[status]}`}
    >
      {formatEnum(status)}
    </span>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getEmployeeName(request: LeaveRequest) {
  const employee = request.employeeId;

  if (typeof employee === "string") {
    return "Employee";
  }

  const user = employee?.userId;

  if (user && typeof user !== "string") {
    return (
      user.displayName ||
      [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
      employee.employeeCode ||
      "Employee"
    );
  }

  return employee?.employeeCode ?? "Employee";
}

function getCompanyAccessId(value: LeaveRequest["companyAccessId"]) {
  return typeof value === "string" ? value : value?._id;
}

function getDepartmentTeam(request: LeaveRequest) {
  const department =
    typeof request.departmentId === "string" ? null : request.departmentId;

  const team = typeof request.teamId === "string" ? null : request.teamId;

  const values = [department?.name, team?.name].filter(Boolean);

  return values.length > 0 ? values.join(" · ") : "—";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDays(value: number) {
  const normalized = Number(value.toFixed(2));

  return `${normalized} day${normalized === 1 ? "" : "s"}`;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function requiresReason(type: ActionType) {
  return (
    type === "REJECT" || type === "CANCEL" || type === "REQUEST_CANCELLATION"
  );
}

function getActionConfig(type: ActionType) {
  switch (type) {
    case "RECOMMEND":
      return {
        title: "Recommend Leave",
        fieldLabel: "Recommendation note",
        placeholder: "Add an optional recommendation note...",
        buttonLabel: "Recommend",
        danger: false,
      };

    case "APPROVE":
      return {
        title: "Approve Leave",
        fieldLabel: "Approval note",
        placeholder: "Add an optional approval note...",
        buttonLabel: "Approve",
        danger: false,
      };

    case "REJECT":
      return {
        title: "Reject Leave",
        fieldLabel: "Rejection reason",
        placeholder: "Enter the reason for rejection...",
        buttonLabel: "Reject Leave",
        danger: true,
      };

    case "CANCEL":
      return {
        title: "Cancel Leave",
        fieldLabel: "Cancellation reason",
        placeholder: "Enter the reason for cancellation...",
        buttonLabel: "Cancel Leave",
        danger: true,
      };

    case "REQUEST_CANCELLATION":
      return {
        title: "Request Leave Cancellation",
        fieldLabel: "Cancellation reason",
        placeholder: "Explain why you want to cancel this approved leave...",
        buttonLabel: "Request Cancellation",
        danger: false,
      };

    case "APPROVE_CANCELLATION":
      return {
        title: "Approve Cancellation",
        fieldLabel: "Review note",
        placeholder: "Add an optional review note...",
        buttonLabel: "Approve Cancellation",
        danger: false,
      };

    case "REJECT_CANCELLATION":
      return {
        title: "Reject Cancellation",
        fieldLabel: "Review note",
        placeholder: "Add an optional review note...",
        buttonLabel: "Reject Cancellation",
        danger: true,
      };
  }
}
