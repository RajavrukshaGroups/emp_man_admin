"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  KeyRound,
  Loader2,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { roleService } from "@/features/roles/services/role.service";

import type { Permission, Role } from "@/features/roles/types/role.types";

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
      "Unable to process role permissions."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process role permissions.";
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getPermissionId(permission: string | { _id: string }) {
  return typeof permission === "string" ? permission : permission._id;
}

function getScopeLabel(scopeType: Role["scopeType"]) {
  switch (scopeType) {
    case "GLOBAL":
      return "Global";

    case "COMPANY":
      return "Company";

    case "DEPARTMENT":
      return "Department";

    case "TEAM":
      return "Team";

    default:
      return scopeType;
  }
}

/**
 * ============================================================
 * MODULE LABEL
 * ============================================================
 */

function formatModuleName(module: string) {
  return module
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * ============================================================
 * ACTION LABEL
 * ============================================================
 */

function formatActionName(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function RolePermissionsPage() {
  const params = useParams<{
    roleId: string;
  }>();

  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const userPermissions = useAuthStore((state) => state.permissions);

  const roleId = params.roleId;

  const [role, setRole] = useState<Role | null>(null);

  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());

  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  /**
   * ==========================================================
   * ACCESS
   * ==========================================================
   */

  const hasRoleReadPermission = userPermissions.includes("role.read");

  const hasRoleUpdatePermission = userPermissions.includes("role.update");

  const canEditPermissions =
    hasRoleUpdatePermission && Boolean(role?.isPermissionEditable);

  const isReadOnly = !canEditPermissions;

  /**
   * ==========================================================
   * LOAD ROLE + ALL PERMISSIONS
   * ==========================================================
   */

  const loadData = useCallback(async () => {
    if (!company?._id || !roleId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [roleResult, permissionResult] = await Promise.all([
        roleService.getRoleById(company._id, roleId),

        roleService.getPermissions(),
      ]);

      setRole(roleResult);

      setPermissions(
        permissionResult.filter((permission) => permission.status === "ACTIVE"),
      );

      const existingPermissionIds =
        roleResult.permissionIds.map(getPermissionId);

      setSelectedPermissionIds(new Set(existingPermissionIds));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, roleId]);

  useEffect(() => {
    if (!hasRoleReadPermission) {
      setIsLoading(false);
      return;
    }

    void loadData();
  }, [hasRoleReadPermission, loadData]);

  /**
   * ==========================================================
   * GROUP PERMISSIONS BY MODULE
   * ==========================================================
   */

  const groupedPermissions = useMemo(() => {
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
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    const groups = new Map<string, Permission[]>();

    for (const permission of filteredPermissions) {
      const module = permission.module || "OTHER";

      const existing = groups.get(module) ?? [];

      existing.push(permission);

      groups.set(module, existing);
    }

    return Array.from(groups.entries())
      .map(([module, modulePermissions]) => ({
        module,
        permissions: modulePermissions.sort((left, right) =>
          left.action.localeCompare(right.action),
        ),
      }))
      .sort((left, right) => left.module.localeCompare(right.module));
  }, [permissions, search]);

  /**
   * ==========================================================
   * CHANGES
   * ==========================================================
   */

  const originalPermissionIds = useMemo(() => {
    if (!role) {
      return new Set<string>();
    }

    return new Set(role.permissionIds.map(getPermissionId));
  }, [role]);

  const hasChanges = useMemo(() => {
    if (originalPermissionIds.size !== selectedPermissionIds.size) {
      return true;
    }

    for (const permissionId of originalPermissionIds) {
      if (!selectedPermissionIds.has(permissionId)) {
        return true;
      }
    }

    return false;
  }, [originalPermissionIds, selectedPermissionIds]);

  /**
   * ==========================================================
   * TOGGLE SINGLE PERMISSION
   * ==========================================================
   */

  function togglePermission(permissionId: string) {
    if (!canEditPermissions) {
      return;
    }

    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  }

  /**
   * ==========================================================
   * MODULE SELECT ALL
   * ==========================================================
   */

  function selectModulePermissions(modulePermissions: Permission[]) {
    if (!canEditPermissions) {
      return;
    }

    const modulePermissionIds = modulePermissions.map(
      (permission) => permission._id,
    );

    const allSelected = modulePermissionIds.every((permissionId) =>
      selectedPermissionIds.has(permissionId),
    );

    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      for (const permissionId of modulePermissionIds) {
        if (allSelected) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }
      }

      return next;
    });
  }

  /**
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  async function handleSave() {
    if (!company?._id || !role) {
      toast.error("Active company context is unavailable.");
      return;
    }

    if (!canEditPermissions) {
      toast.error("Permissions of this role are protected.");
      return;
    }

    try {
      setIsSaving(true);

      const updatedRole = await roleService.updateRolePermissions(
        company._id,
        role._id,
        Array.from(selectedPermissionIds),
      );

      setRole(updatedRole);

      setSelectedPermissionIds(
        new Set(updatedRole.permissionIds.map(getPermissionId)),
      );

      toast.success("Role permissions updated successfully.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
   */

  if (!hasRoleReadPermission) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <ShieldCheck className="mx-auto size-10 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission access unavailable
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          You do not have permission to view role permissions.
        </p>

        <Link
          href="/roles"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading role permissions...
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   */

  if (!role) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <ShieldCheck className="mx-auto size-10 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Role unavailable
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          The requested role could not be loaded.
        </p>

        <Link
          href="/roles"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <Link
          href="/roles"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Access control
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {canEditPermissions ? "Manage permissions" : "View permissions"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {canEditPermissions
                ? `Configure what ${role.name} users can access.`
                : `Review the protected permissions assigned to ${role.name}.`}
            </p>
          </div>

          {canEditPermissions && (
            <button
              type="button"
              disabled={isSaving || !hasChanges}
              onClick={() => void handleSave()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save permissions
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          ROLE SUMMARY
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
              {canEditPermissions ? (
                <KeyRound className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">{role.name}</h2>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{role.code}</span>

                <span>•</span>

                <span>{getScopeLabel(role.scopeType)} scope</span>

                <span>•</span>

                <span>{role.isSystemRole ? "System role" : "Custom role"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Assigned
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {selectedPermissionIds.size}
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Available
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {permissions.length}
              </p>
            </div>
          </div>
        </div>

        {isReadOnly && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This is a protected role. Its permissions can be reviewed but cannot
            be changed.
          </div>
        )}

        {role.scopeType === "TEAM" && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
            Permission access does not expand this role beyond its team scope.
            Record-level restrictions are still enforced by the backend.
          </div>
        )}
      </section>

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <section className="rounded-2xl border bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions by name, code, module or action..."
            className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </section>

      {/* ======================================================
          PERMISSION GROUPS
      ====================================================== */}

      <div className="space-y-5">
        {groupedPermissions.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-900">
              No permissions found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search term.
            </p>
          </div>
        ) : (
          groupedPermissions.map(
            ({ module, permissions: modulePermissions }) => {
              const modulePermissionIds = modulePermissions.map(
                (permission) => permission._id,
              );

              const selectedCount = modulePermissionIds.filter((permissionId) =>
                selectedPermissionIds.has(permissionId),
              ).length;

              const allSelected =
                selectedCount === modulePermissionIds.length &&
                modulePermissionIds.length > 0;

              return (
                <section
                  key={module}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Module header */}

                  <div className="flex flex-col gap-3 border-b bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        {formatModuleName(module)}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedCount} of {modulePermissions.length}{" "}
                        permissions assigned
                      </p>
                    </div>

                    {canEditPermissions && (
                      <button
                        type="button"
                        onClick={() =>
                          selectModulePermissions(modulePermissions)
                        }
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {allSelected ? "Clear module" : "Select module"}
                      </button>
                    )}
                  </div>

                  {/* Permissions */}

                  <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
                    {modulePermissions.map((permission) => {
                      const selected = selectedPermissionIds.has(
                        permission._id,
                      );

                      return (
                        <button
                          key={permission._id}
                          type="button"
                          disabled={!canEditPermissions}
                          onClick={() => togglePermission(permission._id)}
                          className={[
                            "relative flex min-h-[132px] w-full items-start gap-3 bg-white p-5 text-left transition",
                            canEditPermissions
                              ? "cursor-pointer hover:bg-slate-50"
                              : "cursor-default",
                          ].join(" ")}
                        >
                          {/* checkbox */}

                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent",
                            ].join(" ")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>

                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">
                              {permission.name ||
                                formatActionName(permission.action)}
                            </span>

                            <span className="mt-1 block font-mono text-xs text-slate-400">
                              {permission.code}
                            </span>

                            {permission.description && (
                              <span className="mt-2 block text-xs leading-5 text-slate-500">
                                {permission.description}
                              </span>
                            )}

                            {!permission.description && (
                              <span className="mt-2 block text-xs leading-5 text-slate-500">
                                {formatActionName(permission.action)} access for{" "}
                                {formatModuleName(permission.module)}.
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            },
          )
        )}
      </div>

      {/* ======================================================
          FOOTER ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/roles")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {hasChanges && canEditPermissions
            ? "Cancel changes"
            : "Back to roles"}
        </button>

        {canEditPermissions && (
          <button
            type="button"
            disabled={isSaving || !hasChanges}
            onClick={() => void handleSave()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save permissions
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
