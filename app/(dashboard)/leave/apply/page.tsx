"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { leaveRequestService } from "@/features/leave/services/leave-request.service";
import { leaveTypeService } from "@/features/leave/services/leave-type.service";
import { leaveBalanceService } from "@/features/leave/services/leave-balance.service";

import type {
  LeaveBalance,
  LeaveDayPortion,
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
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [form, setForm] = useState<ApplyLeaveForm>(initialForm);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =========================================================
     SELECTED LEAVE TYPE
     ========================================================= */

  /* =========================================================
   SELECTED LEAVE TYPE
   ========================================================= */

  const selectedLeaveType = useMemo(() => {
    return (
      leaveTypes.find((leaveType) => leaveType._id === form.leaveTypeId) ?? null
    );
  }, [leaveTypes, form.leaveTypeId]);

  const selectedLeaveBalance = useMemo(() => {
    if (!selectedLeaveType) {
      return null;
    }

    return (
      leaveBalances.find((balance) => {
        const leaveTypeId =
          typeof balance.leaveTypeId === "string"
            ? balance.leaveTypeId
            : balance.leaveTypeId?._id;

        return leaveTypeId === selectedLeaveType._id;
      }) ?? null
    );
  }, [leaveBalances, selectedLeaveType]);

  const availableBalance = useMemo(() => {
    if (!selectedLeaveBalance) {
      return 0;
    }

    return (
      Number(selectedLeaveBalance.allocatedDays ?? 0) +
      Number(selectedLeaveBalance.accruedDays ?? 0) +
      Number(selectedLeaveBalance.carriedForwardDays ?? 0) +
      Number(selectedLeaveBalance.adjustedDays ?? 0) -
      Number(selectedLeaveBalance.pendingDays ?? 0) -
      Number(selectedLeaveBalance.usedDays ?? 0) -
      Number(selectedLeaveBalance.lapsedDays ?? 0)
    );
  }, [selectedLeaveBalance]);

  const selectedPeriodKey = useMemo(() => {
    if (!form.fromDate || !form.toDate) {
      return null;
    }

    // V1 eligibility calculation handles one calendar month at a time.
    if (form.fromDate.slice(0, 7) !== form.toDate.slice(0, 7)) {
      return null;
    }

    return form.fromDate.slice(0, 7);
  }, [form.fromDate, form.toDate]);

  const selectedCalendarDays = useMemo(() => {
    if (!form.fromDate || !form.toDate) {
      return 0;
    }

    const fromDate = new Date(`${form.fromDate}T00:00:00`);
    const toDate = new Date(`${form.toDate}T00:00:00`);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      toDate < fromDate
    ) {
      return 0;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return (
      Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) +
      1
    );
  }, [form.fromDate, form.toDate]);

  const leaveEligibility = useMemo(() => {
    return leaveTypes.map((leaveType) => {
      const balance = leaveBalances.find(
        (item) => getLeaveTypeIdFromBalance(item) === leaveType._id,
      );

      const usableDays = getUsableLeaveDaysForPeriod(
        leaveType,
        balance,
        selectedPeriodKey,
      );

      return {
        leaveType,
        balance,
        usableDays,
      };
    });
  }, [leaveTypes, leaveBalances, selectedPeriodKey]);

  const hasSelectedDates = Boolean(form.fromDate && form.toDate);

  const hasUsablePaidLeave = useMemo(() => {
    if (!hasSelectedDates || !selectedPeriodKey) {
      return false;
    }

    return leaveEligibility.some(
      ({ leaveType, usableDays }) =>
        leaveType.paymentType === "PAID" && usableDays > 0,
    );
  }, [leaveEligibility, hasSelectedDates, selectedPeriodKey]);

  const selectableLeaveTypes = useMemo(() => {
    if (!hasSelectedDates || !selectedPeriodKey) {
      return [];
    }

    return leaveTypes.filter((leaveType) => {
      /*
       * Paid leave is selectable only when it is actually usable
       * for the selected period.
       */
      if (leaveType.paymentType === "PAID") {
        const eligibility = leaveEligibility.find(
          (item) => item.leaveType._id === leaveType._id,
        );

        return (eligibility?.usableDays ?? 0) > 0;
      }

      /*
       * Unpaid leave becomes selectable only when there is
       * no usable paid leave for the selected period.
       */
      return !hasUsablePaidLeave;
    });
  }, [
    leaveTypes,
    leaveEligibility,
    hasSelectedDates,
    selectedPeriodKey,
    hasUsablePaidLeave,
  ]);

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

  const exceedsMaximumConsecutiveDays =
    selectedLeaveType?.maximumConsecutiveDays != null &&
    selectedCalendarDays > selectedLeaveType.maximumConsecutiveDays;

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
   LOAD READABLE LEAVE BALANCES
   ========================================================= */

  useEffect(() => {
    async function loadLeaveBalances() {
      if (!company?._id || !permissions.includes("leave.balance_read")) {
        setLeaveBalances([]);
        setIsLoadingBalances(false);
        return;
      }

      try {
        setIsLoadingBalances(true);

        const result = await leaveBalanceService.list(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
        });

        setLeaveBalances(result.items);
      } catch (error) {
        setLeaveBalances([]);

        toast.error(
          getApiErrorMessage(error, "Unable to load your leave balances."),
        );
      } finally {
        setIsLoadingBalances(false);
      }
    }

    void loadLeaveBalances();
  }, [company?._id, permissions]);

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

    if (exceedsMaximumConsecutiveDays) {
      toast.error(
        `${selectedLeaveType?.name ?? "This leave type"} allows a maximum of ${
          selectedLeaveType?.maximumConsecutiveDays
        } consecutive day${
          selectedLeaveType?.maximumConsecutiveDays === 1 ? "" : "s"
        }.`,
      );

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

              {!isLoadingTypes && leaveTypes.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    Your leave availability
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Review your paid leave availability before selecting unpaid
                    leave.
                  </p>

                  <div className="mt-3 space-y-2">
                    {leaveEligibility.map(
                      ({ leaveType, balance, usableDays }) => {
                        const aggregateAvailable = balance
                          ? Number(balance.allocatedDays ?? 0) +
                            Number(balance.accruedDays ?? 0) +
                            Number(balance.carriedForwardDays ?? 0) +
                            Number(balance.adjustedDays ?? 0) -
                            Number(balance.pendingDays ?? 0) -
                            Number(balance.usedDays ?? 0) -
                            Number(balance.lapsedDays ?? 0)
                          : 0;

                        const monthlyBalance =
                          selectedPeriodKey &&
                          leaveType.allocationMethod === "MONTHLY_ACCRUAL"
                            ? balance?.monthlyBalances?.find(
                                (item) => item.periodKey === selectedPeriodKey,
                              )
                            : undefined;

                        const monthlyUsageReached =
                          selectedPeriodKey != null &&
                          leaveType.allocationMethod === "MONTHLY_ACCRUAL" &&
                          leaveType.maximumMonthlyUsageDays != null &&
                          Number(monthlyBalance?.usedDays ?? 0) +
                            Number(monthlyBalance?.pendingDays ?? 0) >=
                            Number(leaveType.maximumMonthlyUsageDays);

                        return (
                          <div
                            key={leaveType._id}
                            className="flex flex-col gap-1 rounded-lg bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {leaveType.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {leaveType.paymentType === "PAID"
                                  ? "Paid leave"
                                  : "Unpaid leave"}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              {!form.fromDate || !form.toDate ? (
                                leaveType.requiresBalance ? (
                                  isLoadingBalances ? (
                                    <p className="text-xs text-slate-400">
                                      Loading balance...
                                    </p>
                                  ) : balance ? (
                                    <>
                                      <p className="text-sm font-bold text-slate-900">
                                        {formatDays(aggregateAvailable)} total
                                        balance
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-500">
                                        Select dates to check availability
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-xs font-semibold text-amber-700">
                                      No balance available
                                    </p>
                                  )
                                ) : (
                                  <p className="text-xs font-semibold text-amber-700">
                                    No balance required
                                  </p>
                                )
                              ) : leaveType.paymentType === "UNPAID" ? (
                                <p className="text-xs font-semibold text-amber-700">
                                  Unpaid leave
                                </p>
                              ) : !balance ? (
                                <p className="text-xs font-semibold text-amber-700">
                                  No balance available
                                </p>
                              ) : usableDays > 0 ? (
                                <>
                                  <p className="text-sm font-bold text-emerald-700">
                                    {formatDays(usableDays)} usable
                                  </p>

                                  {aggregateAvailable !== usableDays && (
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {formatDays(aggregateAvailable)} total
                                      balance
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-bold text-amber-700">
                                    Not available for selected dates
                                  </p>

                                  {monthlyUsageReached && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Monthly usage limit reached
                                    </p>
                                  )}
                                  {aggregateAvailable > 0 && (
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {formatDays(aggregateAvailable)} remain in
                                      your total balance
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>

            {exceedsMaximumConsecutiveDays && selectedLeaveType && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Selected leave period exceeds the allowed consecutive leave
                  limit.
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  {selectedLeaveType.name} allows a maximum of{" "}
                  {selectedLeaveType.maximumConsecutiveDays} consecutive day
                  {selectedLeaveType.maximumConsecutiveDays === 1 ? "" : "s"}.
                  You selected {selectedCalendarDays} calendar day
                  {selectedCalendarDays === 1 ? "" : "s"}.
                </p>
              </div>
            )}

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
                leaveTypes.length === 0 ||
                exceedsMaximumConsecutiveDays
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
                    label="Available balance"
                    value={
                      isLoadingBalances
                        ? "Loading..."
                        : selectedLeaveBalance
                          ? formatDays(availableBalance)
                          : "No balance available"
                    }
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

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-blue-950">
              Before submitting
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Leave duration, balance availability and company policy rules will
              be validated by the system when you submit the request.
            </p>
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

function getLeaveTypeIdFromBalance(balance: LeaveBalance) {
  return typeof balance.leaveTypeId === "string"
    ? balance.leaveTypeId
    : balance.leaveTypeId?._id;
}

function getUsableLeaveDaysForPeriod(
  leaveType: LeaveType,
  balance: LeaveBalance | undefined,
  periodKey: string | null,
) {
  if (leaveType.paymentType !== "PAID") {
    return 0;
  }

  if (!leaveType.requiresBalance) {
    return Number.POSITIVE_INFINITY;
  }

  if (!balance) {
    return 0;
  }

  const aggregateAvailable =
    Number(balance.allocatedDays ?? 0) +
    Number(balance.accruedDays ?? 0) +
    Number(balance.carriedForwardDays ?? 0) +
    Number(balance.adjustedDays ?? 0) -
    Number(balance.pendingDays ?? 0) -
    Number(balance.usedDays ?? 0) -
    Number(balance.lapsedDays ?? 0);

  if (aggregateAvailable <= 0) {
    return 0;
  }

  /*
   * Non-monthly leave types can use the aggregate balance.
   */
  if (leaveType.allocationMethod !== "MONTHLY_ACCRUAL") {
    return aggregateAvailable;
  }

  /*
   * Monthly eligibility depends on the selected month.
   */
  if (!periodKey) {
    return 0;
  }

  const monthlyBalance = balance.monthlyBalances?.find(
    (item) => item.periodKey === periodKey,
  );

  if (!monthlyBalance) {
    return 0;
  }

  const monthlyAvailable =
    Number(monthlyBalance.creditedDays ?? 0) +
    Number(monthlyBalance.adjustedDays ?? 0) -
    Number(monthlyBalance.pendingDays ?? 0) -
    Number(monthlyBalance.usedDays ?? 0) -
    Number(monthlyBalance.lapsedDays ?? 0);

  if (monthlyAvailable <= 0) {
    return 0;
  }

  /*
   * A monthly usage cap is separate from balance.
   *
   * Pending requests are included because those days are already
   * reserved and should not be offered again in the UI.
   */
  if (leaveType.maximumMonthlyUsageDays != null) {
    const alreadyCommitted =
      Number(monthlyBalance.usedDays ?? 0) +
      Number(monthlyBalance.pendingDays ?? 0);

    const remainingMonthlyUsage = Math.max(
      0,
      Number(leaveType.maximumMonthlyUsageDays) - alreadyCommitted,
    );

    return Math.max(
      0,
      Math.min(aggregateAvailable, monthlyAvailable, remainingMonthlyUsage),
    );
  }

  return Math.max(0, Math.min(aggregateAvailable, monthlyAvailable));
}
