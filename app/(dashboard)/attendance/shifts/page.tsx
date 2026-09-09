"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Moon, Plus, RefreshCw, Search, Sun } from "lucide-react";
import { toast } from "sonner";

import { AttendanceShiftForm } from "@/features/attendance/components/shifts/attendance-shift-form";
import { attendanceShiftService } from "@/features/attendance/services/attendance-shift.service";
import type {
  AttendanceShift,
  AttendanceShiftListResponse,
  AttendanceShiftStatus,
} from "@/features/attendance/types/attendance-shift.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export default function AttendanceShiftsPage() {
  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canManageShifts = permissions.includes("attendance.shift_manage");

  const [data, setData] = useState<AttendanceShiftListResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<AttendanceShiftStatus | "ALL">("ALL");

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [editingShift, setEditingShift] = useState<AttendanceShift | null>(
    null,
  );

  const loadShifts = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await attendanceShiftService.list(company._id, {
        page: 1,
        limit: 50,

        search: search.trim() || undefined,

        status: status === "ALL" ? undefined : status,
      });

      setData(result);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to load attendance shifts."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, search, status]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const activeCount = useMemo(
    () => data?.items.filter((shift) => shift.status === "ACTIVE").length ?? 0,
    [data],
  );

  const inactiveCount = useMemo(
    () =>
      data?.items.filter((shift) => shift.status === "INACTIVE").length ?? 0,
    [data],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock3 className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Attendance Shifts
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Configure work timings, attendance thresholds, grace periods,
              breaks and working days.
            </p>
          </div>
        </div>

        {canManageShifts ? (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Shift
          </button>
        ) : null}
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total shifts" value={data?.pagination.total ?? 0} />

        <SummaryCard label="Active shifts" value={activeCount} />

        <SummaryCard label="Inactive shifts" value={inactiveCount} />
      </div>

      {/* Search / Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shifts..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AttendanceShiftStatus | "ALL")
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="ALL">All status</option>

            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => void loadShifts()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <ShiftLoadingState />
      ) : !data || data.items.length === 0 ? (
        <EmptyShiftState />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((shift) => (
            <ShiftCard
              key={shift._id}
              shift={shift}
              canManage={canManageShifts}
              onEdit={setEditingShift}
            />
          ))}
        </div>
      )}

      {/* Add */}
      {canManageShifts && isAddOpen && company?._id ? (
        <AttendanceShiftForm
          companyId={company._id}
          onClose={() => setIsAddOpen(false)}
          onSaved={() => {
            setIsAddOpen(false);

            void loadShifts();
          }}
        />
      ) : null}

      {/* Edit */}
      {canManageShifts && editingShift && company?._id ? (
        <AttendanceShiftForm
          key={editingShift._id}
          companyId={company._id}
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSaved={() => {
            setEditingShift(null);

            void loadShifts();
          }}
        />
      ) : null}
    </div>
  );
}

interface ShiftCardProps {
  shift: AttendanceShift;
  canManage: boolean;
  onEdit: (shift: AttendanceShift) => void;
}

function ShiftCard({ shift, canManage, onEdit }: ShiftCardProps) {
  const workingDays = shift.workingDays
    .map((day) => WEEKDAY_LABELS[day] ?? String(day))
    .join(", ");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6">
      {/* Top */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {shift.isOvernight ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-950">
                {shift.name}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  shift.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {shift.status}
              </span>

              {shift.isOvernight ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  Overnight
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {shift.code}
            </p>
          </div>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => onEdit(shift)}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </button>
        ) : null}
      </div>

      {/* Timing */}
      <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4 text-white sm:px-5">
        <p className="text-xs font-medium text-slate-400">Shift timing</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {shift.startTime}
              <span className="mx-2 text-slate-500">→</span>
              {shift.endTime}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {shift.isOvernight
                ? "Ends on the following day"
                : "Same-day shift"}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 px-3 py-2 text-right">
            <p className="text-xs text-slate-400">Full day</p>

            <p className="text-sm font-semibold">
              {formatMinutes(shift.fullDayMinutes)}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance rules */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoItem
          label="Half day"
          value={formatMinutes(shift.halfDayMinutes)}
        />

        <InfoItem label="Late grace" value={`${shift.lateGraceMinutes} min`} />

        <InfoItem
          label="Early grace"
          value={`${shift.earlyCheckoutGraceMinutes} min`}
        />

        <InfoItem
          label="Standard break"
          value={`${shift.standardBreakMinutes} min`}
        />
      </div>

      {/* Break */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="Maximum break"
          value={`${shift.maxBreakMinutes} min`}
        />

        <InfoItem
          label="Multiple breaks"
          value={shift.allowMultipleBreaks ? "Allowed" : "Not allowed"}
        />
      </div>

      {/* Working days */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-500">Working days</p>

        <p className="mt-1 text-sm font-semibold text-slate-900">
          {workingDays}
        </p>
      </div>

      {/* Description */}
      {shift.description ? (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {shift.description}
        </p>
      ) : null}

      {/* Effective dates */}
      {(shift.effectiveFrom || shift.effectiveTo) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Effective from"
            value={formatDate(shift.effectiveFrom)}
          />

          <InfoItem
            label="Effective to"
            value={
              shift.effectiveTo ? formatDate(shift.effectiveTo) : "No end date"
            }
          />
        </div>
      )}
    </article>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ShiftLoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyShiftState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Clock3 className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        No attendance shifts found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Configure the company&apos;s general, rotational, night or other
        attendance shifts.
      </p>
    </section>
  );
}

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) {
    return "-";
  }

  const hours = Math.floor(minutes / 60);

  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
