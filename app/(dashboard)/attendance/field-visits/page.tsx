"use client";

import Link from "next/link";
import { ArrowLeft, CalendarCheck, Navigation } from "lucide-react";

import { FieldVisitHistory } from "@/features/attendance/components/field-visits/field-visit-history";

export default function FieldVisitsPage() {
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
              Attendance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              My Field Visits
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review your official field visits, outcomes and recorded visit
              durations.
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
            href="/attendance/history"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <CalendarCheck className="h-4 w-4" />
            Attendance History
          </Link>
        </div>
      </div>

      {/* ============================================================
          FIELD VISIT HISTORY
          ============================================================ */}
      <FieldVisitHistory />
    </div>
  );
}
