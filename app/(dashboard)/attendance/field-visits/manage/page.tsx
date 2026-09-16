"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Navigation,
  ShieldCheck,
} from "lucide-react";

import { FieldVisitManagementList } from "@/features/attendance/components/field-visits/field-visit-management-list";
import { useAuthStore } from "@/store/auth.store";

export default function ManageFieldVisitsPage() {
  const permissions = useAuthStore((state) => state.permissions);

  const canReadFieldVisits =
    permissions?.includes("attendance.field_visit_read") ?? false;

  if (!canReadFieldVisits) {
    return <FieldVisitAccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Navigation className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Attendance Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Employee Field Visits
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Review employee field visits available within your attendance
              access scope.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/attendance"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Link>

          <Link
            href="/attendance/employees"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <CalendarCheck className="h-4 w-4" />
            Employee Attendance
          </Link>
        </div>
      </div>

      {/* ============================================================
          MANAGEMENT LIST
          ============================================================ */}
      <FieldVisitManagementList />
    </div>
  );
}

function FieldVisitAccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Field visit access unavailable
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You do not have permission to review employee field visits.
        </p>

        <Link
          href="/attendance"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Attendance
        </Link>
      </div>
    </div>
  );
}
