"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileClock,
  Plus,
  RefreshCcw,
  ThumbsUp,
  XCircle,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { attendanceRegularizationService } from "@/features/attendance/services/attendance-regularization.service";

import type {
  AttendanceRegularization,
  AttendanceRegularizationListResponse,
  AttendanceRegularizationStatus,
} from "@/features/attendance/types/attendance-regularization.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

const statusFilters: Array<{
  label: string;
  value: AttendanceRegularizationStatus | "ALL";
}> = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Recommended",
    value: "RECOMMENDED",
  },
  {
    label: "Approved",
    value: "APPROVED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
  },
];

type ActionMode = "RECOMMEND" | "APPROVE" | "REJECT" | "CANCEL" | null;

export default function AttendanceRegularizationsPage() {
  const company = useAuthStore((state) => state.company);

  const companyAccess = useAuthStore((state) => state.companyAccess);

  const currentCompanyAccessId = companyAccess?._id ?? "";

  const permissions = useAuthStore((state) => state.permissions);

  const [data, setData] = useState<AttendanceRegularizationListResponse | null>(
    null,
  );

  const [status, setStatus] = useState<AttendanceRegularizationStatus | "ALL">(
    "ALL",
  );

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const [actionMode, setActionMode] = useState<ActionMode>(null);

  const [selectedRegularization, setSelectedRegularization] =
    useState<AttendanceRegularization | null>(null);

  const [actionText, setActionText] = useState("");

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const permissionCodes = useMemo(() => {
    if (!Array.isArray(permissions)) {
      return [];
    }

    return permissions;
  }, [permissions]);

  const canRequest = permissionCodes.includes("attendance.correction_request");

  const canRecommend = permissionCodes.includes(
    "attendance.correction_recommend",
  );

  const canApprove = permissionCodes.includes("attendance.correction_approve");

  /**
   * Anyone with recommend / approve permission should use the
   * scope-aware management endpoint.
   *
   * Employee-only users use /me/history.
   */
  const isManagementView = canRecommend || canApprove;

  const loadRegularizations = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);

      const query = {
        page,
        limit: 10,

        status: status === "ALL" ? undefined : status,
      };

      const result = isManagementView
        ? await attendanceRegularizationService.list(company._id, query)
        : await attendanceRegularizationService.getMyHistory(
            company._id,
            query,
          );

      setData(result);
    } catch (error) {
      setData(null);

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load attendance regularization requests.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, status, isManagementView]);

  useEffect(() => {
    void loadRegularizations();
  }, [loadRegularizations]);

  const items = data?.items ?? [];

  const summary = useMemo(() => {
    return {
      total: items.length,

      pending: items.filter((item) => item.status === "PENDING").length,

      recommended: items.filter((item) => item.status === "RECOMMENDED").length,

      approved: items.filter((item) => item.status === "APPROVED").length,
    };
  }, [items]);

  function openAction(
    mode: ActionMode,
    regularization: AttendanceRegularization,
  ) {
    setSelectedRegularization(regularization);

    setActionMode(mode);

    setActionText("");
  }

  function closeAction() {
    if (isSubmittingAction) {
      return;
    }

    setActionMode(null);

    setSelectedRegularization(null);

    setActionText("");
  }

  async function handleActionSubmit() {
    if (!company?._id || !selectedRegularization || !actionMode) {
      return;
    }

    if (actionMode === "REJECT" && actionText.trim().length < 3) {
      toast.error("Please provide a rejection reason.");

      return;
    }

    try {
      setIsSubmittingAction(true);

      if (actionMode === "RECOMMEND") {
        await attendanceRegularizationService.recommend(
          company._id,
          selectedRegularization._id,
          {
            note: actionText.trim(),
          },
        );

        toast.success("Regularization request recommended successfully.");
      }

      if (actionMode === "APPROVE") {
        await attendanceRegularizationService.approve(
          company._id,
          selectedRegularization._id,
          {
            note: actionText.trim(),
          },
        );

        toast.success(
          "Regularization request approved and applied successfully.",
        );
      }

      if (actionMode === "REJECT") {
        await attendanceRegularizationService.reject(
          company._id,
          selectedRegularization._id,
          {
            reason: actionText.trim(),
          },
        );

        toast.success("Regularization request rejected successfully.");
      }

      if (actionMode === "CANCEL") {
        await attendanceRegularizationService.cancel(
          company._id,
          selectedRegularization._id,
          {
            reason: actionText.trim(),
          },
        );

        toast.success("Regularization request cancelled successfully.");
      }

      setActionMode(null);
      setSelectedRegularization(null);
      setActionText("");

      await loadRegularizations();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to process regularization request."),
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/attendance"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Attendance Regularization
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {isManagementView
                  ? "Review attendance correction requests within your authorized scope."
                  : "Request corrections for missed or incorrect attendance entries."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadRegularizations()}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {/* {canRequest && !isManagementView && ( */}
            {canRequest && (
              <Link
                href="/attendance/regularizations/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New Request
              </Link>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Requests" value={summary.total} />

          <SummaryCard label="Pending" value={summary.pending} />

          <SummaryCard label="Recommended" value={summary.recommended} />

          <SummaryCard label="Approved" value={summary.approved} />
        </div>

        {/* Filters */}
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {statusFilters.map((filter) => {
              const active = status === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setPage(1);

                    setStatus(filter.value);
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </section>

        {isLoading ? (
          <RegularizationLoadingState />
        ) : items.length === 0 ? (
          <EmptyRegularizationState canCreate={canRequest} />
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => {
                const itemCompanyAccessId =
                  typeof item.companyAccessId === "string"
                    ? item.companyAccessId
                    : item.companyAccessId._id;

                const isOwnRequest =
                  Boolean(currentCompanyAccessId) &&
                  itemCompanyAccessId === currentCompanyAccessId;

                return (
                  <RegularizationCard
                    key={item._id}
                    item={item}
                    isManagementView={isManagementView}
                    canRecommend={canRecommend && !isOwnRequest}
                    canApprove={canApprove && !isOwnRequest}
                    canCancel={canRequest && isOwnRequest}
                    onRecommend={() => openAction("RECOMMEND", item)}
                    onApprove={() => openAction("APPROVE", item)}
                    onReject={() => openAction("REJECT", item)}
                    onCancel={() => openAction("CANCEL", item)}
                  />
                );
              })}
            </div>

            <Pagination
              page={data?.pagination.page ?? 1}
              totalPages={data?.pagination.totalPages ?? 1}
              hasPreviousPage={data?.pagination.hasPreviousPage ?? false}
              hasNextPage={data?.pagination.hasNextPage ?? false}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          </>
        )}
      </div>

      {actionMode && selectedRegularization && (
        <RegularizationActionModal
          mode={actionMode}
          regularization={selectedRegularization}
          value={actionText}
          onChange={setActionText}
          onClose={closeAction}
          onSubmit={() => void handleActionSubmit()}
          isSubmitting={isSubmittingAction}
        />
      )}
    </>
  );
}

function RegularizationCard({
  item,
  isManagementView,
  canRecommend,
  canApprove,
  canCancel,
  onRecommend,
  onApprove,
  onReject,
  onCancel,
}: {
  item: AttendanceRegularization;

  isManagementView: boolean;

  canRecommend: boolean;
  canApprove: boolean;
  canCancel: boolean;

  onRecommend: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}) {
  const employeeName = getEmployeeName(item);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileClock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">
              {formatEnum(item.requestType)}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />

                {formatDate(item.attendanceDate)}
              </span>

              {isManagementView && employeeName && <span>{employeeName}</span>}

              {isManagementView && getEmployeeCode(item) && (
                <span>{getEmployeeCode(item)}</span>
              )}
            </div>
          </div>
        </div>

        <RegularizationStatusBadge status={item.status} />
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {item.originalCheckInAt && (
          <InfoCard
            label="Original check-in"
            value={formatDateTime(item.originalCheckInAt)}
          />
        )}

        {item.originalCheckOutAt && (
          <InfoCard
            label="Original checkout"
            value={formatDateTime(item.originalCheckOutAt)}
          />
        )}

        {item.requestedCheckInAt && (
          <InfoCard
            label="Requested check-in"
            value={formatDateTime(item.requestedCheckInAt)}
          />
        )}

        {item.requestedCheckOutAt && (
          <InfoCard
            label="Requested checkout"
            value={formatDateTime(item.requestedCheckOutAt)}
          />
        )}

        {item.requestedBreakStartAt && (
          <InfoCard
            label="Requested break start"
            value={formatDateTime(item.requestedBreakStartAt)}
          />
        )}

        {item.requestedBreakEndAt && (
          <InfoCard
            label="Requested break end"
            value={formatDateTime(item.requestedBreakEndAt)}
          />
        )}

        {item.requestedBreakExtensionMinutes != null && (
          <InfoCard
            label="Break extension"
            value={`${item.requestedBreakExtensionMinutes} min`}
          />
        )}

        <InfoCard
          label="Application"
          value={formatEnum(item.applicationStatus)}
        />
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Reason
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">{item.reason}</p>
      </div>

      {(item.recommendationNote ||
        item.approvalNote ||
        item.rejectionReason ||
        item.cancellationReason) && (
        <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2">
          {item.recommendationNote && (
            <InfoCard
              label="Recommendation note"
              value={item.recommendationNote}
            />
          )}

          {item.approvalNote && (
            <InfoCard label="Approval note" value={item.approvalNote} />
          )}

          {item.rejectionReason && (
            <InfoCard label="Rejection reason" value={item.rejectionReason} />
          )}

          {item.cancellationReason && (
            <InfoCard
              label="Cancellation reason"
              value={item.cancellationReason}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Submitted {formatDateTime(item.createdAt)}
        </p>

        <div className="flex flex-wrap gap-2">
          {canCancel && item.status === "PENDING" && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Cancel Request
            </button>
          )}

          {canRecommend && item.status === "PENDING" && (
            <button
              type="button"
              onClick={onRecommend}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <ThumbsUp className="h-4 w-4" />
              Recommend
            </button>
          )}

          {canApprove && ["PENDING", "RECOMMENDED"].includes(item.status) && (
            <>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>

              <button
                type="button"
                onClick={onApprove}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function RegularizationActionModal({
  mode,
  regularization,
  value,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  mode: Exclude<ActionMode, null>;

  regularization: AttendanceRegularization;

  value: string;

  onChange: (value: string) => void;

  onClose: () => void;

  onSubmit: () => void;

  isSubmitting: boolean;
}) {
  const title =
    mode === "RECOMMEND"
      ? "Recommend Request"
      : mode === "APPROVE"
        ? "Approve Request"
        : mode === "REJECT"
          ? "Reject Request"
          : "Cancel Request";

  const label =
    mode === "REJECT"
      ? "Rejection reason"
      : mode === "CANCEL"
        ? "Cancellation reason"
        : "Note";

  const description =
    mode === "APPROVE"
      ? "Approval will apply this correction to the attendance record and trigger recalculation."
      : mode === "RECOMMEND"
        ? "Recommend this request for final approval."
        : mode === "REJECT"
          ? "Provide the reason for rejecting this attendance correction."
          : "You can optionally explain why this request is being cancelled.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-400">Request</p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatEnum(regularization.requestType)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatDate(regularization.attendanceDate)}
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {label}

            {mode === "REJECT" && <span className="ml-1 text-red-500">*</span>}
          </label>

          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={
              mode === "REJECT"
                ? "Enter rejection reason..."
                : "Add an optional note..."
            }
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : title}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function RegularizationStatusBadge({
  status,
}: {
  status: AttendanceRegularizationStatus;
}) {
  const className =
    status === "PENDING"
      ? "bg-amber-50 text-amber-700"
      : status === "RECOMMENDED"
        ? "bg-blue-50 text-blue-700"
        : status === "APPROVED"
          ? "bg-emerald-50 text-emerald-700"
          : status === "REJECTED"
            ? "bg-red-50 text-red-700"
            : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {formatEnum(status)}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;

  hasPreviousPage: boolean;
  hasNextPage: boolean;

  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={onPrevious}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={!hasNextPage}
          onClick={onNext}
          className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EmptyRegularizationState({ canCreate }: { canCreate: boolean }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <FileClock className="mx-auto h-9 w-9 text-slate-300" />

      <h2 className="mt-4 font-semibold text-slate-900">
        No regularization requests
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        No attendance correction requests were found for the selected filter.
      </p>

      {canCreate && (
        <Link
          href="/attendance/regularizations/new"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Link>
      )}
    </section>
  );
}

function RegularizationLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}

function getEmployeeName(item: AttendanceRegularization) {
  if (!item.employeeId || typeof item.employeeId === "string") {
    return "";
  }

  const user = item.employeeId.userId;

  if (!user || typeof user === "string") {
    return "";
  }

  if (user.displayName) {
    return user.displayName;
  }

  return [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");
}

function getEmployeeCode(item: AttendanceRegularization) {
  if (!item.companyAccessId || typeof item.companyAccessId === "string") {
    return "";
  }

  return item.companyAccessId.employeeCode ?? "";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
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

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatEnum(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
