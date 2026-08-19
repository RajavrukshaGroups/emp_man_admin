"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Search, ShieldCheck } from "lucide-react";

import { usePermissions } from "@/features/roles/hooks/use-permissions";
import { useAuthStore } from "@/store/auth.store";

function formatModuleName(module: string) {
  return module
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function PermissionsPage() {
  const userPermissions = useAuthStore((state) => state.permissions);

  const canReadPermissions = userPermissions.includes("permission.read");

  const { permissions, isLoading, error, refetch } = usePermissions();

  const [search, setSearch] = useState("");

  const filteredPermissions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return permissions;
    }

    return permissions.filter((permission) => {
      return (
        permission.name.toLowerCase().includes(keyword) ||
        permission.code.toLowerCase().includes(keyword) ||
        permission.module.toLowerCase().includes(keyword) ||
        permission.action.toLowerCase().includes(keyword)
      );
    });
  }, [permissions, search]);

  const groupedPermissions = useMemo(() => {
    const grouped = new Map<string, typeof permissions>();

    for (const permission of filteredPermissions) {
      const records = grouped.get(permission.module) ?? [];

      records.push(permission);

      grouped.set(permission.module, records);
    }

    return Array.from(grouped.entries()).map(([module, modulePermissions]) => ({
      module,
      permissions: modulePermissions,
    }));
  }, [filteredPermissions, permissions]);

  if (!canReadPermissions) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-600" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission denied
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to view system permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Access control</p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Permissions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View the system permissions available for role-based access control.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total permissions" value={permissions.length} />

        <SummaryCard
          label="Modules"
          value={
            new Set(permissions.map((permission) => permission.module)).size
          }
        />

        <SummaryCard
          label="Visible permissions"
          value={filteredPermissions.length}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search permission, module or action"
              className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading permissions...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-rose-600">{error}</p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {groupedPermissions.map((group) => (
              <section
                key={group.module}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <h2 className="font-semibold text-slate-950">
                    {formatModuleName(group.module)}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {group.permissions.length} permissions
                  </p>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission._id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <h3 className="font-semibold text-slate-900">
                        {permission.name}
                      </h3>

                      <p className="mt-1 font-mono text-xs text-blue-600">
                        {permission.code}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {formatModuleName(permission.module)} ·{" "}
                        {permission.action}
                      </p>

                      {permission.description && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
