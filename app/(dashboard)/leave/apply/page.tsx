"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { leaveRequestService } from "@/features/leave/services/leave-request.service";
import { leaveTypeService } from "@/features/leave/services/leave-type.service";

import { workCalendarService } from "@/features/work-calendar/services/work-calendar.service";

import type { ResolvedWorkDay } from "@/features/work-calendar/types/work-calendar.types";

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

  const today = useMemo(() => new Date(), []);

  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

  const [calendarDays, setCalendarDays] = useState<ResolvedWorkDay[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);

  const calendarMonthRange = useMemo(() => {
    const fromDate = `${calendarYear}-${String(calendarMonth + 1).padStart(
      2,
      "0",
    )}-01`;

    const lastDay = new Date(
      Date.UTC(calendarYear, calendarMonth + 1, 0),
    ).getUTCDate();

    const toDate = `${calendarYear}-${String(calendarMonth + 1).padStart(
      2,
      "0",
    )}-${String(lastDay).padStart(2, "0")}`;

    return {
      fromDate,
      toDate,
    };
  }, [calendarYear, calendarMonth]);
  /* =========================================================
     SELECTED LEAVE TYPE
     ========================================================= */
  const selectedLeaveType = useMemo(() => {
    return (
      leaveTypes.find((leaveType) => leaveType._id === form.leaveTypeId) ?? null
    );
  }, [leaveTypes, form.leaveTypeId]);

  const hasSelectedDates = Boolean(form.fromDate && form.toDate);

  const isSingleDayLeave =
    Boolean(form.fromDate && form.toDate) && form.fromDate === form.toDate;

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
   LOAD RESOLVED WORK CALENDAR
   ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadResolvedCalendar() {
      if (!company?._id) {
        setCalendarDays([]);
        return;
      }

      try {
        setIsLoadingCalendar(true);

        const result = await workCalendarService.resolveRange(
          company._id,
          calendarMonthRange.fromDate,
          calendarMonthRange.toDate,
        );

        if (cancelled) {
          return;
        }

        setCalendarDays(result.days);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCalendarDays([]);

        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load the company work calendar.",
          ),
        );
      } finally {
        if (!cancelled) {
          setIsLoadingCalendar(false);
        }
      }
    }

    void loadResolvedCalendar();

    return () => {
      cancelled = true;
    };
  }, [company?._id, calendarMonthRange.fromDate, calendarMonthRange.toDate]);

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
    setPreview(null);
    setPreviewError(null);
    setIsLoadingPreview(true);

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

  function handleCalendarDateClick(date: string) {
    if (isSubmitting) {
      return;
    }

    // First click:
    // immediately treat it as a valid single-day leave.
    if (!selectionAnchor) {
      setSelectionAnchor(date);

      setForm((current) => ({
        ...current,
        fromDate: date,
        toDate: date,
      }));

      return;
    }

    // Clicking the same date again keeps it as a single-day request.
    if (selectionAnchor === date) {
      setForm((current) => ({
        ...current,
        fromDate: date,
        toDate: date,
      }));

      setSelectionAnchor(null);
      return;
    }

    // Second click completes the leave period.
    const fromDate = date < selectionAnchor ? date : selectionAnchor;
    const toDate = date < selectionAnchor ? selectionAnchor : date;

    setForm((current) => ({
      ...current,
      fromDate,
      toDate,
    }));

    setSelectionAnchor(null);
  }

  function goToPreviousMonth() {
    setSelectionAnchor(null);

    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((current) => current - 1);
      return;
    }

    setCalendarMonth((current) => current - 1);
  }

  function goToNextMonth() {
    setSelectionAnchor(null);

    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((current) => current + 1);
      return;
    }

    setCalendarMonth((current) => current + 1);
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

            {/* Leave Date Calendar */}

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Leave dates
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Select a date for one-day leave, or select a start and end
                    date for multiple days.
                  </p>
                </div>
                <Link
                  href="/work-calendar"
                  className="w-fit shrink-0 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  View work calendar
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* Month navigation */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    disabled={isSubmitting || isLoadingCalendar}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-950">
                      {new Intl.DateTimeFormat("en-IN", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(
                        new Date(Date.UTC(calendarYear, calendarMonth, 1)),
                      )}
                    </p>

                    {isLoadingCalendar && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Loading company calendar...
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={goToNextMonth}
                    disabled={isSubmitting || isLoadingCalendar}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Week headings */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="py-2 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>

                {/* Calendar */}
                {isLoadingCalendar ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading calendar...
                    </div>
                  </div>
                ) : calendarDays.length === 0 ? (
                  <div className="flex min-h-64 items-center justify-center px-6 text-center">
                    <p className="text-sm text-slate-500">
                      Work calendar information is unavailable for this month.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-0.5 p-1 sm:gap-1 sm:p-2">
                    {Array.from({
                      length: new Date(
                        Date.UTC(calendarYear, calendarMonth, 1),
                      ).getUTCDay(),
                    }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="min-h-12 sm:min-h-14 lg:min-h-16"
                      />
                    ))}
                    {calendarDays.map((day) => {
                      const dayNumber = Number(day.date.slice(8, 10));

                      const isWeeklyOff = day.classification === "WEEKLY_OFF";
                      const isHoliday = day.classification === "HOLIDAY";
                      const isWorkingOverride =
                        day.source === "WORKING_DAY_OVERRIDE";

                      const isSelected =
                        Boolean(form.fromDate && form.toDate) &&
                        day.date >= form.fromDate &&
                        day.date <= form.toDate;

                      const isStart = day.date === form.fromDate;
                      const isEnd = day.date === form.toDate;

                      const isSelectionAnchor = day.date === selectionAnchor;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => handleCalendarDateClick(day.date)}
                          disabled={isSubmitting}
                          className={`relative min-h-12 rounded-lg border p-1.5 text-left transition sm:min-h-14 sm:p-2 lg:min-h-16 ${
                            isStart || isEnd || isSelectionAnchor
                              ? "border-slate-950 bg-slate-950 text-white"
                              : isSelected
                                ? "border-slate-200 bg-slate-100 text-slate-950"
                                : isHoliday
                                  ? "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
                                  : isWeeklyOff
                                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                    : isWorkingOverride
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span className="text-xs font-bold sm:text-sm">
                            {dayNumber}
                          </span>
                          <span
                            className={`mt-0.5 block truncate text-[9px] font-semibold sm:text-[10px] ${
                              isStart || isEnd || isSelectionAnchor
                                ? "text-white/80"
                                : isHoliday
                                  ? "text-blue-700"
                                  : isWeeklyOff
                                    ? "text-amber-700"
                                    : isWorkingOverride
                                      ? "text-emerald-700"
                                      : "text-slate-400"
                            }`}
                          >
                            {isHoliday ? (
                              day.name || "Holiday"
                            ) : isWeeklyOff ? (
                              <>
                                <span className="sm:hidden">Off</span>
                                <span className="hidden sm:inline">
                                  Weekly Off
                                </span>
                              </>
                            ) : isWorkingOverride ? (
                              <>
                                <span className="sm:hidden">Work</span>
                                <span className="hidden sm:inline">
                                  Working
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-950" />
                  Selected
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-amber-200 bg-amber-100" />
                  Weekly Off
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-blue-200 bg-blue-100" />
                  Holiday
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-emerald-200 bg-emerald-100" />
                  Working override
                </span>
              </div>

              {/* Selected period */}
              {form.fromDate && form.toDate ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Selected leave period
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-950">
                    <span>{formatPreviewDate(form.fromDate)}</span>

                    {form.fromDate !== form.toDate && (
                      <>
                        <span className="text-slate-400">→</span>
                        <span>{formatPreviewDate(form.toDate)}</span>
                      </>
                    )}
                  </div>

                  {selectionAnchor && (
                    <p className="mt-1 text-xs text-blue-600">
                      Select another date to complete the leave period.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Select a date from the calendar to begin.
                  </p>
                </div>
              )}
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

            {/* =====================================================
    LEAVE DURATION
===================================================== */}

            {selectedLeaveType && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Leave duration
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose whether you need a full day or a half day.
                  </p>
                </div>

                {!selectedLeaveType.allowHalfDay ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Full-day leave only
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      This leave type does not allow half-day applications.
                    </p>
                  </div>
                ) : isSingleDayLeave ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Day duration
                    </label>

                    <p className="mb-2 text-xs text-slate-500">
                      {formatPreviewDate(form.fromDate)}
                    </p>

                    <select
                      value={form.startDayPortion}
                      onChange={(event) => {
                        const value = event.target.value as LeaveDayPortion;

                        setForm((current) => ({
                          ...current,
                          startDayPortion: value,
                          endDayPortion: value,
                        }));
                      }}
                      disabled={isSubmitting}
                      className={inputClassName}
                    >
                      <option value="FULL_DAY">Full day</option>
                      <option value="FIRST_HALF">First half</option>
                      <option value="SECOND_HALF">Second half</option>
                    </select>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Start date duration */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Start date duration
                      </label>

                      <p className="mb-2 text-xs text-slate-500">
                        {formatPreviewDate(form.fromDate)}
                      </p>

                      <select
                        value={form.startDayPortion}
                        onChange={(event) =>
                          updateForm(
                            "startDayPortion",
                            event.target.value as LeaveDayPortion,
                          )
                        }
                        disabled={isSubmitting}
                        className={inputClassName}
                      >
                        <option value="FULL_DAY">Full day</option>
                        <option value="FIRST_HALF">First half</option>
                        <option value="SECOND_HALF">Second half</option>
                      </select>
                    </div>

                    {/* End date duration */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        End date duration
                      </label>

                      <p className="mb-2 text-xs text-slate-500">
                        {formatPreviewDate(form.toDate)}
                      </p>

                      <select
                        value={form.endDayPortion}
                        onChange={(event) =>
                          updateForm(
                            "endDayPortion",
                            event.target.value as LeaveDayPortion,
                          )
                        }
                        disabled={isSubmitting}
                        className={inputClassName}
                      >
                        <option value="FULL_DAY">Full day</option>
                        <option value="FIRST_HALF">First half</option>
                        <option value="SECOND_HALF">Second half</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
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
                leaveTypes.length === 0 ||
                !preview ||
                Boolean(previewError)
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
                      {preview.dateDetails.map((detail) => {
                        const isWeeklyOff =
                          detail.dayClassification === "WEEKLY_OFF";

                        const isHoliday =
                          detail.dayClassification === "HOLIDAY";

                        const isExcluded =
                          !detail.countedAsLeave ||
                          detail.allocationType === "NOT_APPLICABLE";

                        return (
                          <div
                            key={detail.date}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                              isWeeklyOff
                                ? "border-amber-200 bg-amber-50"
                                : isHoliday
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-slate-100 bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800">
                                {formatPreviewDate(detail.date)}
                              </p>

                              <p
                                className={`mt-0.5 text-xs ${
                                  isWeeklyOff
                                    ? "text-amber-700"
                                    : isHoliday
                                      ? "text-blue-700"
                                      : "text-slate-500"
                                }`}
                              >
                                {isWeeklyOff ? (
                                  "Weekly Off — excluded from leave"
                                ) : isHoliday ? (
                                  "Holiday — excluded from leave"
                                ) : (
                                  <>
                                    <span className="font-semibold text-slate-700">
                                      {formatLeaveDayPortion(detail.dayPortion)}
                                      {" · "}
                                      {formatDays(detail.leaveDays)}
                                    </span>

                                    <span className="mt-0.5 block">
                                      {getPreviewAllocationLabel(detail)}
                                    </span>
                                  </>
                                )}{" "}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${
                                isExcluded
                                  ? isWeeklyOff
                                    ? "bg-amber-100 text-amber-700"
                                    : isHoliday
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-200 text-slate-600"
                                  : detail.allocationType === "PAID"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : detail.allocationType === "MIXED"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isExcluded
                                ? "Excluded"
                                : formatEnum(detail.allocationType)}
                            </span>
                          </div>
                        );
                      })}
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

function formatLeaveDayPortion(
  portion?: LeaveRequestPreview["dateDetails"][number]["dayPortion"],
) {
  switch (portion) {
    case "FIRST_HALF":
      return "First half";

    case "SECOND_HALF":
      return "Second half";

    case "FULL_DAY":
      return "Full day";

    case "NOT_APPLICABLE":
      return "Not applicable";

    default:
      return "Not applicable";
  }
}
