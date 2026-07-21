"use client";

import Link from "next/link";
import { ArrowLeft, Building2, ShieldAlert } from "lucide-react";

import { RoleForm } from "@/features/roles/components/role-form";
import { useAuthStore } from "@/store/auth.store";

export default function CreateRolePage() {
  const companyId = useAuthStore((state) => state.company?._id);

  const permissions = useAuthStore((state) => state.permissions);

  const canCreateRole = permissions.includes("role.create");

  if (!companyId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>

          <h1 className="mt-4 text-xl font-semibold">
            No active company found
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your account is not currently connected to an active company.
            Contact an administrator before creating a role.
          </p>

          <Link
            href="/roles"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Link>
        </div>
      </div>
    );
  }

  if (!canCreateRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>

          <h1 className="mt-4 text-xl font-semibold">Permission denied</h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You do not have permission to create roles for this company.
          </p>

          <Link
            href="/roles"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <RoleForm companyId={companyId} />
    </div>
  );
}
