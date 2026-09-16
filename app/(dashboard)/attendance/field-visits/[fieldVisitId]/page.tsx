"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Navigation, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { FieldVisitDetail } from "@/features/attendance/components/field-visits/field-visit-detail";
import { attendanceService } from "@/features/attendance/services/attendance.service";
import type { FieldVisit } from "@/features/attendance/types/attendance.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

interface FieldVisitDetailPageProps {
  params: Promise<{
    fieldVisitId: string;
  }>;
}

export default function FieldVisitDetailPage({
  params,
}: FieldVisitDetailPageProps) {
  const { fieldVisitId } = use(params);

  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canReadFieldVisits =
    permissions?.includes("attendance.field_visit_read") ?? false;

  const [visit, setVisit] = useState<FieldVisit | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadFieldVisit() {
      if (!company?._id || !fieldVisitId) {
        setIsLoading(false);
        return;
      }

      if (!canReadFieldVisits) {
        setErrorMessage("You do not have permission to view field visits.");

        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        setErrorMessage("");

        const result = await attendanceService.getFieldVisitById(
          company._id,
          fieldVisitId,
        );

        setVisit(result);
      } catch (error) {
        setVisit(null);

        const message = getApiErrorMessage(
          error,
          "Unable to load field visit details.",
        );

        setErrorMessage(message);

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadFieldVisit();
  }, [company?._id, fieldVisitId, canReadFieldVisits]);

  if (isLoading) {
    return <FieldVisitDetailLoading />;
  }

  if (!canReadFieldVisits) {
    return (
      <FieldVisitDetailError message="You do not have permission to view field visits." />
    );
  }

  if (!visit) {
    return (
      <FieldVisitDetailError
        message={
          errorMessage ||
          "The field visit could not be found or you do not have access to it."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          PAGE HEADER
          ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Navigation className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Attendance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Field Visit Details
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Review field visit information, attendance context and recorded
              GPS evidence.
            </p>
          </div>
        </div>

        <Link
          href="/attendance/field-visits"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Field Visits
        </Link>
      </div>

      {/* ============================================================
          DETAIL
          ============================================================ */}
      <FieldVisitDetail visit={visit} />
    </div>
  );
}

/* ============================================================
   LOADING
   ============================================================ */

function FieldVisitDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Navigation className="h-5 w-5" />
        </div>

        <div>
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />

          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <section className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading field visit details...
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   ERROR / ACCESS DENIED
   ============================================================ */

function FieldVisitDetailError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-5 w-5" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Unable to view field visit
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>

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
