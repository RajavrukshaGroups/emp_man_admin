"use client";

import axios from "axios";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { platformAdminService } from "../services/platform-admin.service";

import type {
  PlatformAdminListData,
  PlatformAdminStatus,
} from "../types/platform-admin.types";

const PAGE_SIZE = 10;

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve platform administrators.",
) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusClassNames: Record<PlatformAdminStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
};

export function PlatformAdminList() {
  const [result, setResult] = useState<PlatformAdminListData>({
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

  const [status, setStatus] = useState<PlatformAdminStatus | "">("");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const adminResult = await platformAdminService.getPlatformAdmins({
        page,
        limit: PAGE_SIZE,

        search: search || undefined,

        status: status || undefined,

        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setResult(adminResult);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: PlatformAdminStatus | "") {
    setPage(1);

    setStatus(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Platform Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Platform Administrators
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage GLOBAL administrators who can access the Employee Management
            platform.
          </p>
        </div>

        <Link
          href="/platform/admins/create"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add platform admin
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={UserCog}
          label="Total admins"
          value={result.pagination.totalRecords}
        />

        <SummaryCard
          icon={ShieldCheck}
          label="Displayed admins"
          value={result.records.length}
        />

        <SummaryCard
          icon={UserCog}
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
                  placeholder="Search name, email, mobile or role"
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
                handleStatusChange(
                  event.target.value as PlatformAdminStatus | "",
                )
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <button
              type="button"
              onClick={() => void loadAdmins()}
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
          <PlatformAdminTableSkeleton />
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load platform administrators
            </h2>

            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadAdmins()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : result.records.length === 0 ? (
          <PlatformAdminEmptyState hasFilters={Boolean(search || status)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <TableHeading>Administrator</TableHeading>

                    <TableHeading>Email</TableHeading>

                    <TableHeading>Role</TableHeading>

                    <TableHeading>Status</TableHeading>

                    <TableHeading>Last login</TableHeading>

                    <TableHeading>Created</TableHeading>

                    <TableHeading align="right">Actions</TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {result.records.map((admin) => (
                    <tr
                      key={admin._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <TableCell>
                        <div>
                          <Link
                            href={`/platform/admins/${admin._id}`}
                            className="font-semibold text-slate-950 transition hover:text-blue-600"
                          >
                            {admin.user.displayName ||
                              [admin.user.firstName, admin.user.lastName]
                                .filter(Boolean)
                                .join(" ") ||
                              "Platform Administrator"}
                          </Link>

                          <p className="mt-1 text-xs text-slate-500">
                            {admin.user.mobile || "No mobile number"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="break-all">{admin.user.email}</span>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-700">
                            {admin.role.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {admin.role.code}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            statusClassNames[admin.status]
                          }`}
                        >
                          {admin.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {formatDateTime(admin.user.lastLoginAt)}
                      </TableCell>

                      <TableCell>{formatDateTime(admin.createdAt)}</TableCell>

                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/platform/admins/${admin._id}`}
                            title="View administrator"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/platform/admins/${admin._id}/edit`}
                            title="Edit administrator"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
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
                platform administrators
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!result.pagination.hasPreviousPage || isLoading}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
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
                  onClick={() => setPage((current) => current + 1)}
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

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
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

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
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

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
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

function PlatformAdminTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function PlatformAdminEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <UserCog className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters
          ? "No matching administrators"
          : "No platform administrators"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No platform administrator matches the selected search or status."
          : "Create a platform administrator to provide GLOBAL platform access."}
      </p>

      {!hasFilters && (
        <Link
          href="/platform/admins/create"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add platform admin
        </Link>
      )}
    </div>
  );
}
