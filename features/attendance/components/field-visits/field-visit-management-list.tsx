"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../../services/attendance.service";

import type {
  AttendanceDepartmentReference,
  AttendanceTeamReference,
  FieldVisit,
  FieldVisitCompanyAccess,
  FieldVisitEmployee,
  FieldVisitStatus,
  FieldVisitType,
} from "../../types/attendance.types";

const PAGE_SIZE = 20;

const VISIT_TYPES: Array<{
  value: "" | FieldVisitType;
  label: string;
}> = [
  { value: "", label: "All visit types" },
  { value: "CLIENT_VISIT", label: "Client Visit" },
  { value: "PROJECT_SITE", label: "Project Site" },
  { value: "SALES_VISIT", label: "Sales Visit" },
  { value: "VENDOR_VISIT", label: "Vendor Visit" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "COLLECTION", label: "Collection" },
  { value: "OFFICIAL_ERRAND", label: "Official Errand" },
  { value: "OTHER", label: "Other" },
];

const STATUSES: Array<{
  value: "" | FieldVisitStatus;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function FieldVisitManagementList() {
  const company = useAuthStore((state) => state.company);

  const [items, setItems] = useState<FieldVisit[]>([]);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  const [visitType, setVisitType] = useState<"" | FieldVisitType>("");

  const [status, setStatus] = useState<"" | FieldVisitStatus>("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  /**
   * ============================================================
   * LOAD FIELD VISITS
   * ============================================================
   *
   * SECURITY:
   * Backend scope determines which visits are visible.
   *
   * Do NOT fetch company-wide records and filter them here.
   */
  const loadFieldVisits = useCallback(async () => {
    if (!company?._id) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);

      return;
    }

    if (fromDate && toDate && toDate < fromDate) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);

      const result = await attendanceService.getFieldVisits(company._id, {
        page,
        limit: PAGE_SIZE,

        visitType: visitType || undefined,

        status: status || undefined,

        fromDate: fromDate || undefined,

        toDate: toDate || undefined,
      });

      setItems(result.items);

      setTotal(result.pagination.total);

      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (error) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);

      toast.error(getApiErrorMessage(error, "Unable to load field visits."));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, visitType, status, fromDate, toDate]);

  useEffect(() => {
    void loadFieldVisits();
  }, [loadFieldVisits]);

  const handleVisitTypeChange = (value: "" | FieldVisitType) => {
    setPage(1);
    setVisitType(value);
  };

  const handleStatusChange = (value: "" | FieldVisitStatus) => {
    setPage(1);
    setStatus(value);
  };

  const handleFromDateChange = (value: string) => {
    setPage(1);
    setFromDate(value);
  };

  const handleToDateChange = (value: string) => {
    setPage(1);
    setToDate(value);
  };

  const clearFilters = () => {
    setPage(1);
    setVisitType("");
    setStatus("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    Boolean(visitType) ||
    Boolean(status) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const invalidDateRange =
    Boolean(fromDate) && Boolean(toDate) && toDate < fromDate;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-slate-950">
                Field Visits
              </h2>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Review employee field visits available within your attendance
              access scope.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFieldVisits()}
            disabled={isLoading || invalidDateRange}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ============================================================
            FILTERS
            ============================================================ */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="fieldVisitManagementType"
              className="text-xs font-medium text-slate-500"
            >
              Visit type
            </label>

            <select
              id="fieldVisitManagementType"
              value={visitType}
              onChange={(event) =>
                handleVisitTypeChange(event.target.value as "" | FieldVisitType)
              }
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {VISIT_TYPES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fieldVisitManagementStatus"
              className="text-xs font-medium text-slate-500"
            >
              Status
            </label>

            <select
              id="fieldVisitManagementStatus"
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as "" | FieldVisitStatus)
              }
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {STATUSES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fieldVisitManagementFromDate"
              className="text-xs font-medium text-slate-500"
            >
              From date
            </label>

            <input
              id="fieldVisitManagementFromDate"
              type="date"
              value={fromDate}
              onChange={(event) => handleFromDateChange(event.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="fieldVisitManagementToDate"
              className="text-xs font-medium text-slate-500"
            >
              To date
            </label>

            <input
              id="fieldVisitManagementToDate"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => handleToDateChange(event.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
          </div>
        </div>

        {invalidDateRange ? (
          <p className="mt-3 text-xs font-medium text-red-600">
            To date cannot be earlier than from date.
          </p>
        ) : null}

        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* ============================================================
          CONTENT
          ============================================================ */}
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading employee field visits...
          </div>
        </div>
      ) : invalidDateRange ? (
        <div className="flex min-h-52 items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-500">
            Select a valid date range to view field visits.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-5 w-5 text-slate-500" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No field visits found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            There are no employee field visits matching the current filters
            within your access scope.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <TableHeading>Employee</TableHeading>

                  <TableHeading>Department / Team</TableHeading>

                  <TableHeading>Visit</TableHeading>

                  <TableHeading>Date</TableHeading>

                  <TableHeading>Started</TableHeading>

                  <TableHeading>Ended</TableHeading>

                  <TableHeading>Duration</TableHeading>

                  <TableHeading>Status</TableHeading>
                  <TableHeading>Action</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((visit) => (
                  <FieldVisitTableRow key={visit._id} visit={visit} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {items.map((visit) => (
              <FieldVisitManagementCard key={visit._id} visit={visit} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {total} field visit{total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages))
                }
                disabled={page >= totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * ============================================================
 * DESKTOP ROW
 * ============================================================
 */

function FieldVisitTableRow({ visit }: { visit: FieldVisit }) {
  const employee = getEmployeeDetails(visit);

  const access = getCompanyAccess(visit);

  const department = getDepartment(access);

  const team = getTeam(access);

  return (
    <tr className="align-top transition hover:bg-slate-50/70">
      <TableCell>
        <div>
          <p className="font-semibold text-slate-900">{employee.name}</p>

          <p className="mt-1 text-xs text-slate-500">
            {access?.employeeCode || "No employee code"}
          </p>

          {access?.designation ? (
            <p className="mt-1 text-xs text-slate-400">{access.designation}</p>
          ) : null}
        </div>
      </TableCell>

      <TableCell>
        <p className="font-medium text-slate-800">{department?.name || "—"}</p>

        <p className="mt-1 text-xs text-slate-500">{team?.name || "No team"}</p>
      </TableCell>

      <TableCell>
        <div className="max-w-[230px]">
          <p className="font-semibold text-slate-900">
            {visit.siteName || formatVisitType(visit.visitType)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatVisitType(visit.visitType)}
          </p>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {visit.purpose}
          </p>
        </div>
      </TableCell>

      <TableCell>{formatDate(visit.attendanceDate)}</TableCell>

      <TableCell>{formatTime(visit.startedAt)}</TableCell>

      <TableCell>{visit.endedAt ? formatTime(visit.endedAt) : "—"}</TableCell>

      <TableCell>
        {visit.status === "COMPLETED"
          ? formatDuration(visit.durationMinutes)
          : "—"}
      </TableCell>

      <TableCell>
        <FieldVisitStatusBadge status={visit.status} />
      </TableCell>

      <TableCell>
        <Link
          href={`/attendance/field-visits/${visit._id}?from=manage`}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" />
          View Details
        </Link>
      </TableCell>
    </tr>
  );
}

/**
 * ============================================================
 * MOBILE / TABLET CARD
 * ============================================================
 */

function FieldVisitManagementCard({ visit }: { visit: FieldVisit }) {
  const employee = getEmployeeDetails(visit);

  const access = getCompanyAccess(visit);

  const department = getDepartment(access);

  const team = getTeam(access);

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{employee.name}</p>

          <p className="mt-1 text-xs text-slate-500">
            {access?.employeeCode || "No employee code"}

            {access?.designation ? ` · ${access.designation}` : ""}
          </p>
        </div>

        <FieldVisitStatusBadge status={visit.status} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">
          {visit.siteName || formatVisitType(visit.visitType)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {formatVisitType(visit.visitType)}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-700">{visit.purpose}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ManagementInfo label="Department" value={department?.name || "—"} />

        <ManagementInfo label="Team" value={team?.name || "—"} />

        <ManagementInfo label="Date" value={formatDate(visit.attendanceDate)} />

        <ManagementInfo
          label="Duration"
          value={
            visit.status === "COMPLETED"
              ? formatDuration(visit.durationMinutes)
              : "—"
          }
        />

        <ManagementInfo label="Started" value={formatTime(visit.startedAt)} />

        <ManagementInfo
          label="Ended"
          value={visit.endedAt ? formatTime(visit.endedAt) : "—"}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/attendance/field-visits/${visit._id}?from=manage`}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Link>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getEmployeeDetails(visit: FieldVisit) {
  if (!visit.employeeId || typeof visit.employeeId === "string") {
    return {
      name: "Employee",
    };
  }

  const employee = visit.employeeId as FieldVisitEmployee;

  if (!employee.userId || typeof employee.userId === "string") {
    return {
      name: "Employee",
    };
  }

  const user = employee.userId;

  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    name: user.displayName || fullName || "Employee",
  };
}

function getCompanyAccess(visit: FieldVisit): FieldVisitCompanyAccess | null {
  if (!visit.companyAccessId || typeof visit.companyAccessId === "string") {
    return null;
  }

  return visit.companyAccessId;
}

function getDepartment(
  access: FieldVisitCompanyAccess | null,
): AttendanceDepartmentReference | null {
  if (!access?.departmentId || typeof access.departmentId === "string") {
    return null;
  }

  return access.departmentId;
}

function getTeam(
  access: FieldVisitCompanyAccess | null,
): AttendanceTeamReference | null {
  if (!access?.teamId || typeof access.teamId === "string") {
    return null;
  }

  return access.teamId;
}

function FieldVisitStatusBadge({ status }: { status: FieldVisitStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <Ban className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Navigation className="h-3.5 w-3.5" />
      In Progress
    </span>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4 text-sm text-slate-700">{children}</td>;
}

function ManagementInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatVisitType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
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

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "< 1 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}
