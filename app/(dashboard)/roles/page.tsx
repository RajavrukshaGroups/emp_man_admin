"use client";

import Link from "next/link";
import { useState } from "react";

import {
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { RoleTable } from "@/features/roles/components/role-table";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useAuthStore } from "@/store/auth.store";

export default function RolesPage() {
  const company = useAuthStore(
    (state) => state.company,
  );

  const permissions = useAuthStore(
    (state) => state.permissions,
  );

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const {
    data,
    isLoading,
    error,
  } = useRoles(company?._id, {
    page,
    limit: 10,
    search,
  });

  const canCreate =
    permissions.includes("role.create");

  const canUpdate =
    permissions.includes("role.update");

  const canDelete =
    permissions.includes("role.delete");

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Access control"
        title="Roles Management"
        description="Create roles and control what company users can access."
        actions={
          canCreate ? (
            <Link
              href="/roles/new"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Create role
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <ShieldCheck className="size-5 text-slate-500" />

          <p className="mt-4 text-sm text-slate-500">
            Total roles
          </p>

          <p className="mt-1 text-3xl font-bold">
            {data?.pagination.totalRecords ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search roles by name or code..."
            className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
          Loading roles...
        </div>
      ) : (
        <RoleTable
          roles={data?.records ?? []}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onDelete={(role) => {
            console.log(
              "Delete role:",
              role,
            );
          }}
        />
      )}

      {data &&
        data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page{" "}
              {data.pagination.page} of{" "}
              {data.pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  !data.pagination
                    .hasPreviousPage
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                  )
                }
                className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  !data.pagination
                    .hasNextPage
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1,
                  )
                }
                className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
}