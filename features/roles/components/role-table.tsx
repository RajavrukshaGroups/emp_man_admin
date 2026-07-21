"use client";

import Link from "next/link";

import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { RoleStatusBadge } from "./role-status-badge";

import type { Role } from "../types/role.types";

interface RoleTableProps {
  roles: Role[];
  canUpdate: boolean;
  canDelete: boolean;
  onDelete?: (role: Role) => void;
}

const getPermissionCount = (role: Role): number => {
  return role.permissionIds?.length ?? 0;
};

export function RoleTable({
  roles,
  canUpdate,
  canDelete,
  onDelete,
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
        <table className="w-full min-w-[900px]">
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
            {roles.map((role) => (
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
                    {canUpdate && role.isEditable && (
                      <Link
                        href={`/roles/${role._id}/edit`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                    )}

                    {canDelete && !role.isSystemRole && (
                      <button
                        type="button"
                        onClick={() => onDelete?.(role)}
                        className="inline-flex size-9 items-center justify-center rounded-lg border text-red-600 transition hover:bg-red-50"
                        aria-label={`Delete ${role.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}

                    {!canUpdate && !canDelete && (
                      <button
                        type="button"
                        disabled
                        className="inline-flex size-9 items-center justify-center rounded-lg border text-slate-400"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
