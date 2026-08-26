"use client";

import Link from "next/link";
import { Eye, KeyRound, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { RoleStatusBadge } from "./role-status-badge";

import type { Role, RoleScopeType } from "../types/role.types";

interface RoleTableProps {
  roles: Role[];
  canUpdate: boolean;
  canDelete: boolean;
  onStatusChange: (role: Role) => void;
  onDelete: (role: Role) => void;
  isUpdatingStatus?: boolean;
}

/**
 * ============================================================
 * PERMISSION COUNT
 * ============================================================
 */

const getPermissionCount = (role: Role): number => {
  return role.permissionIds?.length ?? 0;
};

/**
 * ============================================================
 * SCOPE LABEL
 * ============================================================
 */

function getScopeLabel(scopeType: RoleScopeType) {
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
 * ROLE TABLE
 * ============================================================
 */

export function RoleTable({
  roles,
  canUpdate,
  canDelete,
  onStatusChange,
  onDelete,
  isUpdatingStatus = false,
}: RoleTableProps) {
  if (roles.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <ShieldCheck className="mx-auto size-10 text-slate-400" />

        <h3 className="mt-4 font-semibold text-slate-900">No roles found</h3>

        <p className="mt-1 text-sm text-slate-500">
          Create a role to assign permissions to company users.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Permissions
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {roles.map((role) => {
              /**
               * ------------------------------------------------
               * STRUCTURAL EDITING
               * ------------------------------------------------
               *
               * System roles:
               *
               * COMPANY_ADMIN
               * TEAM_LEAD
               * EMPLOYEE
               *
               * all have:
               *
               * isEditable = false
               *
               * so name/code/status cannot be changed.
               */

              const canModifyRole = canUpdate && role.isEditable;

              /**
               * ------------------------------------------------
               * PERMISSION EDITING
               * ------------------------------------------------
               *
               * COMPANY_ADMIN:
               * isPermissionEditable = false
               *
               * TEAM_LEAD:
               * isPermissionEditable = true
               *
               * EMPLOYEE:
               * isPermissionEditable = true
               *
               * Custom roles:
               * isPermissionEditable = true
               */

              const canManagePermissions =
                canUpdate && role.isPermissionEditable;

              /**
               * ------------------------------------------------
               * STATUS
               * ------------------------------------------------
               *
               * Only structurally editable/custom roles.
               */

              const canChangeStatus =
                canUpdate && role.isEditable && !role.isSystemRole;

              /**
               * ------------------------------------------------
               * DELETE
               * ------------------------------------------------
               *
               * System roles can never be deleted.
               */

              const canRemoveRole = canDelete && !role.isSystemRole;

              return (
                <tr key={role._id} className="transition hover:bg-slate-50/70">
                  {/* =================================================
                      ROLE
                  ================================================= */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <ShieldCheck className="size-5" />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {role.name}
                        </p>

                        <p className="text-xs text-slate-500">{role.code}</p>
                      </div>
                    </div>
                  </td>

                  {/* =================================================
                      SCOPE
                  ================================================= */}

                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        role.scopeType === "COMPANY"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : role.scopeType === "TEAM"
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : role.scopeType === "DEPARTMENT"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {getScopeLabel(role.scopeType)}
                    </span>
                  </td>

                  {/* =================================================
                      PERMISSIONS
                  ================================================= */}

                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {getPermissionCount(role)}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        permission
                        {getPermissionCount(role) === 1 ? "" : "s"}
                      </p>
                    </div>
                  </td>

                  {/* =================================================
                      TYPE
                  ================================================= */}

                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        role.isSystemRole
                          ? "border-slate-200 bg-slate-100 text-slate-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      {role.isSystemRole ? "System role" : "Custom role"}
                    </span>
                  </td>

                  {/* =================================================
                      STATUS
                  ================================================= */}

                  <td className="px-5 py-4">
                    <RoleStatusBadge status={role.status} />
                  </td>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {/* ============================================
                          VIEW / MANAGE PERMISSIONS

                          Always allow the permission page to open.

                          If editable:
                          Manage Permissions

                          If protected:
                          View Permissions
                      ============================================ */}

                      <Link
                        href={`/roles/${role._id}/permissions`}
                        title={
                          canManagePermissions
                            ? "Manage permissions"
                            : "View permissions"
                        }
                        aria-label={
                          canManagePermissions
                            ? `Manage permissions for ${role.name}`
                            : `View permissions for ${role.name}`
                        }
                        className={[
                          "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                          canManagePermissions
                            ? "border-blue-200 text-blue-600 hover:bg-blue-50"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {canManagePermissions ? (
                          <KeyRound className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Link>

                      {/* ============================================
                          EDIT CUSTOM ROLE
                      ============================================ */}

                      {canModifyRole ? (
                        <Link
                          href={`/roles/${role._id}/edit`}
                          title="Edit role"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                          aria-label={`Edit ${role.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      ) : null}

                      {/* ============================================
                          STATUS
                      ============================================ */}

                      {canChangeStatus ? (
                        <button
                          type="button"
                          onClick={() => onStatusChange(role)}
                          disabled={isUpdatingStatus}
                          className={[
                            "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            role.status === "ACTIVE"
                              ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                          ].join(" ")}
                        >
                          {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      ) : null}

                      {/* ============================================
                          DELETE CUSTOM ROLE
                      ============================================ */}

                      {canRemoveRole ? (
                        <button
                          type="button"
                          onClick={() => onDelete(role)}
                          title="Delete role"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50"
                          aria-label={`Delete ${role.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
