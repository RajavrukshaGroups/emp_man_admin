"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";

import { RoleForm } from "@/features/roles/components/role-form";
import { roleService } from "@/features/roles/services/role.service";
import type { Role } from "@/features/roles/types/role.types";
import { useAuthStore } from "@/store/auth.store";

export default function EditRolePage() {
  const params = useParams<{
    roleId: string;
  }>();

  const companyId = useAuthStore((state) => state.company?._id);

  const permissions = useAuthStore((state) => state.permissions);

  const [role, setRole] = useState<Role | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const canUpdateRole = permissions.includes("role.update");

  useEffect(() => {
    if (!companyId || !params.roleId) {
      return;
    }

    const fetchRole = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await roleService.getRoleById(companyId, params.roleId);

        setRole(data);
      } catch (error) {
        console.error("Failed to fetch role:", error);

        setError("Unable to load the selected role.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRole();
  }, [companyId, params.roleId]);

  if (!canUpdateRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />

          <h1 className="mt-4 text-xl font-semibold">Permission denied</h1>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to update roles.
          </p>

          <Link
            href="/roles"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-600" />
      </div>
    );
  }

  if (error || !role || !companyId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Unable to load role</h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ?? "The selected role could not be found."}
          </p>

          <Link
            href="/roles"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
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
      <RoleForm companyId={companyId} role={role} />
    </div>
  );
}
