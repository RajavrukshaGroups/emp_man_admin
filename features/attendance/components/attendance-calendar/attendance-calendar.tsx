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

import type {
  AttendanceCalendarDay,
  AttendanceCalendarDisplayStatus,
} from "@/features/attendance/types/attendance.types";

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

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatMinutes(value?: number | null) {
  if (value == null) return "—";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

function formatStatus(value?: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusStyles(status: AttendanceCalendarDisplayStatus) {
  switch (status) {
    case "PRESENT":
      return {
        container: "border-emerald-200 bg-emerald-50 text-emerald-950",
        badge: "bg-emerald-100 text-emerald-700",
        label: "Present",
      };
    case "HALF_DAY":
      return {
        container: "border-violet-200 bg-violet-50 text-violet-950",
        badge: "bg-violet-100 text-violet-700",
        label: "Half Day",
      };
    case "ABSENT":
      return {
        container: "border-red-200 bg-red-50 text-red-950",
        badge: "bg-red-100 text-red-700",
        label: "Absent",
      };
    case "ON_LEAVE":
      return {
        container: "border-sky-200 bg-sky-50 text-sky-950",
        badge: "bg-sky-100 text-sky-700",
        label: "On Leave",
      };
    case "PARTIAL_LEAVE":
      return {
        container: "border-purple-200 bg-purple-50 text-purple-950",
        badge: "bg-purple-100 text-purple-700",
        label: "Partial Leave",
      };
    case "HOLIDAY":
      return {
        container: "border-cyan-200 bg-cyan-50 text-cyan-950",
        badge: "bg-cyan-100 text-cyan-700",
        label: "Holiday",
      };
    case "WEEKLY_OFF":
      return {
        container: "border-slate-200 bg-slate-50 text-slate-900",
        badge: "bg-slate-200 text-slate-700",
        label: "Weekly Off",
      };
    case "UPCOMING":
      return {
        container: "border-slate-100 bg-slate-50/50 text-slate-500",
        badge: "bg-slate-100 text-slate-500",
        label: "Upcoming",
      };
    case "NO_ATTENDANCE_RECORDED":
      return {
        container: "border-slate-200 bg-white text-slate-700",
        badge: "bg-slate-100 text-slate-500",
        label: "No Attendance",
      };
    default:
      return {
        container: "border-blue-200 bg-blue-50 text-blue-950",
        badge: "bg-blue-100 text-blue-700",
        label: "Pending",
      };
  }
}

export function AttendanceCalendar({
  companyId,
  refreshKey = 0,
}: AttendanceCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const [items, setItems] = useState<AttendanceCalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthKey = useMemo(
    () => `${selectedMonth.getFullYear()}-${pad(selectedMonth.getMonth() + 1)}`,
    [selectedMonth],
  );

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await attendanceService.getMyAttendanceCalendar(
        companyId,
        monthKey,
      );

      setItems(response.days);
    } catch (err) {
      console.error(err);
      setError("Unable to load monthly attendance.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, monthKey]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance, refreshKey]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadAttendance();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadAttendance]);

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceCalendarDay>();

    for (const day of items) {
      map.set(day.date, day);
    }

    return map;
  }, [items]);

  const monthlySummary = useMemo(() => {
    const summary = {
      present: 0,
      halfDay: 0,
      absent: 0,
      onLeave: 0,
      partialLeave: 0,
      holidays: 0,
      weeklyOff: 0,
      missingAttendance: 0,
      lateDays: 0,
      earlyCheckoutDays: 0,
      workedMinutes: 0,
      breakMinutes: 0,
      approvedLeaveDays: 0,
    };

    for (const day of items) {
      switch (day.displayStatus) {
        case "PRESENT":
          summary.present++;
          break;
        case "HALF_DAY":
          summary.halfDay++;
          break;
        case "ABSENT":
          summary.absent++;
          break;
        case "ON_LEAVE":
          summary.onLeave++;
          break;
        case "PARTIAL_LEAVE":
          summary.partialLeave++;
          break;
        case "HOLIDAY":
          summary.holidays++;
          break;
        case "WEEKLY_OFF":
          summary.weeklyOff++;
          break;
        case "NO_ATTENDANCE_RECORDED":
          summary.missingAttendance++;
          break;
      }

      summary.approvedLeaveDays += day.totalLeaveDays ?? 0;

      if (day.attendance) {
        summary.workedMinutes += day.attendance.totalWorkedMinutes ?? 0;
        summary.breakMinutes += day.attendance.totalBreakMinutes ?? 0;

        if (day.attendance.isLate) {
          summary.lateDays++;
        }

        if (day.attendance.isEarlyCheckout) {
          summary.earlyCheckoutDays++;
        }
      }
    }

    return summary;
  }, [items]);

  const selectedDay = selectedDate
    ? (attendanceByDate.get(selectedDate) ?? null)
    : null;

  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [selectedMonth]);

  const changeMonth = (offset: number) => {
    if (loading) return;

    setSelectedDate(null);
    setSelectedMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  const todayKey = formatDateKey(new Date());

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Monthly Attendance</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review attendance, approved leave, holidays and weekly offs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            disabled={loading}
            className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[140px] text-center text-sm font-semibold">
            {formatMonth(selectedMonth)}
          </span>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={loading}
            aria-label="Next month"
            className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedDate(null);
              setSelectedMonth(new Date());
            }}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => void loadAttendance()}
            disabled={loading}
            aria-label="Refresh attendance"
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">
                Loading your attendance
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fetching your attendance for {formatMonth(selectedMonth)}...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadAttendance()}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  My Monthly Attendance Summary
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Your attendance overview for {formatMonth(selectedMonth)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <CalendarValue
                  label="Present Days"
                  value={String(monthlySummary.present)}
                />

                <CalendarValue
                  label="Half Days"
                  value={String(monthlySummary.halfDay)}
                />

                <CalendarValue
                  label="Absent Days"
                  value={String(monthlySummary.absent)}
                />

                <CalendarValue
                  label="Approved Leave Days"
                  value={String(monthlySummary.approvedLeaveDays)}
                />

                <CalendarValue
                  label="Worked Hours"
                  value={formatMinutes(monthlySummary.workedMinutes)}
                />

                <CalendarValue
                  label="Late Arrivals"
                  value={String(monthlySummary.lateDays)}
                />

                <CalendarValue
                  label="Early Checkouts"
                  value={String(monthlySummary.earlyCheckoutDays)}
                />

                <CalendarValue
                  label="Missing Attendance"
                  value={String(monthlySummary.missingAttendance)}
                />
              </div>
            </div>
            <p className="mb-3 text-xs text-slate-400 md:hidden">
              Swipe horizontally to view the full week.
            </p>

            <div className="overflow-x-auto pb-3">
              <div className="grid min-w-[700px] grid-cols-7 gap-2 md:min-w-0">
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-semibold uppercase text-slate-400"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div key={`empty-${index}`} className="min-h-[105px]" />
                    );
                  }

                  const dateKey = formatDateKey(date);
                  const day = attendanceByDate.get(dateKey);
                  const isToday = dateKey === todayKey;

                  if (!day) {
                    return (
                      <div
                        key={dateKey}
                        className="min-h-[105px] rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <span className="text-sm font-semibold">
                          {date.getDate()}
                        </span>
                        <p className="mt-4 text-xs text-slate-400">
                          No calendar data
                        </p>
                      </div>
                    );
                  }

                  const styles = getStatusStyles(day.displayStatus);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedDate(dateKey)}
                      className={[
                        "min-h-[105px] rounded-xl border p-2.5 text-left transition hover:shadow-sm sm:p-3",
                        styles.container,
                        isToday ? "ring-2 ring-blue-300 ring-offset-1" : "",
                        selectedDate === dateKey
                          ? "outline outline-2 outline-blue-500"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-bold">
                          {date.getDate()}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold uppercase text-blue-600">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${styles.badge}`}
                        >
                          {styles.label}
                        </span>

                        {day.workDay.name &&
                          day.displayStatus === "HOLIDAY" && (
                            <p className="truncate text-[11px] font-medium">
                              {day.workDay.name}
                            </p>
                          )}

                        {day.approvedLeaves.map((leave, index) => (
                          <p
                            key={`${leave.leaveRequestId}-${index}`}
                            className="text-[10px] font-medium"
                          >
                            {formatStatus(leave.dayPortion)}
                            {" · "}
                            {leave.leaveDays}{" "}
                            {leave.leaveDays === 1 ? "day" : "days"}
                          </p>
                        ))}

                        {day.approvedLeaves.length > 0 && (
                          <p className="border-t border-current/10 pt-1 text-[10px] font-semibold">
                            Total leave: {day.totalLeaveDays}{" "}
                            {day.totalLeaveDays === 1 ? "day" : "days"}
                          </p>
                        )}

                        {day.attendance?.firstCheckInAt && (
                          <p className="text-[11px] opacity-75">
                            {formatTime(day.attendance.firstCheckInAt)}
                          </p>
                        )}

                        {day.attendance?.isLate && (
                          <p className="text-[10px] text-amber-700">
                            Late arrival
                          </p>
                        )}

                        {day.attendance?.isEarlyCheckout && (
                          <p className="text-[10px] text-orange-700">
                            Early checkout
                          </p>
                        )}

                        {day.hasLeaveAttendanceConflict && (
                          <p className="text-[10px] font-semibold text-red-700">
                            Attendance / leave conflict
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-4 text-xs text-slate-600">
              <LegendItem color="bg-emerald-500" label="Present" />
              <LegendItem color="bg-violet-500" label="Half Day" />
              <LegendItem color="bg-red-500" label="Absent" />
              <LegendItem color="bg-purple-500" label="Partial Leave" />
              <LegendItem color="bg-sky-500" label="On Leave" />
              <LegendItem color="bg-cyan-500" label="Holiday" />
              <LegendItem color="bg-slate-400" label="Weekly Off" />
              <LegendItem color="bg-slate-200" label="No Attendance" />
            </div>
          </>
        )}
      </div>

      {selectedDay && !loading && !error && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Selected Day
              </p>
              <h3 className="mt-1 font-semibold text-slate-950">
                {formatSelectedDate(selectedDay.date)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <CalendarValue
              label="Calendar status"
              value={formatStatus(selectedDay.displayStatus)}
            />

            <CalendarValue
              label="Attendance status"
              value={formatStatus(selectedDay.attendanceStatus)}
            />

            <CalendarValue
              label="Day classification"
              value={formatStatus(selectedDay.workDay.classification)}
            />

            {selectedDay.workDay.name && (
              <CalendarValue
                label="Holiday / Day name"
                value={selectedDay.workDay.name}
              />
            )}

            {selectedDay.attendance && (
              <>
                <CalendarValue
                  label="First check in"
                  value={formatTime(selectedDay.attendance.firstCheckInAt)}
                />

                <CalendarValue
                  label="Last check out"
                  value={formatTime(selectedDay.attendance.lastCheckOutAt)}
                />

                <CalendarValue
                  label="Worked"
                  value={formatMinutes(
                    selectedDay.attendance.totalWorkedMinutes,
                  )}
                />

                <CalendarValue
                  label="Break"
                  value={formatMinutes(
                    selectedDay.attendance.totalBreakMinutes,
                  )}
                />

                <CalendarValue
                  label="Late arrival"
                  value={selectedDay.attendance.isLate ? "Yes" : "No"}
                />

                <CalendarValue
                  label="Early checkout"
                  value={selectedDay.attendance.isEarlyCheckout ? "Yes" : "No"}
                />
              </>
            )}

            {selectedDay.approvedLeaves.map((leave, index) => (
              <div
                key={`${leave.leaveRequestId}-${index}`}
                className="contents"
              >
                <CalendarValue
                  label="Approved leave portion"
                  value={formatStatus(leave.dayPortion)}
                />
                <CalendarValue
                  label="Leave days"
                  value={String(leave.leaveDays)}
                />
                <CalendarValue
                  label="Paid days"
                  value={String(leave.paidDays)}
                />
                <CalendarValue
                  label="Unpaid days"
                  value={String(leave.unpaidDays)}
                />
                <CalendarValue
                  label="Allocation"
                  value={formatStatus(leave.allocationType)}
                />
              </div>
            ))}

            <CalendarValue
              label="Total approved leave"
              value={`${selectedDay.totalLeaveDays} day(s)`}
            />

            <CalendarValue
              label="Leave / attendance conflict"
              value={
                selectedDay.hasLeaveAttendanceConflict === true
                  ? "Yes — review required"
                  : selectedDay.hasLeaveAttendanceConflict === false
                    ? "No"
                    : "Pending verification"
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function CalendarValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
