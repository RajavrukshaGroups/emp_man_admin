"use client";

import { useAuthStore } from "@/store/auth.store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const company = useAuthStore((state) => state.company);

  const role = useAuthStore((state) => state.role);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Welcome back</p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {user?.displayName}
          </h1>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Company
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {company?.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Role
              </p>

              <p className="mt-1 font-semibold text-slate-900">{role?.name}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Employee code
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {useAuthStore.getState().companyAccess?.employeeCode ??
                  "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
