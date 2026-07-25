"use client";

import axios from "axios";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";
import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeListResult,
  EmployeeStatus,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";
import { useAuthStore } from "@/store/auth.store";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to retrieve employees."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to retrieve employees.";
}

function isPopulatedUser(
  value: Employee["userId"],
): value is EmployeeUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedCompanyAccess(
  value: Employee["companyAccessId"],
): value is EmployeeCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getEmployeeUser(employee: Employee) {
  return isPopulatedUser(employee.userId) ? employee.userId : null;
}

function getCompanyAccess(employee: Employee) {
  return isPopulatedCompanyAccess(employee.companyAccessId)
    ? employee.companyAccessId
    : null;
}

function getReferenceName(
  value:
    | EmployeeCompanyAccessReference["departmentId"]
    | EmployeeCompanyAccessReference["teamId"],
) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

function getInitials(name?: string) {
  if (!name) {
    return "NA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatEmploymentType(value?: string) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const statusClassNames: Record<EmployeeStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};

export default function EmployeesPage() {
  const company = useAuthStore((state) => state.company);

  const [result, setResult] = useState<EmployeeListResult>({
    records: [],
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      totalRecords: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      setErrorMessage("Active company context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const employeeResult = await employeeService.getEmployees(company._id, {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setResult(employeeResult);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, search, status]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: EmployeeStatus | "") {
    setPage(1);
    setStatus(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Employees
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee profiles, employment information and company access.
          </p>
        </div>

        <Link
          href="/onboarding/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add employee
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={UsersRound}
          label="Total employees"
          value={result.pagination.totalRecords}
        />

        <SummaryCard
          icon={UserRound}
          label="Displayed employees"
          value={result.records.length}
        />

        <SummaryCard
          icon={BriefcaseBusiness}
          label="Current page"
          value={
            result.pagination.totalPages > 0
              ? `${result.pagination.page} of ${result.pagination.totalPages}`
              : "0"
          }
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name, code, email, mobile or designation"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as EmployeeStatus | "")
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <EmployeesTableSkeleton />
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load employees
            </h2>

            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : result.records.length === 0 ? (
          <EmployeeEmptyState hasFilters={Boolean(search || status)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <TableHeading>Employee</TableHeading>
                    <TableHeading>Employee code</TableHeading>
                    <TableHeading>Department</TableHeading>
                    <TableHeading>Designation</TableHeading>
                    <TableHeading>Employment type</TableHeading>
                    <TableHeading>Joined on</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading align="right">Actions</TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {result.records.map((employee) => {
                    const user = getEmployeeUser(employee);
                    const companyAccess = getCompanyAccess(employee);

                    const employeeName =
                      user?.displayName || "Unnamed employee";

                    return (
                      <tr
                        key={employee._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user?.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt={employeeName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                                {getInitials(employeeName)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <Link
                                href={`/employees/${employee._id}`}
                                className="block truncate font-semibold text-slate-950 hover:text-blue-600"
                              >
                                {employeeName}
                              </Link>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {user?.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium text-slate-700">
                            {companyAccess?.employeeCode || "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {getReferenceName(companyAccess?.departmentId)}
                        </TableCell>

                        <TableCell>
                          {companyAccess?.designation || "—"}
                        </TableCell>

                        <TableCell>
                          {formatEmploymentType(companyAccess?.employmentType)}
                        </TableCell>

                        <TableCell>
                          {formatDate(companyAccess?.joiningDate)}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              statusClassNames[employee.status]
                            }`}
                          >
                            {employee.status}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/employees/${employee._id}`}
                              title="View employee"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/employees/${employee._id}/edit`}
                              title="Edit employee"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {result.records.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {result.pagination.totalRecords}
                </span>{" "}
                employees
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!result.pagination.hasPreviousPage || isLoading}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="px-2 text-sm font-medium text-slate-600">
                  Page {result.pagination.page} of{" "}
                  {result.pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={!result.pagination.hasNextPage || isLoading}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TableHeadingProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableHeading({ children, align = "left" }: TableHeadingProps) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableCell({ children, align = "left" }: TableCellProps) {
  return (
    <td
      className={`px-5 py-4 text-sm text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function EmployeesTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function EmployeeEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <UsersRound className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters ? "No matching employees" : "No employees available"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No employee matches the selected search or status filter."
          : "Create the first employee account and complete the onboarding process."}
      </p>

      {!hasFilters && (
        <Link
          href="/onboarding/new"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add employee
        </Link>
      )}
    </div>
  );
}
