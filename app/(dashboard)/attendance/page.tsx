"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  FileClock,
  MapPin,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AttendanceActionCard } from "@/features/attendance/components/attendance-action-card";
import { attendanceService } from "@/features/attendance/services/attendance.service";
import type { MyTodayAttendanceResponse } from "@/features/attendance/types/attendance.types";
import { attendanceShiftService } from "@/features/attendance/services/attendance-shift.service";
import type { AttendanceShift } from "@/features/attendance/types/attendance-shift.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";

export default function AttendancePage() {
  const company = useAuthStore((state) => state.company);

  const role = useAuthStore((state) => state.role);

  const permissions = useAuthStore((state) => state.permissions);

  const canReadAttendanceSummary =
    permissions?.includes("attendance.summary_read") ?? false;

  const companyAccess = useAuthStore((state) => state.companyAccess);

  const assignedShiftId = companyAccess?.shiftId ?? null;

  const [today, setToday] = useState<MyTodayAttendanceResponse | null>(null);

  const [assignedShift, setAssignedShift] = useState<AttendanceShift | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const isCompanyAttendanceManager =
    role?.scopeType === "COMPANY" || role?.scopeType === "GLOBAL";
  useEffect(() => {
    async function loadAttendance() {
      if (!company?._id) {
        setIsLoading(false);
        return;
      }

      /**
       * Company/global scoped users are attendance managers.
       * They do not use employee self-attendance here.
       */
      if (isCompanyAttendanceManager) {
        setToday(null);
        setAssignedShift(null);
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        /**
         * --------------------------------------------------
         * LOAD TODAY'S ATTENDANCE
         * --------------------------------------------------
         */

        const attendanceResult = await attendanceService.getMyToday(
          company._id,
        );

        setToday(attendanceResult);

        /**
         * --------------------------------------------------
         * LOAD ASSIGNED SHIFT
         * --------------------------------------------------
         */

        if (assignedShiftId) {
          const shift = await attendanceShiftService.getById(
            company._id,
            assignedShiftId,
          );

          setAssignedShift(shift);
        } else {
          setAssignedShift(null);
        }
      } catch (error) {
        setToday(null);

        toast.error(
          getApiErrorMessage(error, "Unable to load today's attendance."),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadAttendance();
  }, [company?._id, assignedShiftId, isCompanyAttendanceManager]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {isCompanyAttendanceManager
                ? "Monitor and manage company attendance."
                : "Check in, manage breaks and review your attendance."}
            </p>
          </div>
        </div>

        {/* Employee / Team Lead attendance actions */}
        {!isCompanyAttendanceManager && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {canReadAttendanceSummary && (
              <Link
                href="/attendance/employees"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                <Users className="h-4 w-4" />
                Team Attendance
              </Link>
            )}

            <Link
              href="/attendance/history"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              <Clock3 className="h-4 w-4" />
              View History
            </Link>

            <Link
              href="/attendance/regularizations"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              <FileClock className="h-4 w-4" />
              Regularizations
            </Link>
          </div>
        )}
      </div>

      {/* Company Administrator / company scoped role */}
      {isCompanyAttendanceManager ? (
        <CompanyAttendancePlaceholder
          canReadAttendanceSummary={canReadAttendanceSummary}
        />
      ) : isLoading ? (
        <AttendanceLoadingState />
      ) : today ? (
        <>
          <AssignedShiftCard
            shift={assignedShift}
            attendanceMode={companyAccess?.attendanceMode}
          />

          <AttendanceActionCard today={today} onAttendanceChanged={setToday} />
        </>
      ) : (
        <AttendanceErrorState />
      )}
    </div>
  );
}

interface AssignedShiftCardProps {
  shift: AttendanceShift | null;
  attendanceMode?: string | null;
}

function AssignedShiftCard({ shift, attendanceMode }: AssignedShiftCardProps) {
  if (!shift) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Clock3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-amber-950">No shift assigned</h2>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              Your attendance shift has not been assigned yet. Please contact
              your administrator.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const lateAfter = addMinutesToTime(shift.startTime, shift.lateGraceMinutes);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {shift.isOvernight ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assigned shift
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {shift.name}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {shift.startTime} → {shift.endTime}
              {shift.isOvernight ? " · Overnight" : ""}
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {formatAttendanceMode(attendanceMode)}
        </div>
      </div>

      <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <ShiftInfo label="Late after" value={lateAfter} />

        <ShiftInfo
          label="Full day"
          value={formatMinutes(shift.fullDayMinutes)}
        />

        <ShiftInfo
          label="Half day"
          value={formatMinutes(shift.halfDayMinutes)}
        />

        <ShiftInfo
          label="Working days"
          value={formatWorkingDays(shift.workingDays)}
        />
      </div>
    </section>
  );
}

function CompanyAttendancePlaceholder({
  canReadAttendanceSummary,
}: {
  canReadAttendanceSummary: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header + Attendance Location Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">
            Company attendance
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor employee attendance, regularization requests, field visits,
            shifts, attendance locations and company attendance policies.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {canReadAttendanceSummary && (
            <Link
              href="/attendance/employees"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              <Users className="h-4 w-4" />
              Employee Attendance
            </Link>
          )}
          <Link
            href="/attendance/regularizations"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <FileClock className="h-4 w-4" />
            Regularizations
          </Link>

          <Link
            href="/attendance/locations"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <MapPin className="h-4 w-4" />
            Manage Attendance Locations
          </Link>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Present today</p>

          <p className="mt-2 text-2xl font-bold text-slate-950">--</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Absent</p>

          <p className="mt-2 text-2xl font-bold text-slate-950">--</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Late</p>

          <p className="mt-2 text-2xl font-bold text-slate-950">--</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Pending requests</p>

          <p className="mt-2 text-2xl font-bold text-slate-950">--</p>
        </div>
      </div>

      <p className="mt-5 text-xs text-slate-400">
        Company attendance dashboard data will be connected after the employee
        attendance flow.
      </p>
    </section>
  );
}

function AttendanceLoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-6 w-40 rounded bg-slate-100" />
          </div>

          <div className="h-7 w-28 rounded-full bg-slate-100" />
        </div>

        <div className="h-52 rounded-2xl bg-slate-100" />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

function AttendanceErrorState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-700">
        Unable to load today&apos;s attendance.
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Refresh the page and try again.
      </p>
    </section>
  );
}

function ShiftInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + mins + minutes;

  const normalized = ((totalMinutes % 1440) + 1440) % 1440;

  const resultHours = Math.floor(normalized / 60);

  const resultMinutes = normalized % 60;

  return `${String(resultHours).padStart(2, "0")}:${String(
    resultMinutes,
  ).padStart(2, "0")}`;
}

function formatMinutes(minutes: number) {
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

function formatWorkingDays(workingDays: number[]) {
  const days: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };

  return workingDays
    .map((day) => days[day])
    .filter(Boolean)
    .join(", ");
}

function formatAttendanceMode(value?: string | null) {
  if (!value) {
    return "Attendance mode not set";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
