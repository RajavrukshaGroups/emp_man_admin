"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { DepartmentForm } from "@/features/departments/components/department-form";
import { useAuthStore } from "@/store/auth.store";

export default function CreateDepartmentPage() {
  const permissions = useAuthStore((state) => state.permissions);

  const canCreateDepartment = permissions.includes("department.create");

  if (!canCreateDepartment) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-red-950">Access denied</h1>

        <p className="mt-2 text-sm text-red-700">
          You do not have permission to create departments.
        </p>

        <Link
          href="/departments"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Back to departments
        </Link>
      </div>
    );
  }

  return <DepartmentForm />;
}
