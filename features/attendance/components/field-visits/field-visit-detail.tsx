"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  NotebookText,
  UserRound,
  XCircle,
} from "lucide-react";

import type {
  AttendanceDepartmentReference,
  AttendanceEmployeeUserReference,
  AttendanceTeamReference,
  FieldVisit,
  FieldVisitAttendanceReference,
  FieldVisitCompanyAccess,
  FieldVisitEmployee,
  FieldVisitLocationEvidence,
} from "@/features/attendance/types/attendance.types";

import { FieldVisitEvidenceMap } from "./field-visit-evidence-map";

interface FieldVisitDetailProps {
  visit: FieldVisit;
}

export function FieldVisitDetail({ visit }: FieldVisitDetailProps) {
  const companyAccess = getCompanyAccess(visit.companyAccessId);
  const employee = getEmployee(visit.employeeId);
  const user = getEmployeeUser(employee?.userId);

  const department = getDepartment(companyAccess?.departmentId);
  const team = getTeam(companyAccess?.teamId);

  const attendance = getAttendance(visit.attendanceId);

  const employeeName =
    user?.displayName ||
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Employee";

  return (
    <div className="space-y-6">
      {/* ============================================================
          VISIT OVERVIEW
          ============================================================ */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Navigation className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Field Visit
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {visit.siteName || formatVisitType(visit.visitType)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {formatVisitType(visit.visitType)}
              </p>
            </div>
          </div>

          <FieldVisitStatusBadge status={visit.status} />
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <DetailMetric
            icon={UserRound}
            label="Employee"
            value={employeeName}
            secondary={companyAccess?.employeeCode}
          />

          <DetailMetric
            icon={BriefcaseBusiness}
            label="Department / Team"
            value={department?.name || "—"}
            secondary={team?.name || undefined}
          />

          <DetailMetric
            icon={CalendarDays}
            label="Attendance date"
            value={formatDate(visit.attendanceDate)}
          />

          <DetailMetric
            icon={Clock3}
            label="Duration"
            value={formatDuration(visit.durationMinutes, visit.status)}
          />
        </div>
      </section>

      {/* ============================================================
          VISIT INFORMATION
          ============================================================ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={BriefcaseBusiness}
          title="Visit Information"
          description="Recorded details and purpose of this field visit."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InformationItem
            label="Visit type"
            value={formatVisitType(visit.visitType)}
          />

          <InformationItem
            label="Site / location"
            value={visit.siteName || "Not specified"}
          />

          <InformationItem
            label="Employee code"
            value={companyAccess?.employeeCode || "—"}
          />

          <InformationItem
            label="Designation"
            value={companyAccess?.designation || "—"}
          />
        </div>

        <div className="mt-4">
          <InformationBlock label="Purpose" value={visit.purpose} />
        </div>

        {visit.notes?.trim() && (
          <div className="mt-4">
            <InformationBlock label="Notes" value={visit.notes} />
          </div>
        )}
      </section>

      {/* ============================================================
          VISIT TIMELINE
          ============================================================ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={Clock3}
          title="Visit Timeline"
          description="Start, completion and recorded visit duration."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InformationItem
            label="Started"
            value={formatDateTime(visit.startedAt)}
          />

          <InformationItem
            label="Ended"
            value={
              visit.endedAt
                ? formatDateTime(visit.endedAt)
                : "Still in progress"
            }
          />

          <InformationItem
            label="Duration"
            value={formatDuration(visit.durationMinutes, visit.status)}
          />
        </div>
      </section>

      {/* ============================================================
          GPS EVIDENCE
          ============================================================ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={MapPin}
          title="GPS Evidence"
          description="Location evidence captured by the employee's device during the field visit."
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <LocationEvidenceCard
            title="Start Location"
            evidence={visit.startLocation}
          />

          {visit.endLocation ? (
            <LocationEvidenceCard
              title="End Location"
              evidence={visit.endLocation}
            />
          ) : (
            <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div>
                <MapPin className="mx-auto h-6 w-6 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  End location not recorded
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The ending GPS evidence will appear after the field visit is
                  completed.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          OUTCOME
          ============================================================ */}
      {(visit.outcome?.trim() || visit.status === "COMPLETED") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={NotebookText}
            title="Visit Outcome"
            description="Result recorded when the field visit was completed."
          />

          <div className="mt-5">
            <InformationBlock
              label="Outcome"
              value={visit.outcome?.trim() || "No outcome recorded."}
            />
          </div>
        </section>
      )}

      {/* ============================================================
          CANCELLATION
          ============================================================ */}
      {visit.status === "CANCELLED" && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-red-950">
                Field Visit Cancelled
              </h2>

              {visit.cancelledAt && (
                <p className="mt-1 text-sm text-red-700">
                  Cancelled {formatDateTime(visit.cancelledAt)}
                </p>
              )}

              <div className="mt-4 rounded-xl border border-red-200 bg-white/70 p-4">
                <p className="text-xs font-medium text-red-500">
                  Cancellation reason
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-950">
                  {visit.cancellationReason || "No reason recorded."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          ATTENDANCE CONTEXT
          ============================================================ */}
      {attendance && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={CalendarDays}
            title="Attendance Context"
            description="Attendance record linked to this field visit."
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InformationItem
              label="Attendance date"
              value={formatDate(attendance.attendanceDate)}
            />

            <InformationItem
              label="Attendance mode"
              value={formatEnum(attendance.attendanceMode)}
            />

            <InformationItem
              label="First check in"
              value={
                attendance.firstCheckInAt
                  ? formatDateTime(attendance.firstCheckInAt)
                  : "—"
              }
            />

            <InformationItem
              label="Last check out"
              value={
                attendance.lastCheckOutAt
                  ? formatDateTime(attendance.lastCheckOutAt)
                  : "—"
              }
            />

            <InformationItem
              label="Worked"
              value={formatMinutes(attendance.totalWorkedMinutes ?? 0)}
            />

            <InformationItem
              label="Break"
              value={formatMinutes(attendance.totalBreakMinutes ?? 0)}
            />

            <InformationItem
              label="Attendance status"
              value={
                attendance.attendanceStatus
                  ? formatEnum(attendance.attendanceStatus)
                  : "—"
              }
            />

            <InformationItem
              label="Payroll status"
              value={
                attendance.payrollStatus
                  ? formatEnum(attendance.payrollStatus)
                  : "—"
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   LOCATION EVIDENCE
   ============================================================ */

function LocationEvidenceCard({
  title,
  evidence,
}: {
  title: string;
  evidence: FieldVisitLocationEvidence;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />

          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
        <LocationValue
          label="Latitude"
          value={formatCoordinate(evidence.latitude)}
        />

        <LocationValue
          label="Longitude"
          value={formatCoordinate(evidence.longitude)}
        />

        <LocationValue
          label="GPS accuracy"
          value={
            typeof evidence.accuracy === "number"
              ? `${Math.round(evidence.accuracy)} m`
              : "—"
          }
        />

        <LocationValue
          label="Captured at"
          value={formatDateTime(evidence.capturedAt)}
        />

        {typeof evidence.distanceFromLocationMeters === "number" && (
          <LocationValue
            label="Distance"
            value={`${Math.round(evidence.distanceFromLocationMeters)} m`}
          />
        )}

        {typeof evidence.withinGeofence === "boolean" && (
          <LocationValue
            label="Geofence"
            value={evidence.withinGeofence ? "Inside" : "Outside"}
          />
        )}
      </div>

      {evidence.addressText?.trim() && (
        <div className="border-t border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Recorded address</p>

          <p className="mt-1 text-sm leading-6 text-slate-700">
            {evidence.addressText}
          </p>
        </div>
      )}

      <div className="border-t border-slate-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Recorded GPS location
        </p>

        <FieldVisitEvidenceMap
          latitude={evidence.latitude}
          longitude={evidence.longitude}
          accuracy={evidence.accuracy}
          label={title}
        />
      </div>
    </div>
  );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof MapPin;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InformationItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InformationBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function LocationValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-950">
            {value}
          </p>

          {secondary && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {secondary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldVisitStatusBadge({ status }: { status: FieldVisit["status"] }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
      <Navigation className="h-3.5 w-3.5" />
      In Progress
    </span>
  );
}

/* ============================================================
   POPULATED REFERENCE HELPERS
   ============================================================ */

function getCompanyAccess(
  value: FieldVisit["companyAccessId"],
): FieldVisitCompanyAccess | null {
  return typeof value === "object" && value !== null ? value : null;
}

function getEmployee(
  value: FieldVisit["employeeId"],
): FieldVisitEmployee | null {
  return typeof value === "object" && value !== null ? value : null;
}

function getEmployeeUser(
  value: FieldVisitEmployee["userId"] | undefined,
): AttendanceEmployeeUserReference | null {
  return typeof value === "object" && value !== null ? value : null;
}

function getDepartment(
  value: FieldVisitCompanyAccess["departmentId"] | undefined,
): AttendanceDepartmentReference | null {
  return typeof value === "object" && value !== null ? value : null;
}

function getTeam(
  value: FieldVisitCompanyAccess["teamId"] | undefined,
): AttendanceTeamReference | null {
  return typeof value === "object" && value !== null ? value : null;
}

function getAttendance(
  value: FieldVisit["attendanceId"],
): FieldVisitAttendanceReference | null {
  return typeof value === "object" && value !== null ? value : null;
}

/* ============================================================
   FORMATTERS
   ============================================================ */

function formatVisitType(value: string) {
  return formatEnum(value);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function formatDuration(minutes: number, status: FieldVisit["status"]) {
  if (status === "IN_PROGRESS") {
    return "In progress";
  }

  if (minutes < 1) {
    return "< 1 min";
  }

  return formatMinutes(minutes);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}
