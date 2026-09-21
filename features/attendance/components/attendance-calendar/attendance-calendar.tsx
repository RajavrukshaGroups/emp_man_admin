"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { attendanceService } from "@/features/attendance/services/attendance.service";

import type { AttendanceRecord } from "@/features/attendance/types/attendance.types";

interface AttendanceCalendarProps {
  companyId: string;
  refreshKey?: number;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function getMonthRange(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    fromDate: `${year}-${pad(month + 1)}-01`,
    toDate: `${year}-${pad(month + 1)}-${pad(
      new Date(year, month + 1, 0).getDate(),
    )}`,
  };
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatMinutes(minutes?: number | null) {
  const total = Number(minutes || 0);

  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (hours <= 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatStatus(status?: string) {
  if (!status) {
    return "—";
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusStyles(attendance: AttendanceRecord) {
  if (attendance.attendanceStatus === "PRESENT") {
    return {
      container:
        "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-300",
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      label: "Present",
    };
  }

  if (attendance.attendanceStatus === "HALF_DAY") {
    return {
      container:
        "border-violet-200 bg-violet-50 text-violet-950 hover:border-violet-300",
      badge: "bg-violet-100 text-violet-700",
      dot: "bg-violet-500",
      label: "Half Day",
    };
  }

  if (attendance.attendanceStatus === "ABSENT") {
    return {
      container: "border-red-200 bg-red-50 text-red-950 hover:border-red-300",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      label: "Absent",
    };
  }

  if (attendance.attendanceStatus === "ON_LEAVE") {
    return {
      container: "border-sky-200 bg-sky-50 text-sky-950 hover:border-sky-300",
      badge: "bg-sky-100 text-sky-700",
      dot: "bg-sky-500",
      label: "On Leave",
    };
  }

  if (attendance.attendanceStatus === "HOLIDAY") {
    return {
      container:
        "border-cyan-200 bg-cyan-50 text-cyan-950 hover:border-cyan-300",
      badge: "bg-cyan-100 text-cyan-700",
      dot: "bg-cyan-500",
      label: "Holiday",
    };
  }

  if (attendance.attendanceStatus === "WEEKLY_OFF") {
    return {
      container:
        "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300",
      badge: "bg-slate-200 text-slate-700",
      dot: "bg-slate-400",
      label: "Weekly Off",
    };
  }

  return {
    container: "border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-300",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    label: "Pending",
  };
}

export function AttendanceCalendar({
  companyId,
  refreshKey = 0,
}: AttendanceCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const [items, setItems] = useState<AttendanceRecord[]>([]);

  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceRecord | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const range = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const daysInMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
      ).getDate();

      const response = await attendanceService.getMyHistory(companyId, {
        fromDate: range.fromDate,
        toDate: range.toDate,
        page: 1,
        limit: daysInMonth,
      });

      setItems(response.items || []);
    } catch (err) {
      console.error(err);

      setError("Unable to load monthly attendance.");
    } finally {
      setLoading(false);
    }
  }, [companyId, range.fromDate, range.toDate, selectedMonth]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance, refreshKey]);
  
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();

    for (const attendance of items) {
      map.set(attendance.attendanceDate, attendance);
    }

    return map;
  }, [items]);

  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<Date | null> = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [selectedMonth]);

  const goToPreviousMonth = () => {
    setSelectedAttendance(null);

    setSelectedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setSelectedAttendance(null);

    setSelectedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const goToCurrentMonth = () => {
    setSelectedAttendance(null);
    setSelectedMonth(new Date());
  };

  const today = new Date();

  const todayKey = formatDateKey(today);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-950">Monthly Attendance</h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Review your attendance status for each day.
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:overflow-visible lg:pb-0">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="min-w-[130px] shrink-0 whitespace-nowrap text-center text-sm font-semibold text-slate-900 sm:min-w-[150px]">
            {formatMonth(selectedMonth)}
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToCurrentMonth}
            className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => void loadAttendance()}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh attendance"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================
          CALENDAR
      ====================================================== */}
      <div className="p-3 sm:p-5">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />

              <p className="text-sm text-slate-500">Loading attendance...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => void loadAttendance()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Mobile hint */}
            <p className="mb-3 text-xs text-slate-400 md:hidden">
              Swipe horizontally to view the full week.
            </p>

            {/* Horizontal scroll only when needed on mobile */}
            <div className="-mx-1 overflow-x-auto px-1 pb-3">
              <div className="grid min-w-[700px] grid-cols-7 gap-2 md:min-w-0">
                {/* Weekday headings */}
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[90px] sm:min-h-[105px]"
                      />
                    );
                  }

                  const dateKey = formatDateKey(date);

                  const attendance = attendanceByDate.get(dateKey);

                  const isToday = dateKey === todayKey;

                  const isFuture =
                    date.getTime() >
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                    ).getTime();

                  /*
                   * IMPORTANT:
                   *
                   * No attendance record does NOT automatically mean
                   * the employee was absent.
                   *
                   * Leave / holiday / weekly-off information can be
                   * integrated later.
                   */
                  if (!attendance) {
                    return (
                      <div
                        key={dateKey}
                        className={[
                          "min-h-[90px] rounded-xl border p-2.5 sm:min-h-[105px] sm:p-3",
                          isToday
                            ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-200"
                            : isFuture
                              ? "border-slate-100 bg-slate-50/30"
                              : "border-slate-200 bg-slate-50/60",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={[
                              "text-sm font-semibold",
                              isFuture ? "text-slate-400" : "text-slate-700",
                            ].join(" ")}
                          >
                            {date.getDate()}
                          </span>

                          {isToday ? (
                            <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600">
                              Today
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-6 sm:mt-7">
                          {isFuture ? (
                            <p className="text-[11px] text-slate-300 sm:text-xs">
                              Upcoming
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 sm:text-xs">
                              No attendance
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const styles = getStatusStyles(attendance);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedAttendance(attendance)}
                      className={[
                        "min-h-[90px] rounded-xl border p-2.5 text-left transition sm:min-h-[105px] sm:p-3",
                        styles.container,
                        isToday ? "ring-2 ring-blue-300 ring-offset-1" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-bold">
                          {date.getDate()}
                        </span>

                        {isToday ? (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600">
                            Today
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 sm:mt-4">
                        <span
                          className={[
                            "inline-flex max-w-full items-center rounded-full px-2 py-1 text-[9px] font-semibold sm:text-[10px]",
                            styles.badge,
                          ].join(" ")}
                        >
                          {styles.label}
                        </span>
                        <div className="mt-2 space-y-1">
                          <p className="truncate text-[10px] opacity-75 sm:text-[11px]">
                            {formatTime(attendance.firstCheckInAt)}
                          </p>

                          {attendance.isLate ? (
                            <p className="truncate text-[9px] font-medium text-amber-700 sm:text-[10px]">
                              Late {attendance.lateMinutes || 0}m
                              {attendance.isLateCompensated
                                ? " · Compensated"
                                : ""}
                            </p>
                          ) : null}

                          {attendance.isEarlyCheckout ? (
                            <p className="truncate text-[9px] font-medium text-orange-700 sm:text-[10px]">
                              Early {attendance.earlyCheckoutMinutes || 0}m
                              {attendance.isEarlyCheckoutCompensated
                                ? " · Compensated"
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ==================================================
                LEGEND
            ================================================== */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:gap-x-5">
              <LegendItem className="bg-emerald-500" label="Present" />

              <LegendItem className="bg-violet-500" label="Half Day" />

              <LegendItem className="bg-red-500" label="Absent" />

              <LegendItem className="bg-blue-500" label="Pending" />
            </div>
          </>
        )}
      </div>

      {/* ======================================================
          SELECTED ATTENDANCE DETAILS
      ====================================================== */}
      {selectedAttendance ? (
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Selected Day
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-950">
                {formatSelectedDate(selectedAttendance.attendanceDate)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAttendance(null)}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <CalendarValue
              label="Status"
              value={formatStatus(selectedAttendance.attendanceStatus)}
            />

            <CalendarValue
              label="First check in"
              value={formatTime(selectedAttendance.firstCheckInAt)}
            />

            <CalendarValue
              label="Last check out"
              value={formatTime(selectedAttendance.lastCheckOutAt)}
            />

            <CalendarValue
              label="Worked"
              value={formatMinutes(selectedAttendance.totalWorkedMinutes)}
            />

            <CalendarValue
              label="Break"
              value={formatMinutes(selectedAttendance.totalBreakMinutes)}
            />

            <CalendarValue
              label="Late arrival"
              value={
                selectedAttendance.isLate
                  ? `${selectedAttendance.lateMinutes || 0} min`
                  : "No"
              }
            />

            <CalendarValue
              label="Late compensation"
              value={
                selectedAttendance.isLate
                  ? selectedAttendance.isLateCompensated
                    ? `${selectedAttendance.lateCompensatedMinutes || 0} min compensated`
                    : "Not compensated"
                  : "Not applicable"
              }
            />

            <CalendarValue
              label="Early checkout"
              value={
                selectedAttendance.isEarlyCheckout
                  ? `${selectedAttendance.earlyCheckoutMinutes || 0} min`
                  : "No"
              }
            />

            <CalendarValue
              label="Early checkout compensation"
              value={
                selectedAttendance.isEarlyCheckout
                  ? selectedAttendance.isEarlyCheckoutCompensated
                    ? `${selectedAttendance.earlyCheckoutCompensatedMinutes || 0} min compensated`
                    : "Not compensated"
                  : "Not applicable"
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${className}`} />

      <span>{label}</span>
    </div>
  );
}

function CalendarValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="truncate text-[11px] text-slate-500">{label}</p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
