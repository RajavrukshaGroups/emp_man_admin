"use client";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Timer,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { attendanceService } from "@/features/attendance/services/attendance.service";
import type {
  DailyAttendanceStatus,
  DailyAttendanceSummaryResponse,
  DailyAttendanceSummaryRow,
} from "@/features/attendance/types/attendance.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;

// ============================================================
// DATE HELPERS
// ============================================================

function toLocalDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getToday() {
  return toLocalDateString(new Date());
}

function getYesterday() {
  const date = new Date();

  date.setDate(date.getDate() - 1);

  return toLocalDateString(date);
}

function formatAttendanceDate(date: string) {
  if (!date) {
    return "—";
  }

  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMinutes(minutes?: number | null) {
  const value = Math.max(0, minutes ?? 0);

  const hours = Math.floor(value / 60);

  const remainingMinutes = value % 60;

  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

function formatShiftTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const [hoursString, minutesString] = value.split(":");

  const hours = Number(hoursString);

  const minutes = Number(minutesString);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================================
// STATUS
// ============================================================

function humanizeStatus(status: string) {
  if (status === "PENDING") {
    return "Checked In";
  }

  if (status === "NOT_CHECKED_IN") {
    return "Not Checked In";
  }

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClass(status: DailyAttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "HALF_DAY":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "ABSENT":
      return "border-red-200 bg-red-50 text-red-700";

    case "NOT_CHECKED_IN":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "ON_LEAVE":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "HOLIDAY":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "WEEKLY_OFF":
      return "border-slate-200 bg-slate-100 text-slate-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

// ============================================================
// PAGE
// ============================================================

export default function AttendanceEmployeesPage() {
  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const router = useRouter();

  const canReadAttendanceSummary =
    permissions?.includes("attendance.summary_read") ?? false;

  const companyId = company?._id ?? "";

  const [selectedDate, setSelectedDate] = useState(getToday);

  const [page, setPage] = useState(1);

  const [data, setData] = useState<DailyAttendanceSummaryResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | DailyAttendanceStatus
  >("ALL");
  // ============================================================
  // LOAD
  // ============================================================

  const loadAttendance = useCallback(
    async (showRefresh = false) => {
      if (!companyId || !canReadAttendanceSummary) {
        setLoading(false);
        return;
      }

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await attendanceService.getDailySummary(companyId, {
          date: selectedDate,
          page,
          limit: PAGE_LIMIT,
          ...(statusFilter !== "ALL"
            ? {
                attendanceStatus: statusFilter,
              }
            : {}),
        });

        setData(response);
      } catch (err) {
        setData(null);

        setError(getApiErrorMessage(err, "Unable to load daily attendance."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, selectedDate, page, statusFilter, canReadAttendanceSummary],
  );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (!canReadAttendanceSummary) {
      router.replace("/attendance");
    }
  }, [canReadAttendanceSummary, router]);
  // ============================================================
  // DATE ACTIONS
  // ============================================================

  function selectToday() {
    setPage(1);

    setSelectedDate(getToday());
  }

  function selectYesterday() {
    setPage(1);

    setSelectedDate(getYesterday());
  }

  function handleDateChange(value: string) {
    if (!value) {
      return;
    }

    setPage(1);

    setSelectedDate(value);
  }

  // ============================================================
  // VIEW STATE
  // ============================================================

  const isToday = selectedDate === getToday();

  const isYesterday = selectedDate === getYesterday();

  const items = data?.items ?? [];

  const summary = data?.summary;

  const pagination = data?.pagination;

  const checkedInCount = useMemo(() => {
    if (!summary) {
      return 0;
    }

    return summary.pending + summary.present + summary.halfDay;
  }, [summary]);

  if (!canReadAttendanceSummary) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Attendance Management
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {isToday
              ? "Today's Attendance"
              : `Attendance — ${formatAttendanceDate(selectedDate)}`}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            View attendance for employees within your permitted organization
            scope.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAttendance(true)}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* DATE SELECTOR + STATUS FILTER */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectToday}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isToday
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={selectYesterday}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isYesterday
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Yesterday
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />

            <input
              type="date"
              value={selectedDate}
              max={getToday()}
              onChange={(event) => handleDateChange(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "All",
                value: "ALL",
              },
              {
                label: "Not Checked In",
                value: "NOT_CHECKED_IN",
              },
              {
                label: "Checked In",
                value: "PENDING",
              },
              {
                label: "Present",
                value: "PRESENT",
              },
              {
                label: "Half Day",
                value: "HALF_DAY",
              },
              {
                label: "Absent",
                value: "ABSENT",
              },
            ].map((option) => {
              const active = statusFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPage(1);

                    setStatusFilter(
                      option.value as "ALL" | DailyAttendanceStatus,
                    );
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Employees"
          value={summary?.totalEmployees ?? 0}
          icon={Users}
        />

        <SummaryCard
          title="Checked In"
          value={checkedInCount}
          icon={UserCheck}
        />

        <SummaryCard
          title="Not Checked In"
          value={summary?.notCheckedIn ?? 0}
          icon={UserMinus}
        />

        {/* <SummaryCard
          title="Pending"
          value={summary?.pending ?? 0}
          icon={Clock3}
        /> */}

        <SummaryCard
          title="Present"
          value={summary?.present ?? 0}
          icon={UserCheck}
        />

        <SummaryCard
          title="Absent"
          value={summary?.absent ?? 0}
          icon={UserMinus}
        />

        <SummaryCard
          title="Half Day"
          value={summary?.halfDay ?? 0}
          icon={Timer}
        />
      </div>

      {/* ERROR */}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* CONTENT */}

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No employees found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            There are no attendance records or employees available for this
            date.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP */}

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-[1150px] w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Employee</th>

                    <th className="px-4 py-3">Department / Team</th>

                    <th className="px-4 py-3">Shift</th>

                    <th className="px-4 py-3">Check In</th>

                    <th className="px-4 py-3">Check Out</th>

                    <th className="px-4 py-3">Worked</th>

                    <th className="px-4 py-3">Break</th>

                    <th className="px-4 py-3">Status</th>

                    <th className="px-4 py-3">Exceptions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => (
                    <DesktopRow key={row.companyAccessId} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE */}

          <div className="grid gap-4 lg:hidden">
            {items.map((row) => (
              <MobileCard key={row.companyAccessId} row={row} />
            ))}
          </div>
        </>
      )}

      {/* PAGINATION */}

      {!loading && pagination && pagination.total > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-medium text-slate-900">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {pagination.totalPages}
            </span>
            <span className="ml-2">· {pagination.total} employees</span>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// DESKTOP ROW
// ============================================================

function DesktopRow({ row }: { row: DailyAttendanceSummaryRow }) {
  const attendance = row.attendance;

  return (
    <tr className="text-sm text-slate-700 hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <p className="font-semibold text-slate-950">{row.employeeName}</p>

        <p className="mt-1 text-xs text-slate-500">
          {row.employeeCode}
          {row.designation ? ` · ${row.designation}` : ""}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-slate-700">
          {row.departmentId?.name ?? "—"}
        </p>

        <p className="mt-1 text-xs text-slate-500">{row.teamId?.name ?? "—"}</p>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-slate-700">
          {row.shiftId?.name ?? "Not assigned"}
        </p>

        {row.shiftId ? (
          <p className="mt-1 text-xs text-slate-500">
            {formatShiftTime(row.shiftId.startTime)}
            {" – "}
            {formatShiftTime(row.shiftId.endTime)}
          </p>
        ) : null}
      </td>

      <td className="whitespace-nowrap px-4 py-4">
        {formatTime(attendance?.firstCheckInAt)}
      </td>

      <td className="whitespace-nowrap px-4 py-4">
        {formatTime(attendance?.lastCheckOutAt)}
      </td>

      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
        {attendance ? formatMinutes(attendance.totalWorkedMinutes) : "—"}
      </td>

      <td className="whitespace-nowrap px-4 py-4">
        {attendance ? formatMinutes(attendance.totalBreakMinutes) : "—"}
      </td>

      <td className="px-4 py-4">
        <StatusBadge status={row.attendanceStatus} />
      </td>

      <td className="px-4 py-4">
        {attendance?.isLate || attendance?.isEarlyCheckout ? (
          <div className="flex flex-wrap gap-1.5">
            {attendance.isLate ? (
              <ExceptionBadge>Late {attendance.lateMinutes}m</ExceptionBadge>
            ) : null}

            {attendance.isEarlyCheckout ? (
              <ExceptionBadge>
                Early {attendance.earlyCheckoutMinutes}m
              </ExceptionBadge>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        )}
      </td>
    </tr>
  );
}

// ============================================================
// MOBILE CARD
// ============================================================

function MobileCard({ row }: { row: DailyAttendanceSummaryRow }) {
  const attendance = row.attendance;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">
            {row.employeeName}
          </p>

          <p className="mt-1 text-xs text-slate-500">{row.employeeCode}</p>

          <p className="mt-1 text-xs text-slate-500">
            {row.designation || "—"}
          </p>
        </div>

        <StatusBadge status={row.attendanceStatus} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Value label="Department" value={row.departmentId?.name ?? "—"} />

        <Value label="Team" value={row.teamId?.name ?? "—"} />

        <Value label="Shift" value={row.shiftId?.name ?? "Not assigned"} />

        <Value
          label="Check In"
          value={formatTime(attendance?.firstCheckInAt)}
        />

        <Value
          label="Check Out"
          value={formatTime(attendance?.lastCheckOutAt)}
        />

        <Value
          label="Worked"
          value={
            attendance ? formatMinutes(attendance.totalWorkedMinutes) : "—"
          }
        />

        <Value
          label="Break"
          value={attendance ? formatMinutes(attendance.totalBreakMinutes) : "—"}
        />
      </div>

      {attendance?.isLate || attendance?.isEarlyCheckout ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {attendance.isLate ? (
            <ExceptionBadge>Late by {attendance.lateMinutes}m</ExceptionBadge>
          ) : null}

          {attendance.isEarlyCheckout ? (
            <ExceptionBadge>
              Early checkout by {attendance.earlyCheckoutMinutes}m
            </ExceptionBadge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: DailyAttendanceStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
        status,
      )}`}
    >
      {humanizeStatus(status)}
    </span>
  );
}

function ExceptionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
      {children}
    </span>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}
