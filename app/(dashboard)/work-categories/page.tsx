"use client";

import axios from "axios";
import Link from "next/link";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { workCategoryService } from "@/features/work-categories/services/workCategory.service";

import type {
  WorkCategory,
  WorkCategoryStatus,
} from "@/features/work-categories/types/workCategory.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * ERROR MESSAGE
 * ============================================================
 */

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to process work categories."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process work categories.";
}

/**
 * ============================================================
 * REFERENCE HELPERS
 * ============================================================
 */

function getReferenceName(
  value: WorkCategory["departmentId"] | WorkCategory["teamId"],
) {
  if (!value || typeof value === "string") {
    return "—";
  }

  return value.name || "—";
}

function getReferenceId(
  value: WorkCategory["departmentId"] | WorkCategory["teamId"],
) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value._id;
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function WorkCategoriesPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canCreate = permissions.includes("work_category.create");
  const canUpdate = permissions.includes("work_category.update");
  const canDelete = permissions.includes("work_category.delete");

  const [records, setRecords] = useState<WorkCategory[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  /**
   * Filters
   */
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | WorkCategoryStatus>("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");

  /**
   * Pagination
   */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  /**
   * ==========================================================
   * LOAD
   * ==========================================================
   */

  const loadWorkCategories = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await workCategoryService.getWorkCategories(company._id, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
        departmentId: departmentId || undefined,
        teamId: teamId || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setRecords(result.records);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.totalRecords);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, search, status, departmentId, teamId]);

  useEffect(() => {
    void loadWorkCategories();
  }, [loadWorkCategories]);

  /**
   * ==========================================================
   * UNIQUE DEPARTMENTS / TEAMS FROM CURRENT DATA
   * ==========================================================
   */

  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();

    records.forEach((category) => {
      const id = getReferenceId(category.departmentId);

      if (!id) {
        return;
      }

      map.set(id, getReferenceName(category.departmentId));
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [records]);

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>();

    records.forEach((category) => {
      const currentDepartmentId = getReferenceId(category.departmentId);
      const currentTeamId = getReferenceId(category.teamId);

      if (!currentTeamId) {
        return;
      }

      if (departmentId && currentDepartmentId !== departmentId) {
        return;
      }

      map.set(currentTeamId, getReferenceName(category.teamId));
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [records, departmentId]);

  /**
   * ==========================================================
   * STATUS UPDATE
   * ==========================================================
   */

  async function handleStatusChange(category: WorkCategory) {
    if (!company?._id || !canUpdate) {
      return;
    }

    const nextStatus: WorkCategoryStatus =
      category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setIsUpdatingStatus(category._id);

      await workCategoryService.updateWorkCategoryStatus(
        company._id,
        category._id,
        {
          status: nextStatus,
        },
      );

      toast.success(
        nextStatus === "ACTIVE"
          ? "Work category activated."
          : "Work category deactivated.",
      );

      await loadWorkCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingStatus(null);
    }
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  async function handleDelete(category: WorkCategory) {
    if (!company?._id || !canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.name}"? This will soft-delete the work category.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(category._id);

      await workCategoryService.deleteWorkCategory(company._id, category._id);

      toast.success("Work category deleted successfully.");

      await loadWorkCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(null);
    }
  }

  /**
   * ==========================================================
   * EMPTY COMPANY
   * ==========================================================
   */

  if (!company?._id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">No active company</h1>

        <p className="mt-2 text-sm text-slate-500">
          Select or connect an active company to manage work categories.
        </p>
      </div>
    );
  }

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Work management</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Work Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the types of work available to departments and teams.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/work-categories/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create category
          </Link>
        )}
      </div>

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total categories" value={totalRecords} />

        <StatCard
          label="Active"
          value={records.filter((item) => item.status === "ACTIVE").length}
        />

        <StatCard
          label="Inactive"
          value={records.filter((item) => item.status === "INACTIVE").length}
        />
      </div>

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_220px_220px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search category or code..."
              className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setTeamId("");
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All departments</option>

            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={teamId}
            onChange={(event) => {
              setTeamId(event.target.value);
              setPage(1);
            }}
            disabled={!departmentId}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">All teams</option>

            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | WorkCategoryStatus);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => void loadWorkCategories()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </section>

      {/* Table */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Tags className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-semibold text-slate-950">
              No work categories found
            </h2>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Create a category or change the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Category</TableHeading>
                  <TableHeading>Department</TableHeading>
                  <TableHeading>Team</TableHeading>
                  <TableHeading>Unit</TableHeading>
                  <TableHeading>Weight</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading align="right">Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((category) => (
                  <tr
                    key={category._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="min-w-48">
                        <p className="font-semibold text-slate-900">
                          {category.name}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {category.code}
                        </p>

                        {category.description && (
                          <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-5 text-slate-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {getReferenceName(category.departmentId)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {getReferenceName(category.teamId)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {category.unitLabel}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {category.workloadWeight}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(category)}
                        disabled={
                          !canUpdate || isUpdatingStatus === category._id
                        }
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                          category.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isUpdatingStatus === category._id
                          ? "Updating..."
                          : category.status}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Link
                            href={`/work-categories/${category._id}/edit`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                            title="Edit work category"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(category)}
                            disabled={isDeleting === category._id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                            title="Delete work category"
                          >
                            {isDeleting === category._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}

        {!isLoading && records.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.max(totalPages, 1)} · {totalRecords} records
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

/**
 * ============================================================
 * TABLE HEADING
 * ============================================================
 */

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
