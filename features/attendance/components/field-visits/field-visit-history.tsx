"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Eye,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../../services/attendance.service";

import type {
  FieldVisit,
  FieldVisitStatus,
  FieldVisitType,
} from "../../types/attendance.types";

const PAGE_SIZE = 10;

const VISIT_TYPES: Array<{
  value: "" | FieldVisitType;
  label: string;
}> = [
  { value: "", label: "All visit types" },
  { value: "CLIENT_VISIT", label: "Client Visit" },
  { value: "PROJECT_SITE", label: "Project Site" },
  { value: "SALES_VISIT", label: "Sales Visit" },
  { value: "VENDOR_VISIT", label: "Vendor Visit" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "COLLECTION", label: "Collection" },
  { value: "OFFICIAL_ERRAND", label: "Official Errand" },
  { value: "OTHER", label: "Other" },
];

const STATUSES: Array<{
  value: "" | FieldVisitStatus;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function FieldVisitHistory() {
  const company = useAuthStore((state) => state.company);

  const [items, setItems] = useState<FieldVisit[]>([]);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  const [visitType, setVisitType] = useState<"" | FieldVisitType>("");

  const [status, setStatus] = useState<"" | FieldVisitStatus>("");

  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!company?._id) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await attendanceService.getMyFieldVisitHistory(
        company._id,
        {
          page,
          limit: PAGE_SIZE,
          visitType: visitType || undefined,
          status: status || undefined,
        },
      );

      setItems(result.items);

      setTotal(result.pagination.total);

      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (error) {
      setItems([]);

      toast.error(
        getApiErrorMessage(error, "Unable to load field visit history."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, visitType, status]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleVisitTypeChange = (value: "" | FieldVisitType) => {
    setPage(1);
    setVisitType(value);
  };

  const handleStatusChange = (value: "" | FieldVisitStatus) => {
    setPage(1);
    setStatus(value);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-slate-950">
                My Field Visits
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Review your completed, cancelled and active field visits.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={visitType}
              onChange={(event) =>
                handleVisitTypeChange(event.target.value as "" | FieldVisitType)
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              {VISIT_TYPES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as "" | FieldVisitStatus)
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              {STATUSES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading field visits...
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-5 w-5 text-slate-500" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No field visits found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Your field visits will appear here after they are recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {items.map((visit) => (
              <FieldVisitHistoryItem key={visit._id} visit={visit} />
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {total} field visit{total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages))
                }
                disabled={page >= totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FieldVisitHistoryItem({ visit }: { visit: FieldVisit }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">
              {visit.siteName || formatVisitType(visit.visitType)}
            </h3>

            <FieldVisitStatusBadge status={visit.status} />
          </div>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {formatVisitType(visit.visitType)}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {visit.purpose}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HistoryInfo
          icon={<CalendarDays className="h-4 w-4" />}
          label="Date"
          value={formatDate(visit.attendanceDate)}
        />

        <HistoryInfo
          icon={<Clock3 className="h-4 w-4" />}
          label="Started"
          value={formatTime(visit.startedAt)}
        />

        <HistoryInfo
          icon={<Clock3 className="h-4 w-4" />}
          label="Ended"
          value={visit.endedAt ? formatTime(visit.endedAt) : "—"}
        />

        <HistoryInfo
          icon={<Clock3 className="h-4 w-4" />}
          label="Duration"
          value={
            visit.status === "COMPLETED"
              ? formatDuration(visit.durationMinutes)
              : "—"
          }
        />
      </div>

      {visit.outcome ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Outcome</p>

          <p className="mt-1 text-sm leading-6 text-slate-700">
            {visit.outcome}
          </p>
        </div>
      ) : null}

      {visit.status === "CANCELLED" && visit.cancellationReason ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-medium text-red-600">
            Cancellation reason
          </p>

          <p className="mt-1 text-sm text-red-700">
            {visit.cancellationReason}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Link
          href={`/attendance/field-visits/${visit._id}?from=history`}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Link>
      </div>
    </div>
  );
}

function FieldVisitStatusBadge({ status }: { status: FieldVisitStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <Ban className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Navigation className="h-3.5 w-3.5" />
      In Progress
    </span>
  );
}

function HistoryInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <p className="text-xs font-medium">{label}</p>
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatVisitType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatDuration(minutes: number) {
  if (minutes < 1) {
    return "< 1 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}
