"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hourglass,
  Loader2,
  LogOut,
  RefreshCw,
  Timer,
} from "lucide-react";

import { attendanceService } from "@/features/attendance/services/attendance.service";
import type {
  AttendanceCalendarDay,
  AttendanceCalendarDisplayStatus,
} from "@/features/attendance/types/attendance.types";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/axios";

const pad = (value: number) => String(value).padStart(2, "0");

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value?: string | null, timezone = "Asia/Kolkata") {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(value));
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

const statusStyles: Record<AttendanceCalendarDisplayStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  HALF_DAY: "bg-violet-50 text-violet-700 ring-violet-200",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-200",
  PENDING: "bg-blue-50 text-blue-700 ring-blue-200",
  ON_LEAVE: "bg-sky-50 text-sky-700 ring-sky-200",
  PARTIAL_LEAVE: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  HOLIDAY: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  WEEKLY_OFF: "bg-slate-100 text-slate-600 ring-slate-200",
  NO_ATTENDANCE_RECORDED: "bg-amber-50 text-amber-700 ring-amber-200",
  UPCOMING: "bg-slate-50 text-slate-500 ring-slate-200",
};

const statusLabels: Record<AttendanceCalendarDisplayStatus, string> = {
  PRESENT: "Present",
  HALF_DAY: "Half Day",
  ABSENT: "Absent",
  PENDING: "Pending",
  ON_LEAVE: "On Leave",
  PARTIAL_LEAVE: "Partial Leave",
  HOLIDAY: "Holiday",
  WEEKLY_OFF: "Weekly Off",
  NO_ATTENDANCE_RECORDED: "No Attendance",
  UPCOMING: "Upcoming",
};

function StatusBadge({ status }: { status: AttendanceCalendarDisplayStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  prominent = false,
}: {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  iconClassName: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
        prominent ? "sm:col-span-2 xl:col-span-4" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p
            className={`mt-2 font-bold tracking-tight text-slate-950 ${
              prominent ? "text-3xl" : "text-2xl"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function MyAttendanceReportPage() {
  const companyId = useAuthStore((state) => state.company?._id);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);

  const canUseSelfAttendance =
    role?.code !== "COMPANY_ADMIN" &&
    Boolean(companyAccess?._id) &&
    (permissions?.includes("attendance.check_in") ?? false);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [days, setDays] = useState<AttendanceCalendarDay[]>([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const currentMonth = monthKey(selectedMonth);

  const loadReport = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!companyId || !canUseSelfAttendance) {
      setDays([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await attendanceService.getMyAttendanceCalendar(
        companyId,
        currentMonth,
      );

      if (requestId !== requestIdRef.current) return;

      setDays(response.days);
      setTimezone(response.timezone || "Asia/Kolkata");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setDays([]);
      setError(
        getApiErrorMessage(err, "Unable to load your attendance report."),
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [companyId, canUseSelfAttendance, currentMonth]);

  useEffect(() => {
    void loadReport();

    return () => {
      requestIdRef.current++;
    };
  }, [loadReport]);

  useEffect(() => {
    if (!canUseSelfAttendance) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadReport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canUseSelfAttendance, loadReport]);

  const summary = useMemo(() => {
    const result = {
      present: 0,
      halfDay: 0,
      absent: 0,
      pending: 0,
      missing: 0,
      approvedLeaveDays: 0,
      workedMinutes: 0,
      breakMinutes: 0,
      lateDays: 0,
      earlyCheckoutDays: 0,
    };

    for (const day of days) {
      switch (day.displayStatus) {
        case "PRESENT":
          result.present++;
          break;
        case "HALF_DAY":
          result.halfDay++;
          break;
        case "ABSENT":
          result.absent++;
          break;
        case "PENDING":
          result.pending++;
          break;
        case "NO_ATTENDANCE_RECORDED":
          result.missing++;
          break;
      }

      result.approvedLeaveDays += day.totalLeaveDays ?? 0;
      result.workedMinutes += day.attendance?.totalWorkedMinutes ?? 0;
      result.breakMinutes += day.attendance?.totalBreakMinutes ?? 0;

      if (day.attendance?.isLate) result.lateDays++;

      if (day.attendance?.isEarlyCheckout) {
        result.earlyCheckoutDays++;
      }
    }

    return result;
  }, [days]);

  const changeMonth = (offset: number) => {
    if (loading) return;

    setSelectedMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + offset, 1),
    );
  };

  const summaryCards = [
    {
      label: "Present Days",
      value: String(summary.present),
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Half Days",
      value: String(summary.halfDay),
      icon: Clock3,
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      label: "Absent Days",
      value: String(summary.absent),
      icon: CalendarX2,
      iconClassName: "bg-rose-50 text-rose-600",
    },
    {
      label: "Pending Days",
      value: String(summary.pending),
      icon: Hourglass,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Missing Attendance",
      value: String(summary.missing),
      icon: CalendarX2,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      label: "Approved Leave Days",
      value: String(summary.approvedLeaveDays),
      icon: CalendarCheck2,
      iconClassName: "bg-sky-50 text-sky-600",
    },
    {
      label: "Late Arrivals",
      value: String(summary.lateDays),
      icon: AlarmClock,
      iconClassName: "bg-orange-50 text-orange-600",
    },
    {
      label: "Early Checkouts",
      value: String(summary.earlyCheckoutDays),
      icon: LogOut,
      iconClassName: "bg-fuchsia-50 text-fuchsia-600",
    },
  ];

  if (!canUseSelfAttendance) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-bold text-slate-950">
          My Attendance Report
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have access to personal attendance reporting for this
          company.
        </p>

        <Link
          href="/attendance"
          className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:underline"
        >
          Back to Attendance
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/attendance"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                My Attendance Report
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Your personal monthly attendance overview.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              disabled={loading}
              aria-label="Previous month"
              className="rounded-lg p-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-[125px] text-center text-sm font-semibold text-slate-800">
              {formatMonth(selectedMonth)}
            </span>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={loading}
              aria-label="Next month"
              className="rounded-lg p-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={loading}
            aria-label="Refresh report"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* REPORT CONTENT */}
      <div className="relative space-y-6">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-start justify-center rounded-2xl bg-white/75 pt-32 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">
                Loading attendance report...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Monthly Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Attendance statistics for {formatMonth(selectedMonth)}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}

            <SummaryCard
              label="Total Worked Hours"
              value={formatMinutes(summary.workedMinutes)}
              icon={Timer}
              iconClassName="bg-indigo-50 text-indigo-600"
              prominent
            />
          </div>
        </section>

        {/* DAILY REGISTER */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Daily Attendance Register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Check-in, check-out, working time, and daily status.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {days.length} calendar days
            </span>
          </div>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600 shadow-sm">
                <tr>
                  {[
                    "Date",
                    "Status",
                    "Check In",
                    "Check Out",
                    "Worked",
                    "Break",
                    "Leave",
                    "Late",
                    "Early Exit",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {days.map((day) => (
                  <tr key={day.date} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                      {formatDate(day.date)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={day.displayStatus} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatTime(day.attendance?.firstCheckInAt, timezone)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatTime(day.attendance?.lastCheckOutAt, timezone)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                      {day.attendance
                        ? formatMinutes(day.attendance.totalWorkedMinutes)
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {day.attendance
                        ? formatMinutes(day.attendance.totalBreakMinutes)
                        : "—"}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {day.totalLeaveDays || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {day.attendance?.isLate ? (
                        <span className="font-semibold text-rose-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {day.attendance?.isEarlyCheckout ? (
                        <span className="font-semibold text-amber-600">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && days.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-sm text-slate-500"
                    >
                      No attendance data available for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
