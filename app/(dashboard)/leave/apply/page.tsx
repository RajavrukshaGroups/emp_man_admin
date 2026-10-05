"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { leaveRequestService } from "@/features/leave/services/leave-request.service";
import { leaveTypeService } from "@/features/leave/services/leave-type.service";

import type {
  LeaveDayPortion,
  LeaveRequestPreview,
  LeaveType,
} from "@/features/leave/types/leave.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

interface ApplyLeaveForm {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  startDayPortion: LeaveDayPortion;
  endDayPortion: LeaveDayPortion;
  reason: string;
  attachmentUrl: string;
}

const initialForm: ApplyLeaveForm = {
  leaveTypeId: "",
  fromDate: "",
  toDate: "",
  startDayPortion: "FULL_DAY",
  endDayPortion: "FULL_DAY",
  reason: "",
  attachmentUrl: "",
};

export default function ApplyLeavePage() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canApply = permissions.includes("leave.apply");

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState<ApplyLeaveForm>(initialForm);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [preview, setPreview] = useState<LeaveRequestPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  /* =========================================================
     SELECTED LEAVE TYPE
     ========================================================= */
  const selectedLeaveType = useMemo(() => {
    return (
      leaveTypes.find((leaveType) => leaveType._id === form.leaveTypeId) ?? null
    );
  }, [leaveTypes, form.leaveTypeId]);

  const hasSelectedDates = Boolean(form.fromDate && form.toDate);

  const selectableLeaveTypes = useMemo(() => {
    if (!hasSelectedDates) {
      return [];
    }

    return leaveTypes.filter((leaveType) => {
      /*
       * Leave types returned by this page are already ACTIVE.
       *
       * Do not hide a paid leave type merely because the frontend
       * cannot see an accrued balance for the selected dates.
       *
       * The backend is authoritative for:
       * - current balance
       * - monthly entitlement
       * - future projected entitlement
       * - monthly usage limits
       * - maximum consecutive paid days
       * - automatic paid -> LOP overflow
       * - cross-month allocation
       */
      return leaveType.status === "ACTIVE";
    });
  }, [leaveTypes, hasSelectedDates]);
  useEffect(() => {
    if (!form.leaveTypeId) {
      return;
    }

    const isStillSelectable = selectableLeaveTypes.some(
      (leaveType) => leaveType._id === form.leaveTypeId,
    );

    if (!isStillSelectable) {
      setForm((current) => ({
        ...current,
        leaveTypeId: "",
      }));
    }
  }, [selectableLeaveTypes, form.leaveTypeId]);

  /* =========================================================
     LOAD ACTIVE LEAVE TYPES
     ========================================================= */

  useEffect(() => {
    async function loadLeaveTypes() {
      if (!company?._id || !canApply) {
        setIsLoadingTypes(false);
        return;
      }

      try {
        setIsLoadingTypes(true);

        const result = await leaveTypeService.list(company._id, {
          status: "ACTIVE",
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        });

        setLeaveTypes(result.items);
      } catch (error) {
        setLeaveTypes([]);

        toast.error(
          getApiErrorMessage(error, "Unable to load available leave types."),
        );
      } finally {
        setIsLoadingTypes(false);
      }
    }

    void loadLeaveTypes();
  }, [company?._id, canApply]);

  /* =========================================================
   LEAVE REQUEST PREVIEW
   ========================================================= */

  useEffect(() => {
    if (
      !company?._id ||
      !canApply ||
      !form.leaveTypeId ||
      !form.fromDate ||
      !form.toDate ||
      form.toDate < form.fromDate
    ) {
      setPreview(null);
      setPreviewError(null);
      setIsLoadingPreview(false);
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingPreview(true);
        setPreviewError(null);

        const startDayPortion =
          selectedLeaveType?.allowHalfDay === false
            ? "FULL_DAY"
            : form.startDayPortion;

        const endDayPortion =
          selectedLeaveType?.allowHalfDay === false
            ? "FULL_DAY"
            : form.endDayPortion;

        const result = await leaveRequestService.preview(company._id, {
          leaveTypeId: form.leaveTypeId,
          fromDate: form.fromDate,
          toDate: form.toDate,
          startDayPortion,
          endDayPortion,

          /*
           * Preview uses the same validation schema as create.
           * The reason must therefore satisfy the backend validation.
           */
          reason:
            form.reason.trim().length >= 3
              ? form.reason.trim()
              : "Leave preview",

          attachmentUrl: form.attachmentUrl.trim() || undefined,
        });

        if (cancelled) {
          return;
        }

        setPreview(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPreview(null);
        setPreviewError(
          getApiErrorMessage(error, "Unable to calculate leave preview."),
        );
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    company?._id,
    canApply,
    form.leaveTypeId,
    form.fromDate,
    form.toDate,
    form.startDayPortion,
    form.endDayPortion,
    form.reason,
    form.attachmentUrl,
    selectedLeaveType,
  ]);

  /* =========================================================
     FORM UPDATE
     ========================================================= */

  function updateForm<K extends keyof ApplyLeaveForm>(
    key: K,
    value: ApplyLeaveForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =========================================================
     SUBMIT
     ========================================================= */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Company information is unavailable.");
      return;
    }

    if (!canApply) {
      toast.error("You do not have permission to apply for leave.");
      return;
    }

    if (!form.leaveTypeId) {
      toast.error("Please select a leave type.");
      return;
    }

    if (!form.fromDate || !form.toDate) {
      toast.error("Please select the leave dates.");
      return;
    }

    if (form.toDate < form.fromDate) {
      toast.error("To date cannot be earlier than from date.");
      return;
    }

    if (form.reason.trim().length < 3) {
      toast.error("Please provide a valid reason for leave.");
      return;
    }

    /*
     * If the selected leave type does not support half-days,
     * force both portions to FULL_DAY.
     */
    const startDayPortion =
      selectedLeaveType?.allowHalfDay === false
        ? "FULL_DAY"
        : form.startDayPortion;

    const endDayPortion =
      selectedLeaveType?.allowHalfDay === false
        ? "FULL_DAY"
        : form.endDayPortion;

    try {
      setIsSubmitting(true);

      await leaveRequestService.create(company._id, {
        leaveTypeId: form.leaveTypeId,

        fromDate: form.fromDate,
        toDate: form.toDate,

        startDayPortion,
        endDayPortion,

        reason: form.reason.trim(),

        attachmentUrl: form.attachmentUrl.trim() || undefined,
      });

      toast.success("Leave request submitted successfully.");

      router.push("/leave/requests");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit leave request."));
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =========================================================
     PERMISSION STATE
     ========================================================= */

  if (!canApply) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Leave application unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            You do not have permission to submit leave requests.
          </p>

          <Link
            href="/leave"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            Back to Leave
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* =====================================================
            FORM
           ===================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Leave details</h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the leave period and reason for your request.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Dates */}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="From date" required>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(event) =>
                    updateForm("fromDate", event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </FormField>

              <FormField label="To date" required>
                <input
                  type="date"
                  value={form.toDate}
                  min={form.fromDate || undefined}
                  onChange={(event) => updateForm("toDate", event.target.value)}
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </FormField>
            </div>

            {/* Leave Type */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Leave type
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                value={form.leaveTypeId}
                onChange={(event) =>
                  updateForm("leaveTypeId", event.target.value)
                }
                disabled={isLoadingTypes || isSubmitting || !hasSelectedDates}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingTypes
                    ? "Loading leave types..."
                    : !hasSelectedDates
                      ? "Select leave dates first"
                      : "Select leave type"}
                </option>

                {selectableLeaveTypes.map((leaveType) => (
                  <option key={leaveType._id} value={leaveType._id}>
                    {leaveType.name} ({leaveType.code}) —{" "}
                    {leaveType.paymentType === "PAID" ? "Paid" : "Unpaid"}{" "}
                  </option>
                ))}
              </select>

              {!isLoadingTypes && leaveTypes.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No active leave types are currently available.
                </p>
              )}
            </div>

            {/* Portions */}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First day">
                <select
                  value={form.startDayPortion}
                  onChange={(event) =>
                    updateForm(
                      "startDayPortion",
                      event.target.value as LeaveDayPortion,
                    )
                  }
                  disabled={
                    isSubmitting || selectedLeaveType?.allowHalfDay === false
                  }
                  className={inputClassName}
                >
                  <option value="FULL_DAY">Full day</option>
                  <option value="FIRST_HALF">First half</option>
                  <option value="SECOND_HALF">Second half</option>
                </select>
              </FormField>

              <FormField label="Last day">
                <select
                  value={form.endDayPortion}
                  onChange={(event) =>
                    updateForm(
                      "endDayPortion",
                      event.target.value as LeaveDayPortion,
                    )
                  }
                  disabled={
                    isSubmitting || selectedLeaveType?.allowHalfDay === false
                  }
                  className={inputClassName}
                >
                  <option value="FULL_DAY">Full day</option>
                  <option value="FIRST_HALF">First half</option>
                  <option value="SECOND_HALF">Second half</option>
                </select>
              </FormField>
            </div>

            {selectedLeaveType?.allowHalfDay === false && (
              <p className="-mt-3 text-xs text-slate-500">
                Half-day applications are not available for this leave type.
              </p>
            )}

            {/* Reason */}

            <FormField label="Reason" required>
              <textarea
                value={form.reason}
                onChange={(event) => updateForm("reason", event.target.value)}
                rows={5}
                maxLength={1000}
                disabled={isSubmitting}
                placeholder="Enter the reason for your leave..."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {form.reason.length}/1000
              </div>
            </FormField>

            {/* Attachment URL */}

            <FormField label="Attachment URL">
              <input
                type="url"
                value={form.attachmentUrl}
                onChange={(event) =>
                  updateForm("attachmentUrl", event.target.value)
                }
                disabled={isSubmitting}
                placeholder="https://..."
                className={inputClassName}
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Add a supporting document URL when required by the selected
                leave type.
              </p>
            </FormField>
          </div>

          {/* Actions */}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
            <Link
              href="/leave"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingTypes ||
                isLoadingPreview ||
                leaveTypes.length === 0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Leave Request
                </>
              )}
            </button>
          </div>
        </section>

        {/* =====================================================
            LEAVE TYPE INFORMATION
           ===================================================== */}

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">Leave information</h2>

                <p className="text-xs text-slate-500">Selected leave type</p>
              </div>
            </div>

            {!selectedLeaveType ? (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Select a leave type to view its application rules.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                <InfoRow label="Leave type" value={selectedLeaveType.name} />

                <InfoRow
                  label="Payment"
                  value={formatEnum(selectedLeaveType.paymentType)}
                />

                {selectedLeaveType.requiresBalance ? (
                  <InfoRow
                    label="Balance"
                    value="Validated for selected dates"
                  />
                ) : (
                  <InfoRow label="Balance" value="Not required" />
                )}

                <InfoRow
                  label="Allocation"
                  value={formatEnum(selectedLeaveType.allocationMethod)}
                />

                {selectedLeaveType.allocationMethod === "MONTHLY_ACCRUAL" && (
                  <>
                    <InfoRow
                      label="Monthly entitlement"
                      value={`${formatDays(
                        selectedLeaveType.monthlyEntitlementDays,
                      )} / month`}
                    />

                    <InfoRow
                      label="Maximum monthly usage"
                      value={
                        selectedLeaveType.maximumMonthlyUsageDays == null
                          ? "No monthly cap"
                          : `${formatDays(
                              selectedLeaveType.maximumMonthlyUsageDays,
                            )} / month`
                      }
                    />
                  </>
                )}

                <InfoRow
                  label="Half day"
                  value={
                    selectedLeaveType.allowHalfDay ? "Allowed" : "Not allowed"
                  }
                />

                <InfoRow
                  label="Notice required"
                  value={`${selectedLeaveType.minimumNoticeDays ?? 0} day(s)`}
                />

                {selectedLeaveType.maximumConsecutiveDays != null && (
                  <InfoRow
                    label="Maximum consecutive"
                    value={`${selectedLeaveType.maximumConsecutiveDays} day(s)`}
                  />
                )}

                <InfoRow
                  label="Attachment"
                  value={
                    selectedLeaveType.requireAttachment
                      ? "Required"
                      : "Not required"
                  }
                />
                {selectedLeaveType.paymentType === "UNPAID" && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-900">
                      Unpaid leave
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      This leave type does not use your paid leave balance. If
                      approved, it may result in salary deduction for the
                      selected leave period.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Leave summary
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Based on the selected dates and current leave entitlement.
                </p>
              </div>

              {isLoadingPreview && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
              )}
            </div>

            {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Select the leave dates and leave type to view the leave summary.
              </p>
            ) : isLoadingPreview && !preview ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating leave allocation...
              </div>
            ) : previewError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700">
                  Unable to calculate leave summary
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  {previewError}
                </p>
              </div>
            ) : preview ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <PreviewStat
                    label="Requested"
                    value={formatDays(preview.requestedDays)}
                  />

                  <PreviewStat
                    label="Paid"
                    value={formatDays(preview.paidDays)}
                  />

                  <PreviewStat
                    label="Unpaid"
                    value={formatDays(preview.unpaidDays)}
                  />
                </div>

                {preview.dateDetails.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Date allocation
                    </p>

                    <div className="space-y-2">
                      {preview.dateDetails.map((detail) => (
                        <div
                          key={detail.date}
                          className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800">
                              {formatPreviewDate(detail.date)}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {getPreviewAllocationLabel(detail)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${
                              detail.allocationType === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : detail.allocationType === "MIXED"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {formatEnum(detail.allocationType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {preview.payrollAdjustmentRequired &&
                  preview.unpaidDays > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-bold text-amber-900">
                        Payroll adjustment
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        {formatDays(preview.unpaidDays)} of this request will be
                        treated as unpaid leave and may result in salary
                        deduction if approved.
                      </p>
                    </div>
                  )}

                {!preview.payrollAdjustmentRequired && preview.paidDays > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-800">
                      The selected leave period is currently covered by paid
                      leave entitlement.
                    </p>
                  </div>
                )}

                <p className="text-[11px] leading-5 text-slate-400">
                  This is a preview. The final allocation is recalculated when
                  the request is submitted.
                </p>
              </div>
            ) : null}
          </section>
        </aside>
      </form>
    </div>
  );
}

/* =========================================================
   PAGE HEADER
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
          Apply Leave
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Submit a new leave request for approval.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FORM HELPERS
   ========================================================= */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatPreviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getPreviewAllocationLabel(
  detail: LeaveRequestPreview["dateDetails"][number],
) {
  if (detail.allocationType === "MIXED") {
    return `${formatDays(detail.paidDays)} paid + ${formatDays(
      detail.unpaidDays,
    )} unpaid`;
  }

  if (detail.allocationType === "PAID") {
    return detail.paidLeaveTypeName || "Paid leave";
  }

  if (detail.allocationType === "UNPAID") {
    return detail.unpaidLeaveTypeName || "Unpaid leave";
  }

  return formatEnum(detail.dayClassification);
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-500";

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

function formatDays(value: number) {
  const normalized = Number(Number(value ?? 0).toFixed(2));

  return `${normalized} day${normalized === 1 ? "" : "s"}`;
}
