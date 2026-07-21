"use client";

import { useMemo, useState } from "react";
import { CheckSquare2, Search, ShieldCheck, Square } from "lucide-react";

import type { Permission } from "../types/role.types";

interface RolePermissionSelectorProps {
  permissions: Permission[];
  value: string[];
  onChange: (permissionIds: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function RolePermissionSelector({
  permissions,
  value,
  onChange,
  isLoading = false,
  error = null,
  disabled = false,
}: RolePermissionSelectorProps) {
  const [search, setSearch] = useState("");

  const selectedPermissionIds = useMemo(() => new Set(value), [value]);

  const groupedPermissions = useMemo<PermissionGroup[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filteredPermissions = permissions.filter((permission) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        permission.name,
        permission.code,
        permission.module,
        permission.action,
        permission.description ?? "",
      ].some((field) => field.toLowerCase().includes(normalizedSearch));
    });

    const permissionMap = filteredPermissions.reduce<
      Record<string, Permission[]>
    >((groups, permission) => {
      const moduleName = permission.module || "other";

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }

      groups[moduleName].push(permission);

      return groups;
    }, {});

    return Object.entries(permissionMap)
      .map(([module, modulePermissions]) => ({
        module,
        permissions: [...modulePermissions].sort((first, second) =>
          first.action.localeCompare(second.action),
        ),
      }))
      .sort((first, second) => first.module.localeCompare(second.module));
  }, [permissions, search]);

  const visiblePermissionIds = useMemo(
    () =>
      groupedPermissions.flatMap((group) =>
        group.permissions.map((permission) => permission._id),
      ),
    [groupedPermissions],
  );

  const areAllVisiblePermissionsSelected =
    visiblePermissionIds.length > 0 &&
    visiblePermissionIds.every((permissionId) =>
      selectedPermissionIds.has(permissionId),
    );

  const handlePermissionToggle = (permissionId: string) => {
    if (disabled) {
      return;
    }

    if (selectedPermissionIds.has(permissionId)) {
      onChange(value.filter((selectedId) => selectedId !== permissionId));

      return;
    }

    onChange([...value, permissionId]);
  };

  const handleModuleToggle = (modulePermissions: Permission[]) => {
    if (disabled) {
      return;
    }

    const modulePermissionIds = modulePermissions.map(
      (permission) => permission._id,
    );

    const areAllSelected = modulePermissionIds.every((permissionId) =>
      selectedPermissionIds.has(permissionId),
    );

    if (areAllSelected) {
      onChange(
        value.filter((selectedId) => !modulePermissionIds.includes(selectedId)),
      );

      return;
    }

    onChange(Array.from(new Set([...value, ...modulePermissionIds])));
  };

  const handleSelectAllVisible = () => {
    if (disabled || visiblePermissionIds.length === 0) {
      return;
    }

    if (areAllVisiblePermissionsSelected) {
      onChange(
        value.filter(
          (selectedId) => !visiblePermissionIds.includes(selectedId),
        ),
      );

      return;
    }

    onChange(Array.from(new Set([...value, ...visiblePermissionIds])));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="space-y-3 rounded-lg border border-slate-200 p-4"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-16 animate-pulse rounded bg-slate-100" />
                <div className="h-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-700" />

            <h3 className="text-base font-semibold text-slate-950">
              Permissions
            </h3>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Select the actions this role is allowed to perform.
          </p>
        </div>

        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-950">{value.length}</span>{" "}
          selected
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions..."
            disabled={disabled}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={handleSelectAllVisible}
          disabled={disabled || visiblePermissionIds.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {areAllVisiblePermissionsSelected ? (
            <CheckSquare2 className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}

          {areAllVisiblePermissionsSelected
            ? "Clear visible"
            : "Select all visible"}
        </button>
      </div>

      {groupedPermissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-medium text-slate-950">No permissions found</p>

          <p className="mt-1 text-sm text-slate-500">
            Try changing your search term.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPermissions.map((group) => {
            const modulePermissionIds = group.permissions.map(
              (permission) => permission._id,
            );

            const selectedCount = modulePermissionIds.filter((permissionId) =>
              selectedPermissionIds.has(permissionId),
            ).length;

            const areAllSelected = selectedCount === modulePermissionIds.length;

            return (
              <section
                key={group.module}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {formatLabel(group.module)}
                    </h4>

                    <p className="text-xs text-slate-500">
                      {selectedCount} of {group.permissions.length} selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleModuleToggle(group.permissions)}
                    disabled={disabled}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {areAllSelected ? (
                      <CheckSquare2 className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}

                    {areAllSelected ? "Clear module" : "Select module"}
                  </button>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.permissions.map((permission) => {
                    const isSelected = selectedPermissionIds.has(
                      permission._id,
                    );

                    return (
                      <label
                        key={permission._id}
                        className={[
                          "flex cursor-pointer gap-3 rounded-lg border p-4 transition",
                          isSelected
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                          disabled ? "cursor-not-allowed opacity-60" : "",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handlePermissionToggle(permission._id)
                          }
                          disabled={disabled}
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-950"
                        />

                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-950">
                            {permission.name || formatLabel(permission.action)}
                          </span>

                          <span className="mt-1 block break-all text-xs font-medium text-slate-700">
                            {permission.code}
                          </span>

                          {permission.description ? (
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {permission.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
