"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { RoleStatusBadge } from "./role-status-badge";

import type { Role } from "../types/role.types";

interface RoleTableProps {
  roles: Role[];
  canUpdate: boolean;
  canDelete: boolean;
  onStatusChange: (role: Role) => void;
  onDelete: (role: Role) => void;
  isUpdatingStatus?: boolean;
}

const getPermissionCount = (role: Role): number => {
  return role.permissionIds?.length ?? 0;
};

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
        <table className="w-full min-w-[1000px]">
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
              const canModifyRole = canUpdate && role.isEditable;

              const canChangeStatus = canUpdate && !role.isSystemRole;

              const canRemoveRole = canDelete && !role.isSystemRole;

              return (
                <tr key={role._id} className="transition hover:bg-slate-50/70">
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

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {role.scopeType === "PLATFORM" ? "Platform" : "Company"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {getPermissionCount(role)}
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {role.isSystemRole ? "System role" : "Custom role"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <RoleStatusBadge status={role.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canModifyRole ? (
                        <Link
                          href={`/roles/${role._id}/edit`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                          aria-label={`Edit ${role.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      ) : null}

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

                      {canRemoveRole ? (
                        <button
                          type="button"
                          onClick={() => onDelete(role)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50"
                          aria-label={`Delete ${role.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}

                      {!canModifyRole && !canChangeStatus && !canRemoveRole ? (
                        <button
                          type="button"
                          disabled
                          aria-label={`No actions available for ${role.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border text-slate-400"
                        >
                          <MoreHorizontal className="size-4" />
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
