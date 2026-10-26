"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { attendanceService } from "@/features/attendance/services/attendance.service";
import { departmentService } from "@/features/departments/services/department.service";
import { teamService } from "@/features/teams/services/team.service";

import type { Department } from "@/features/departments/types/department.types";
import type { Team } from "@/features/teams/types/team.types";
import type {
  MonthlyAttendanceReportDay,
  MonthlyAttendanceReportEmployee,
  MonthlyAttendanceReportResponse,
  MonthlyAttendanceDisplayStatus,
} from "@/features/attendance/types/attendance.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 20;

function getTeamDepartmentId(team: Team): string {
  return typeof team.departmentId === "string"
    ? team.departmentId
    : team.departmentId._id;
}

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function moveMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function formatMonth(month: string) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMinutes(value: number) {
  const minutes = Math.max(0, value);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const statusConfig: Record<
  MonthlyAttendanceDisplayStatus,
  { short: string; label: string; className: string }
> = {
  PRESENT: {
    short: "P",
    label: "Present",
    className: "bg-emerald-100 text-emerald-700",
  },
  HALF_DAY: {
    short: "HD",
    label: "Half Day",
    className: "bg-amber-100 text-amber-700",
  },
  ABSENT: {
    short: "A",
    label: "Absent",
    className: "bg-red-100 text-red-700",
  },
  PENDING: {
    short: "IN",
    label: "Checked In",
    className: "bg-blue-100 text-blue-700",
  },
  ON_LEAVE: {
    short: "L",
    label: "On Leave",
    className: "bg-violet-100 text-violet-700",
  },
  PARTIAL_LEAVE: {
    short: "PL",
    label: "Partial Leave",
    className: "bg-indigo-100 text-indigo-700",
  },
  HOLIDAY: {
    short: "H",
    label: "Holiday",
    className: "bg-purple-100 text-purple-700",
  },
  WEEKLY_OFF: {
    short: "WO",
    label: "Weekly Off",
    className: "bg-slate-100 text-slate-600",
  },
  NOT_CHECKED_IN: {
    short: "NC",
    label: "Not Checked In",
    className: "bg-orange-100 text-orange-700",
  },
  NO_ATTENDANCE_RECORDED: {
    short: "NR",
    label: "Not Recorded",
    className: "bg-slate-100 text-slate-500",
  },
  UPCOMING: {
    short: "—",
    label: "Upcoming",
    className: "bg-slate-50 text-slate-400",
  },
  NOT_EMPLOYED: {
    short: "NE",
    label: "Not Employed",
    className: "bg-slate-50 text-slate-400",
  },
};

function StatusCell({
  day,
  onClick,
}: {
  day: MonthlyAttendanceReportDay;
  onClick: () => void;
}) {
  const config = statusConfig[day.displayStatus];

  return (
    <button
      type="button"
      title={`${day.date} · ${config.label}${
        day.attendance?.isLate ? " · Late arrival" : ""
      }`}
      onClick={onClick}
      className={`relative flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-semibold transition hover:ring-2 hover:ring-slate-400 ${config.className}`}
    >
      {config.short}

      {day.attendance?.isLate && (
        <span
          title="Late arrival"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white"
        >
          L
        </span>
      )}

      {day.hasLeaveAttendanceOverlap && (
        <span
          title="Attendance and leave overlap"
          className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-white"
        />
      )}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function MonthlyAttendanceReportPage() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);
  const role = useAuthStore((state) => state.role);

  const companyId = company?._id ?? "";
  const canRead = permissions?.includes("attendance.summary_read") ?? false;

  const showOrganizationFilters =
    role?.code === "COMPANY_ADMIN" || role?.code === "HR_MANAGER";
  const [month, setMonth] = useState(currentMonth);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersError, setFiltersError] = useState("");

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [data, setData] = useState<MonthlyAttendanceReportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloading, setDownloading] = useState<"xlsx" | "pdf" | null>(null);
  const [downloadError, setDownloadError] = useState("");

  const [selected, setSelected] = useState<{
    employee: MonthlyAttendanceReportEmployee;
    day: MonthlyAttendanceReportDay;
  } | null>(null);

  useEffect(() => {
    if (!companyId || !canRead || !showOrganizationFilters) {
      return;
    }

    let cancelled = false;

    async function loadFilters() {
      setFiltersLoading(true);
      setFiltersError("");

      try {
        const fetchDepartments = async () => {
          const all: Department[] = [];
          let currentPage = 1;

          while (true) {
            const result = await departmentService.getDepartments(companyId, {
              page: currentPage,
              limit: 100,
              status: "ACTIVE",
              sortBy: "name",
              sortOrder: "asc",
            });

            all.push(...result.departments);

            if (!result.pagination.hasNextPage) break;
            currentPage++;
          }

          return all;
        };

        const fetchTeams = async () => {
          const all: Team[] = [];
          let currentPage = 1;

          while (true) {
            const result = await teamService.getTeams(companyId, {
              page: currentPage,
              limit: 100,
              status: "ACTIVE",
              sortBy: "name",
              sortOrder: "asc",
            });

            all.push(...result.teams);

            if (!result.pagination.hasNextPage) break;
            currentPage++;
          }

          return all;
        };

        const [departmentResults, teamResults] = await Promise.allSettled([
          fetchDepartments(),
          fetchTeams(),
        ]);

        if (cancelled) return;

        if (departmentResults.status === "fulfilled") {
          setDepartments(departmentResults.value);
        } else {
          setDepartments([]);
        }

        if (teamResults.status === "fulfilled") {
          setTeams(teamResults.value);
        } else {
          setTeams([]);
        }

        if (
          departmentResults.status === "rejected" ||
          teamResults.status === "rejected"
        ) {
          setFiltersError(
            "Some department or team options could not be loaded. You can still view the attendance report.",
          );
        }
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    }

    void loadFilters();

    return () => {
      cancelled = true;
    };
  }, [companyId, canRead, showOrganizationFilters]);

  const loadReport = useCallback(async () => {
    if (!companyId || !canRead) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await attendanceService.getMonthlyReport(companyId, {
        month,
        page,
        limit: PAGE_LIMIT,
        ...(search ? { search } : {}),
        ...(showOrganizationFilters && departmentId ? { departmentId } : {}),
        ...(showOrganizationFilters && teamId ? { teamId } : {}),
      });

      setData(result);
    } catch (err) {
      setData(null);
      setError(
        getApiErrorMessage(err, "Unable to load monthly attendance report."),
      );
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    canRead,
    month,
    page,
    search,
    departmentId,
    teamId,
    showOrganizationFilters,
  ]);

  useEffect(() => {
    void loadReport();
  }, [loadReport, refreshKey]);

  useEffect(() => {
    if (!companyId || !canRead) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadReport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [companyId, canRead, loadReport]);

  useEffect(() => {
    if (!canRead) router.replace("/attendance");
  }, [canRead, router]);

  const items = data?.items ?? [];
  const dates = data?.dates ?? [];
  const pagination = data?.pagination;

  const availableTeams = useMemo(() => {
    if (!departmentId) return teams;

    return teams.filter((team) => getTeamDepartmentId(team) === departmentId);
  }, [teams, departmentId]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, employee) => {
        acc.present += employee.totals.present;
        acc.absent += employee.totals.absent;
        acc.halfDay += employee.totals.halfDay;
        acc.leave += employee.totals.onLeave;
        acc.missing += employee.totals.missingAttendance;
        acc.worked += employee.totals.totalWorkedMinutes;
        return acc;
      },
      {
        present: 0,
        absent: 0,
        halfDay: 0,
        leave: 0,
        missing: 0,
        worked: 0,
      },
    );
  }, [items]);

  function changeMonth(amount: number) {
    if (loading) return;

    setMonth((previous) => moveMonth(previous, amount));
    setPage(1);
    setSelected(null);
  }

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const value = searchInput.trim();

    if (value === search && page === 1) return;

    setSearch(value);
    setPage(1);
    setSelected(null);
  }

  async function handleDownload(format: "xlsx" | "pdf") {
    if (!companyId || !canRead || downloading) return;

    setDownloading(format);
    setDownloadError("");

    try {
      const query = {
        month,
        ...(search ? { search } : {}),
        ...(showOrganizationFilters && departmentId ? { departmentId } : {}),
        ...(showOrganizationFilters && teamId ? { teamId } : {}),
      };

      const blob =
        format === "xlsx"
          ? await attendanceService.downloadMonthlyReportExcel(companyId, query)
          : await attendanceService.downloadMonthlyReportPdf(companyId, query);

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      const selectedDepartment = departments.find(
        (department) => department._id === departmentId,
      );

      const selectedTeam = teams.find((team) => team._id === teamId);

      const sanitizeFilename = (value: string) =>
        value
          .trim()
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      const filenameParts = ["monthly-attendance"];

      if (showOrganizationFilters) {
        if (selectedDepartment) {
          filenameParts.push(sanitizeFilename(selectedDepartment.name));
        } else if (!selectedTeam) {
          filenameParts.push("All-Departments");
        }

        if (selectedTeam) {
          filenameParts.push(sanitizeFilename(selectedTeam.name));
        }
      } else {
        filenameParts.push("Authorized-Scope");
      }

      filenameParts.push(month);

      anchor.href = url;
      anchor.download = `${filenameParts.join("-")}.${format}`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setDownloadError(
        getApiErrorMessage(
          err,
          `Unable to download ${format.toUpperCase()} report.`,
        ),
      );
    } finally {
      setDownloading(null);
    }
  }

  if (!canRead) return null;

  return (
    <div className="space-y-6 pb-8">
      {/* FULL-PAGE DOWNLOAD OVERLAY */}
      {downloading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
        >
          <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-9 text-center shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Preparing Attendance Report
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Generating your {downloading === "xlsx" ? "Excel" : "PDF"} report
              for {formatMonth(month)}.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              This may take a little longer for companies with more employees.
              Please keep this page open.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing your download...
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Attendance / Reports
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Monthly Attendance Register
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review employee attendance, leave, working hours, and exceptions
            across the selected month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void handleDownload("xlsx")}
            disabled={loading || downloading !== null}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            {downloading === "xlsx" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Download Excel
          </button>

          <button
            type="button"
            onClick={() => void handleDownload("pdf")}
            disabled={loading || downloading !== null}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {downloading === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              disabled={loading}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex min-w-48 items-center justify-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              {formatMonth(month)}
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={loading}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={applySearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search employee name or code..."
                disabled={loading}
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 lg:w-64"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </button>
          </form>
        </div>

        {/* DEPARTMENT AND TEAM FILTERS */}
        {showOrganizationFilters && (
          <>
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="monthly-report-department"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Department
                </label>

                <select
                  id="monthly-report-department"
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setTeamId("");
                    setPage(1);
                    setSelected(null);
                  }}
                  disabled={loading || filtersLoading}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 disabled:opacity-50"
                >
                  <option value="">All Departments</option>

                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="monthly-report-team"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Team
                </label>

                <select
                  id="monthly-report-team"
                  value={teamId}
                  onChange={(event) => {
                    setTeamId(event.target.value);
                    setPage(1);
                    setSelected(null);
                  }}
                  disabled={loading || filtersLoading}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 disabled:opacity-50"
                >
                  <option value="">All Teams</option>

                  {availableTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtersError && (
              <p role="alert" className="mt-3 text-xs text-amber-700">
                {filtersError}
              </p>
            )}
          </>
        )}
      </div>

      {/* DOWNLOAD ERROR */}

      {downloadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {downloadError}
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-start justify-center rounded-xl bg-white/75 pt-32 backdrop-blur-[2px]">
            <div
              role="status"
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-lg"
            >
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

              <p className="text-sm font-semibold text-slate-900">
                Loading attendance report...
              </p>

              <p className="text-xs text-slate-500">
                Fetching records for {formatMonth(month)}
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY — CURRENT PAGE ONLY */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Monthly Overview</h2>
            <span className="text-xs text-slate-500">
              Totals for displayed employees only
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SummaryCard label="Employees" value={items.length} icon={Users} />
            <SummaryCard
              label="Present Days"
              value={totals.present}
              icon={Users}
            />
            <SummaryCard
              label="Half Days"
              value={totals.halfDay}
              icon={Clock3}
            />
            <SummaryCard
              label="Absent Days"
              value={totals.absent}
              icon={Users}
            />
            <SummaryCard
              label="Leave Days"
              value={totals.leave}
              icon={CalendarDays}
            />
            <SummaryCard
              label="Worked Hours"
              value={formatMinutes(totals.worked)}
              icon={Clock3}
            />
          </div>
        </div>

        {/* LEGEND */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Legend
            </span>
            {Object.values(statusConfig).map((status) => (
              <div key={status.label} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-[10px] font-semibold ${status.className}`}
                >
                  {status.short}
                </span>
                <span className="text-xs text-slate-600">{status.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                L
              </span>
              <span className="text-xs text-slate-600">Late Arrival</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MONTHLY MATRIX */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Employee Attendance Matrix
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Scroll horizontally to view all dates. Select a status to
                inspect details.
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {pagination?.total ?? 0} employees
            </span>
          </div>

          {loading ? (
            <div className="min-h-[350px]" />
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-900">
                No employees found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another month or search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-max min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="sticky left-0 z-20 min-w-56 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left">
                      Employee
                    </th>

                    {dates.map((date) => (
                      <th
                        key={date}
                        className="min-w-11 border-b border-slate-200 px-1 py-3 text-center"
                      >
                        {Number(date.slice(-2))}
                      </th>
                    ))}

                    <th className="border-b border-slate-200 px-3 py-3">P</th>
                    <th className="border-b border-slate-200 px-3 py-3">HD</th>
                    <th className="border-b border-slate-200 px-3 py-3">A</th>
                    <th className="border-b border-slate-200 px-3 py-3">L</th>
                    <th className="border-b border-slate-200 px-3 py-3">NR</th>
                    <th className="border-b border-slate-200 px-3 py-3">
                      Hours
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((employee) => {
                    const daysByDate = new Map(
                      employee.days.map((day) => [day.date, day]),
                    );

                    return (
                      <tr
                        key={employee.companyAccessId}
                        className="hover:bg-slate-50"
                      >
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {employee.employeeName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {employee.employeeCode}
                            {employee.designation
                              ? ` · ${employee.designation}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {employee.department?.name ?? "No department"}
                            {" / "}
                            {employee.team?.name ?? "No team"}
                          </p>
                        </td>

                        {dates.map((date) => {
                          const day = daysByDate.get(date);

                          return (
                            <td key={date} className="px-1 py-2 text-center">
                              {day ? (
                                <StatusCell
                                  day={day}
                                  onClick={() => setSelected({ employee, day })}
                                />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="px-3 text-center font-medium">
                          {employee.totals.present}
                        </td>
                        <td className="px-3 text-center">
                          {employee.totals.halfDay}
                        </td>
                        <td className="px-3 text-center">
                          {employee.totals.absent}
                        </td>
                        <td className="px-3 text-center">
                          {employee.totals.onLeave}
                        </td>
                        <td className="px-3 text-center">
                          {employee.totals.missingAttendance}
                        </td>
                        <td className="whitespace-nowrap px-3 text-center font-medium">
                          {formatMinutes(employee.totals.totalWorkedMinutes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
              {" · "}
              {pagination.total} employees
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DAY DETAILS */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Attendance day details"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Attendance Details
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {selected.employee.employeeName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.employee.employeeCode} · {selected.day.date}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${statusConfig[selected.day.displayStatus].className}`}
              >
                {statusConfig[selected.day.displayStatus].label}
              </span>
              {selected.day.attendance?.isLate && (
                <span className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  Late Arrival
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                [
                  "Check In",
                  formatTime(selected.day.attendance?.firstCheckInAt ?? null),
                ],
                [
                  "Check Out",
                  formatTime(selected.day.attendance?.lastCheckOutAt ?? null),
                ],
                [
                  "Worked",
                  formatMinutes(
                    selected.day.attendance?.totalWorkedMinutes ?? 0,
                  ),
                ],
                [
                  "Break",
                  formatMinutes(
                    selected.day.attendance?.totalBreakMinutes ?? 0,
                  ),
                ],
                ["Leave Days", String(selected.day.totalLeaveDays)],
                [
                  "Workday",
                  selected.day.workDay.classification.replaceAll("_", " "),
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {selected.day.hasLeaveAttendanceOverlap && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Attendance and approved leave overlap on this date.
              </p>
            )}

            {selected.day.approvedLeaves.length > 0 && (
              <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-violet-800">
                <p className="font-semibold">Approved Leave</p>
                {selected.day.approvedLeaves.map((leave) => (
                  <p
                    key={`${leave.leaveRequestId}-${leave.dayPortion}`}
                    className="mt-1"
                  >
                    {leave.dayPortion.replaceAll("_", " ")} · {leave.leaveDays}{" "}
                    day(s)
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
