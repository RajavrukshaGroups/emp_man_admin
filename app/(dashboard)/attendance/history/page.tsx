"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { attendanceService } from "@/features/attendance/services/attendance.service";

import type {
  AttendanceRecord,
  MyAttendanceHistoryResponse,
} from "@/features/attendance/types/attendance.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export default function AttendanceHistoryPage() {
  const company = useAuthStore((state) => state.company);

  const [history, setHistory] = useState<MyAttendanceHistoryResponse | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const loadHistory = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await attendanceService.getMyHistory(company._id, {
        page,
        limit: 10,

        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      setHistory(result);
    } catch (error) {
      setHistory(null);

      toast.error(
        getApiErrorMessage(error, "Unable to load attendance history."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, fromDate, toDate]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const items = history?.items ?? [];

  const summary = useMemo(() => {
    return {
      total: items.length,

      present: items.filter((item) => item.attendanceStatus === "PRESENT")
        .length,

      halfDay: items.filter((item) => item.attendanceStatus === "HALF_DAY")
        .length,

      late: items.filter((item) => item.isLate).length,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/attendance"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Attendance History
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review your previous attendance, work duration, breaks and status.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Records" value={summary.total} />

        <SummaryCard label="Present" value={summary.present} />

        <SummaryCard label="Half days" value={summary.halfDay} />

        <SummaryCard label="Late days" value={summary.late} />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              From date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setPage(1);
                setFromDate(event.target.value);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              To date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setPage(1);
                setToDate(event.target.value);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <AttendanceHistorySkeleton />
      ) : items.length === 0 ? (
        <EmptyHistoryState />
      ) : (
        <>
          <div className="space-y-4">
            {items.map((attendance) => (
              <AttendanceHistoryCard
                key={attendance._id}
                attendance={attendance}
              />
            ))}
          </div>

          <Pagination
            page={history?.pagination.page ?? 1}
            totalPages={history?.pagination.totalPages ?? 1}
            hasPreviousPage={history?.pagination.hasPreviousPage ?? false}
            hasNextPage={history?.pagination.hasNextPage ?? false}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </>
      )}
    </div>
  );
}

function AttendanceHistoryCard({
  attendance,
}: {
  attendance: AttendanceRecord;
}) {
  const firstSession = attendance.workSessions?.[0];

  const lastSession =
    attendance.workSessions?.[attendance.workSessions.length - 1];

  const checkIn = firstSession?.checkInAt ?? attendance.firstCheckInAt;

  const checkOut = lastSession?.checkOutAt ?? attendance.lastCheckOutAt;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <p className="font-bold text-slate-950">
              {formatDate(attendance.attendanceDate)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {attendance.shiftSnapshot?.name ?? "Shift unavailable"}
            </p>
          </div>
        </div>

        <AttendanceStatusBadge status={attendance.attendanceStatus} />
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        <HistoryValue label="Check in" value={formatTime(checkIn)} />

        <HistoryValue label="Check out" value={formatTime(checkOut)} />

        <HistoryValue
          label="Worked"
          value={formatMinutes(attendance.totalWorkedMinutes ?? 0)}
        />

        <HistoryValue
          label="Break"
          value={formatMinutes(attendance.totalBreakMinutes ?? 0)}
        />
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatusInfo
          label="Late"
          value={
            attendance.isLate
              ? `Yes${
                  attendance.lateMinutes
                    ? ` · ${attendance.lateMinutes} min`
                    : ""
                }`
              : "No"
          }
        />

        <StatusInfo
          label="Early checkout"
          value={
            attendance.isEarlyCheckout
              ? `Yes${
                  attendance.earlyCheckoutMinutes
                    ? ` · ${attendance.earlyCheckoutMinutes} min`
                    : ""
                }`
              : "No"
          }
        />

        <StatusInfo
          label="Sessions"
          value={String(attendance.workSessions?.length ?? 0)}
        />

        <StatusInfo
          label="Calculation"
          value={formatEnum(attendance.calculationStatus)}
        />
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function HistoryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StatusInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const className =
    status === "PRESENT"
      ? "bg-emerald-50 text-emerald-700"
      : status === "HALF_DAY"
        ? "bg-amber-50 text-amber-700"
        : status === "ABSENT"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {formatEnum(status)}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={onPrevious}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={!hasNextPage}
          onClick={onNext}
          className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AttendanceHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}

function EmptyHistoryState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Clock3 className="mx-auto h-8 w-8 text-slate-300" />

      <h2 className="mt-4 font-semibold text-slate-900">
        No attendance history
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Attendance records will appear here after you start using attendance.
      </p>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);

  const remaining = minutes % 60;

  return `${hours}h ${String(remaining).padStart(2, "0")}m`;
}

function formatEnum(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
