"use client";

import { useEffect, useState } from "react";
import { Camera, Clock3, Loader2, X } from "lucide-react";

import { AttendancePhotoPreview } from "@/features/attendance/components/attendance-photo-preview";
import { attendanceService } from "@/features/attendance/services/attendance.service";
import type {
  AttendanceRecord,
  DailyAttendanceSummaryRow,
} from "@/features/attendance/types/attendance.types";
import { getApiErrorMessage } from "@/lib/axios";

type PhotoAction = "CHECK_IN" | "CHECK_OUT";

interface PhotoSelection {
  sessionId: string;
  action: PhotoAction;
}

interface AttendanceEmployeeDetailsProps {
  companyId: string;
  row: DailyAttendanceSummaryRow;
  canReadAttendance: boolean;
  canViewPhotos: boolean;
  onClose: () => void;
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function formatMinutes(value?: number | null) {
  const minutes = Math.max(0, value ?? 0);
  const hours = Math.floor(minutes / 60);

  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function AttendanceEmployeeDetails({
  companyId,
  row,
  canReadAttendance,
  canViewPhotos,
  onClose,
}: AttendanceEmployeeDetailsProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoSelection, setPhotoSelection] = useState<PhotoSelection | null>(
    null,
  );

  const attendanceId = row.attendanceId ?? row.attendance?._id ?? null;

  useEffect(() => {
    let cancelled = false;

    setAttendance(null);
    setError("");

    if (!attendanceId || !canReadAttendance) {
      setLoading(false);
      return;
    }

    setLoading(true);

    void attendanceService
      .getAttendanceById(companyId, attendanceId)
      .then((record) => {
        if (!cancelled) setAttendance(record);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "Unable to load attendance details."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, attendanceId, canReadAttendance]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !photoSelection) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, photoSelection]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Employee attendance details"
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Attendance Details
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {row.employeeName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {row.employeeCode} · {row.attendanceDate}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close attendance details"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="space-y-6 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard
                label="Status"
                value={row.displayStatus.replaceAll("_", " ")}
              />
              <InfoCard
                label="Department"
                value={row.departmentId?.name ?? "Not assigned"}
              />
              <InfoCard
                label="Team"
                value={row.teamId?.name ?? "Not assigned"}
              />
            </div>

            {!attendanceId ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No attendance record is available for this employee on the
                selected date.
              </p>
            ) : !canReadAttendance ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                You do not have permission to read detailed attendance records.
              </p>
            ) : loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading attendance details...
              </div>
            ) : error ? (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            ) : attendance ? (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <InfoCard
                    label="First Check-in"
                    value={formatTime(attendance.firstCheckInAt)}
                  />
                  <InfoCard
                    label="Last Check-out"
                    value={formatTime(attendance.lastCheckOutAt)}
                  />
                  <InfoCard
                    label="Worked"
                    value={formatMinutes(attendance.totalWorkedMinutes)}
                  />
                  <InfoCard
                    label="Break"
                    value={formatMinutes(attendance.totalBreakMinutes)}
                  />
                </div>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4" />
                    Work Sessions
                  </h3>

                  {attendance.workSessions?.length ? (
                    attendance.workSessions.map((session, index) => (
                      <div
                        key={session._id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            Session {index + 1}
                          </p>
                          <span className="text-xs font-medium text-slate-500">
                            {session.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <InfoCard
                            label="Check-in"
                            value={formatTime(session.checkInAt)}
                          />
                          <InfoCard
                            label="Check-out"
                            value={formatTime(session.checkOutAt)}
                          />
                          <InfoCard
                            label="Worked"
                            value={formatMinutes(session.workedMinutes)}
                          />
                        </div>

                        {canViewPhotos ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {session.checkInPhotoEvidence?.status ===
                            "CAPTURED" ? (
                              <PhotoButton
                                label="View Check-in Photo"
                                onClick={() =>
                                  setPhotoSelection({
                                    sessionId: session._id,
                                    action: "CHECK_IN",
                                  })
                                }
                              />
                            ) : null}

                            {session.checkOutPhotoEvidence?.status ===
                            "CAPTURED" ? (
                              <PhotoButton
                                label="View Check-out Photo"
                                onClick={() =>
                                  setPhotoSelection({
                                    sessionId: session._id,
                                    action: "CHECK_OUT",
                                  })
                                }
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No work sessions recorded.
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Breaks</h3>

                  {attendance.breaks?.length ? (
                    attendance.breaks.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 p-4 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.type.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {formatTime(item.startedAt)} –{" "}
                            {formatTime(item.endedAt)}
                          </p>
                        </div>
                        <p className="font-medium text-slate-700">
                          {formatMinutes(item.durationMinutes)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No breaks recorded.
                    </p>
                  )}
                </section>

                {(attendance.isLate || attendance.isEarlyCheckout) && (
                  <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="font-semibold text-amber-900">
                      Attendance Exceptions
                    </h3>
                    {attendance.isLate && (
                      <p className="mt-2 text-sm text-amber-800">
                        Late arrival: {attendance.lateMinutes} minutes
                      </p>
                    )}
                    {attendance.isEarlyCheckout && (
                      <p className="mt-1 text-sm text-amber-800">
                        Early checkout: {attendance.earlyCheckoutMinutes}{" "}
                        minutes
                      </p>
                    )}
                  </section>
                )}
              </>
            ) : null}
          </div>
        </section>
      </div>

      {photoSelection && attendanceId && (
        <AttendancePhotoPreview
          companyId={companyId}
          attendanceId={attendanceId}
          sessionId={photoSelection.sessionId}
          action={photoSelection.action}
          onClose={() => setPhotoSelection(null)}
        />
      )}
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PhotoButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Camera className="h-4 w-4" />
      {label}
    </button>
  );
}
