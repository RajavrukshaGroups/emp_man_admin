"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileClock,
  Loader2,
  Save,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { attendanceService } from "@/features/attendance/services/attendance.service";
import { attendanceRegularizationService } from "@/features/attendance/services/attendance-regularization.service";

import type { AttendanceRecord } from "@/features/attendance/types/attendance.types";

import type {
  AttendanceRegularizationRequestType,
  CreateAttendanceRegularizationPayload,
} from "@/features/attendance/types/attendance-regularization.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

const requestTypes: Array<{
  value: AttendanceRegularizationRequestType;
  label: string;
  description: string;
}> = [
  {
    value: "MISSING_CHECKOUT",
    label: "Missing Checkout",
    description: "You checked in but forgot to record your checkout.",
  },
  {
    value: "MISSING_CHECK_IN",
    label: "Missing Check-in",
    description: "A complete work session was not recorded.",
  },
  {
    value: "CHECK_IN_TIME_CORRECTION",
    label: "Check-in Time Correction",
    description: "Your recorded check-in time is incorrect.",
  },
  {
    value: "CHECKOUT_TIME_CORRECTION",
    label: "Checkout Time Correction",
    description: "Your recorded checkout time is incorrect.",
  },
  {
    value: "BREAK_CORRECTION",
    label: "Break Correction",
    description: "Correct the start or end time of a completed break.",
  },
  {
    value: "BREAK_EXTENSION",
    label: "Break Extension",
    description: "Request an approved extension to a completed break.",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Submit another attendance-related correction request.",
  },
];

export default function NewAttendanceRegularizationPage() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requestType, setRequestType] =
    useState<AttendanceRegularizationRequestType>("MISSING_CHECKOUT");

  const [attendanceId, setAttendanceId] = useState("");

  const [targetWorkSessionId, setTargetWorkSessionId] = useState("");

  const [targetBreakId, setTargetBreakId] = useState("");

  const [requestedCheckInAt, setRequestedCheckInAt] = useState("");

  const [requestedCheckOutAt, setRequestedCheckOutAt] = useState("");

  const [requestedBreakStartAt, setRequestedBreakStartAt] = useState("");

  const [requestedBreakEndAt, setRequestedBreakEndAt] = useState("");

  const [requestedBreakExtensionMinutes, setRequestedBreakExtensionMinutes] =
    useState("");

  const [reason, setReason] = useState("");

  const [attachmentUrl, setAttachmentUrl] = useState("");

  /**
   * ---------------------------------------------------------
   * LOAD EMPLOYEE ATTENDANCE HISTORY
   * ---------------------------------------------------------
   *
   * We use the attendance history so the employee can select
   * the record instead of manually entering MongoDB IDs.
   */
  useEffect(() => {
    async function loadAttendanceHistory() {
      if (!company?._id) {
        setIsLoadingAttendance(false);
        return;
      }

      try {
        setIsLoadingAttendance(true);

        const result = await attendanceService.getMyHistory(company._id, {
          page: 1,
          limit: 100,
        });

        setAttendanceRecords(result.items ?? []);
      } catch (error) {
        setAttendanceRecords([]);

        toast.error(
          getApiErrorMessage(error, "Unable to load attendance records."),
        );
      } finally {
        setIsLoadingAttendance(false);
      }
    }

    void loadAttendanceHistory();
  }, [company?._id]);

  const selectedAttendance = useMemo(
    () =>
      attendanceRecords.find((record) => record._id === attendanceId) ?? null,
    [attendanceRecords, attendanceId],
  );

  const eligibleAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter((attendance) => {
      const sessions = attendance.workSessions ?? [];
      const attendanceBreaks = attendance.breaks ?? [];

      switch (requestType) {
        case "MISSING_CHECKOUT":
          return (
            isPastAttendanceDate(attendance.attendanceDate) &&
            sessions.some(
              (session) => Boolean(session.checkInAt) && !session.checkOutAt,
            )
          );

        case "CHECK_IN_TIME_CORRECTION":
          return sessions.some((session) => Boolean(session.checkInAt));

        case "CHECKOUT_TIME_CORRECTION":
          return sessions.some(
            (session) =>
              Boolean(session.checkInAt) && Boolean(session.checkOutAt),
          );

        case "BREAK_CORRECTION":
        case "BREAK_EXTENSION":
          return attendanceBreaks.some(
            (attendanceBreak) =>
              Boolean(attendanceBreak.startedAt) &&
              Boolean(attendanceBreak.endedAt),
          );

        case "MISSING_CHECK_IN":
        case "OTHER":
        default:
          return true;
      }
    });
  }, [attendanceRecords, requestType]);

  const workSessions = useMemo(() => {
    const sessions = selectedAttendance?.workSessions ?? [];

    switch (requestType) {
      case "MISSING_CHECKOUT":
        return sessions.filter(
          (session) => Boolean(session.checkInAt) && !session.checkOutAt,
        );

      case "CHECK_IN_TIME_CORRECTION":
        return sessions.filter((session) => Boolean(session.checkInAt));

      case "CHECKOUT_TIME_CORRECTION":
        return sessions.filter(
          (session) =>
            Boolean(session.checkInAt) && Boolean(session.checkOutAt),
        );

      default:
        return sessions;
    }
  }, [selectedAttendance, requestType]);

  const breaks = useMemo(() => {
    const attendanceBreaks = selectedAttendance?.breaks ?? [];

    if (
      requestType === "BREAK_CORRECTION" ||
      requestType === "BREAK_EXTENSION"
    ) {
      return attendanceBreaks.filter(
        (attendanceBreak) =>
          Boolean(attendanceBreak.startedAt) &&
          Boolean(attendanceBreak.endedAt),
      );
    }

    return attendanceBreaks;
  }, [selectedAttendance, requestType]);

  const selectedWorkSession = useMemo(
    () =>
      workSessions.find((session) => session._id === targetWorkSessionId) ??
      null,
    [workSessions, targetWorkSessionId],
  );

  const selectedBreak = useMemo(
    () =>
      breaks.find((attendanceBreak) => attendanceBreak._id === targetBreakId) ??
      null,
    [breaks, targetBreakId],
  );
  /**
   * Reset event-specific values whenever attendance changes.
   */
  useEffect(() => {
    setTargetWorkSessionId("");
    setTargetBreakId("");
  }, [attendanceId]);

  /**
   * Reset request-specific values whenever request type changes.
   */
  useEffect(() => {
    setAttendanceId("");

    setTargetWorkSessionId("");
    setTargetBreakId("");

    setRequestedCheckInAt("");
    setRequestedCheckOutAt("");

    setRequestedBreakStartAt("");
    setRequestedBreakEndAt("");

    setRequestedBreakExtensionMinutes("");
  }, [requestType]);

  const requiresWorkSession = [
    "MISSING_CHECKOUT",
    "CHECK_IN_TIME_CORRECTION",
    "CHECKOUT_TIME_CORRECTION",
  ].includes(requestType);

  const requiresBreak = ["BREAK_CORRECTION", "BREAK_EXTENSION"].includes(
    requestType,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Company information is unavailable.");

      return;
    }

    if (!attendanceId) {
      toast.error("Please select an attendance record.");

      return;
    }

    if (reason.trim().length < 3) {
      toast.error("Please provide a valid reason.");

      return;
    }

    if (requiresWorkSession && !targetWorkSessionId) {
      toast.error("Please select the work session.");

      return;
    }

    if (requiresBreak && !targetBreakId) {
      toast.error("Please select the break.");

      return;
    }

    if (
      requestType === "MISSING_CHECK_IN" &&
      (!requestedCheckInAt || !requestedCheckOutAt)
    ) {
      toast.error("Check-in and checkout times are required.");

      return;
    }

    if (requestType === "CHECK_IN_TIME_CORRECTION" && !requestedCheckInAt) {
      toast.error("Please enter the corrected check-in time.");

      return;
    }

    if (
      ["MISSING_CHECKOUT", "CHECKOUT_TIME_CORRECTION"].includes(requestType) &&
      !requestedCheckOutAt
    ) {
      toast.error("Please enter the requested checkout time.");

      return;
    }

    if (
      requestType === "BREAK_CORRECTION" &&
      (!requestedBreakStartAt || !requestedBreakEndAt)
    ) {
      toast.error("Break start and end times are required.");

      return;
    }

    if (
      requestType === "BREAK_EXTENSION" &&
      requestedBreakExtensionMinutes === ""
    ) {
      toast.error("Please enter the break extension minutes.");

      return;
    }

    if (
      requestType === "MISSING_CHECK_IN" &&
      requestedCheckInAt &&
      requestedCheckOutAt &&
      new Date(requestedCheckOutAt) <= new Date(requestedCheckInAt)
    ) {
      toast.error("Requested checkout must be later than requested check-in.");

      return;
    }

    if (
      requestType === "CHECK_IN_TIME_CORRECTION" &&
      selectedWorkSession?.checkOutAt &&
      requestedCheckInAt &&
      new Date(requestedCheckInAt) >= new Date(selectedWorkSession.checkOutAt)
    ) {
      toast.error(
        "Corrected check-in must be earlier than the existing checkout.",
      );

      return;
    }

    if (
      ["MISSING_CHECKOUT", "CHECKOUT_TIME_CORRECTION"].includes(requestType) &&
      selectedWorkSession?.checkInAt &&
      requestedCheckOutAt &&
      new Date(requestedCheckOutAt) <= new Date(selectedWorkSession.checkInAt)
    ) {
      toast.error(
        "Corrected checkout must be later than the session check-in.",
      );

      return;
    }

    if (
      requestType === "BREAK_CORRECTION" &&
      requestedBreakStartAt &&
      requestedBreakEndAt &&
      new Date(requestedBreakEndAt) <= new Date(requestedBreakStartAt)
    ) {
      toast.error(
        "Corrected break end must be later than corrected break start.",
      );

      return;
    }

    if (
      requestType === "BREAK_EXTENSION" &&
      Number(requestedBreakExtensionMinutes) <= 0
    ) {
      toast.error("Break extension must be greater than 0 minutes.");

      return;
    }

    const payload: CreateAttendanceRegularizationPayload = {
      attendanceId,

      requestType,

      reason: reason.trim(),

      attachmentUrl: attachmentUrl.trim() || undefined,
    };

    if (requiresWorkSession) {
      payload.targetWorkSessionId = targetWorkSessionId;
    }

    if (requiresBreak) {
      payload.targetBreakId = targetBreakId;
    }

    if (requestedCheckInAt) {
      payload.requestedCheckInAt = toIsoDateTime(requestedCheckInAt);
    }

    if (requestedCheckOutAt) {
      payload.requestedCheckOutAt = toIsoDateTime(requestedCheckOutAt);
    }

    if (requestedBreakStartAt) {
      payload.requestedBreakStartAt = toIsoDateTime(requestedBreakStartAt);
    }

    if (requestedBreakEndAt) {
      payload.requestedBreakEndAt = toIsoDateTime(requestedBreakEndAt);
    }

    if (requestedBreakExtensionMinutes !== "") {
      payload.requestedBreakExtensionMinutes = Number(
        requestedBreakExtensionMinutes,
      );
    }

    try {
      setIsSubmitting(true);

      await attendanceRegularizationService.create(company._id, payload);

      toast.success(
        "Attendance regularization request submitted successfully.",
      );

      router.push("/attendance/regularizations");

      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to submit regularization request."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/attendance/regularizations"
          className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            New Regularization Request
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Select the attendance entry that needs correction and provide the
            requested attendance information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request type */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={FileClock}
            title="Correction type"
            description="Choose what needs to be corrected."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requestTypes.map((item) => {
              const active = requestType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRequestType(item.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      active ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {item.label}
                  </p>

                  <p
                    className={`mt-1 text-xs leading-5 ${
                      active ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Attendance */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={CalendarDays}
            title="Attendance record"
            description="Select the attendance date that requires correction."
          />

          <div className="mt-5">
            <FieldLabel required>Attendance date</FieldLabel>
            {isLoadingAttendance ? (
              <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading attendance...
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      No attendance records available
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      V1 regularization requires an existing attendance record.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <select
                  value={attendanceId}
                  onChange={(event) => setAttendanceId(event.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="">Select attendance record</option>

                  {eligibleAttendanceRecords.map((attendance) => (
                    <option key={attendance._id} value={attendance._id}>
                      {formatDate(attendance.attendanceDate)} —{" "}
                      {formatEnum(attendance.attendanceStatus)}
                    </option>
                  ))}
                </select>

                {eligibleAttendanceRecords.length === 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          No eligible attendance records
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                          {getNoEligibleAttendanceMessage(requestType)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedAttendance && (
            <AttendanceSummary attendance={selectedAttendance} />
          )}
        </section>

        {/* Dynamic correction fields */}
        {selectedAttendance && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              icon={Clock3}
              title="Correction details"
              description={getCorrectionDescription(requestType)}
            />

            <div className="mt-5 space-y-5">
              {requiresWorkSession && (
                <div>
                  <FieldLabel required>Work session</FieldLabel>

                  <select
                    value={targetWorkSessionId}
                    onChange={(event) =>
                      setTargetWorkSessionId(event.target.value)
                    }
                    className={inputClassName}
                    required
                  >
                    <option value="">Select work session</option>

                    {workSessions.map((session, index) => (
                      <option
                        key={session._id ?? index}
                        value={session._id ?? ""}
                      >
                        Session {index + 1} — {formatTime(session.checkInAt)} →{" "}
                        {session.checkOutAt
                          ? formatTime(session.checkOutAt)
                          : "No checkout"}
                        {session.checkOutAt
                          ? ` (${formatDuration(
                              session.checkInAt,
                              session.checkOutAt,
                            )})`
                          : " (Open)"}
                      </option>
                    ))}
                  </select>

                  {selectedWorkSession && (
                    <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                      <AttendanceInfo
                        label="Original check-in"
                        value={formatDateTime12Hour(
                          String(selectedWorkSession.checkInAt),
                        )}
                      />

                      <AttendanceInfo
                        label="Original checkout"
                        value={
                          selectedWorkSession.checkOutAt
                            ? formatDateTime12Hour(
                                String(selectedWorkSession.checkOutAt),
                              )
                            : "Not recorded"
                        }
                      />

                      <AttendanceInfo
                        label="Session duration"
                        value={
                          selectedWorkSession.checkOutAt
                            ? formatDuration(
                                selectedWorkSession.checkInAt,
                                selectedWorkSession.checkOutAt,
                              )
                            : "Open session"
                        }
                      />
                    </div>
                  )}

                  {workSessions.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No work sessions were found in this attendance record.
                    </p>
                  )}
                </div>
              )}

              {requiresBreak && (
                <div>
                  <FieldLabel required>Break</FieldLabel>

                  <select
                    value={targetBreakId}
                    onChange={(event) => setTargetBreakId(event.target.value)}
                    className={inputClassName}
                    required
                  >
                    <option value="">Select break</option>

                    {breaks.map((attendanceBreak, index) => (
                      <option
                        key={attendanceBreak._id ?? index}
                        value={attendanceBreak._id ?? ""}
                      >
                        Break {index + 1} —{" "}
                        {formatTime(attendanceBreak.startedAt)} →{" "}
                        {attendanceBreak.endedAt
                          ? formatTime(attendanceBreak.endedAt)
                          : "Active"}
                        {attendanceBreak.endedAt
                          ? ` (${formatDuration(
                              attendanceBreak.startedAt,
                              attendanceBreak.endedAt,
                            )})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {selectedBreak && (
                    <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                      <AttendanceInfo
                        label="Original break start"
                        value={formatDateTime12Hour(
                          String(selectedBreak.startedAt),
                        )}
                      />

                      <AttendanceInfo
                        label="Original break end"
                        value={
                          selectedBreak.endedAt
                            ? formatDateTime12Hour(
                                String(selectedBreak.endedAt),
                              )
                            : "Not ended"
                        }
                      />

                      <AttendanceInfo
                        label="Duration"
                        value={
                          selectedBreak.endedAt
                            ? formatDuration(
                                selectedBreak.startedAt,
                                selectedBreak.endedAt,
                              )
                            : "Active"
                        }
                      />
                    </div>
                  )}

                  {breaks.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No breaks were found in this attendance record.
                    </p>
                  )}
                </div>
              )}

              {requestType === "MISSING_CHECK_IN" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimeField
                    label="Requested check-in"
                    value={requestedCheckInAt}
                    onChange={setRequestedCheckInAt}
                    required
                  />

                  <DateTimeField
                    label="Requested checkout"
                    value={requestedCheckOutAt}
                    onChange={setRequestedCheckOutAt}
                    required
                  />
                </div>
              )}

              {requestType === "MISSING_CHECKOUT" && (
                <DateTimeField
                  label="Requested checkout"
                  value={requestedCheckOutAt}
                  onChange={setRequestedCheckOutAt}
                  required
                />
              )}

              {requestType === "CHECK_IN_TIME_CORRECTION" && (
                <DateTimeField
                  label="Corrected check-in"
                  value={requestedCheckInAt}
                  onChange={setRequestedCheckInAt}
                  required
                />
              )}

              {requestType === "CHECKOUT_TIME_CORRECTION" && (
                <DateTimeField
                  label="Corrected checkout"
                  value={requestedCheckOutAt}
                  onChange={setRequestedCheckOutAt}
                  required
                />
              )}

              {requestType === "BREAK_CORRECTION" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimeField
                    label="Corrected break start"
                    value={requestedBreakStartAt}
                    onChange={setRequestedBreakStartAt}
                    required
                  />

                  <DateTimeField
                    label="Corrected break end"
                    value={requestedBreakEndAt}
                    onChange={setRequestedBreakEndAt}
                    required
                  />
                </div>
              )}

              {requestType === "BREAK_EXTENSION" && (
                <div>
                  <FieldLabel required>Extension minutes</FieldLabel>

                  <input
                    type="number"
                    min={0}
                    max={720}
                    value={requestedBreakExtensionMinutes}
                    onChange={(event) =>
                      setRequestedBreakExtensionMinutes(event.target.value)
                    }
                    placeholder="Example: 15"
                    className={inputClassName}
                    required
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    This adds an approved break allowance. It does not change
                    the original break timestamps.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reason */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={FileClock}
            title="Reason & supporting information"
            description="Explain why this correction is required."
          />

          <div className="mt-5 space-y-5">
            <div>
              <FieldLabel required>Reason</FieldLabel>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={5}
                maxLength={1500}
                placeholder="Explain what happened and why the attendance correction is required..."
                className={`${inputClassName} h-auto resize-y py-3`}
                required
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-slate-400">
                  {reason.length}/1500
                </span>
              </div>
            </div>

            <div>
              <FieldLabel>Supporting document URL</FieldLabel>

              <input
                type="text"
                value={attachmentUrl}
                onChange={(event) => setAttachmentUrl(event.target.value)}
                maxLength={1000}
                placeholder="Optional document or image URL"
                className={inputClassName}
              />

              <p className="mt-2 text-xs text-slate-500">
                Optional. We can replace this with actual file upload later when
                the document storage module is connected.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/attendance/regularizations"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingAttendance || !attendanceId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-bold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}

      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = parseLocalDateTime(value);

  const [date, setDate] = useState(parsed.date);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const current = parseLocalDateTime(value);

    setDate(current.date);
    setHour(current.hour);
    setMinute(current.minute);
    setPeriod(current.period);
  }, [value]);

  function updateValue(
    nextDate: string,
    nextHour: string,
    nextMinute: string,
    nextPeriod: "AM" | "PM",
  ) {
    setDate(nextDate);
    setHour(nextHour);
    setMinute(nextMinute);
    setPeriod(nextPeriod);

    if (!nextDate || !nextHour || nextMinute === "") {
      onChange("");
      return;
    }

    let hour24 = Number(nextHour);

    if (nextPeriod === "AM") {
      if (hour24 === 12) {
        hour24 = 0;
      }
    } else {
      if (hour24 !== 12) {
        hour24 += 12;
      }
    }

    const formattedHour = String(hour24).padStart(2, "0");
    const formattedMinute = String(nextMinute).padStart(2, "0");

    onChange(`${nextDate}T${formattedHour}:${formattedMinute}`);
  }

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_90px_90px_90px]">
        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(event) =>
            updateValue(event.target.value, hour, minute, period)
          }
          className={inputClassName}
          required={required}
        />

        {/* Hour */}
        <select
          value={hour}
          onChange={(event) =>
            updateValue(date, event.target.value, minute, period)
          }
          className={inputClassName}
          required={required}
        >
          <option value="">Hour</option>

          {Array.from({ length: 12 }, (_, index) => {
            const currentHour = String(index + 1);

            return (
              <option key={currentHour} value={currentHour}>
                {currentHour}
              </option>
            );
          })}
        </select>

        {/* Minute */}
        <select
          value={minute}
          onChange={(event) =>
            updateValue(date, hour, event.target.value, period)
          }
          className={inputClassName}
          required={required}
        >
          <option value="">Minute</option>

          {Array.from({ length: 60 }, (_, index) => {
            const currentMinute = String(index).padStart(2, "0");

            return (
              <option key={currentMinute} value={currentMinute}>
                {currentMinute}
              </option>
            );
          })}
        </select>

        {/* AM / PM */}
        <select
          value={period}
          onChange={(event) =>
            updateValue(date, hour, minute, event.target.value as "AM" | "PM")
          }
          className={inputClassName}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {value && (
        <p className="mt-2 text-xs text-slate-500">
          Selected:{" "}
          <span className="font-semibold text-slate-700">
            {formatDateTime12Hour(value)}
          </span>
        </p>
      )}
    </div>
  );
}

function AttendanceSummary({ attendance }: { attendance: AttendanceRecord }) {
  return (
    <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <AttendanceInfo
        label="Date"
        value={formatDate(attendance.attendanceDate)}
      />

      <AttendanceInfo
        label="Check in"
        value={formatTime(attendance.firstCheckInAt)}
      />

      <AttendanceInfo
        label="Check out"
        value={formatTime(attendance.lastCheckOutAt)}
      />

      <AttendanceInfo
        label="Status"
        value={formatEnum(attendance.attendanceStatus)}
      />
    </div>
  );
}

function AttendanceInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getCorrectionDescription(type: AttendanceRegularizationRequestType) {
  switch (type) {
    case "MISSING_CHECK_IN":
      return "Provide the start and end time of the work session that was completely missed.";

    case "MISSING_CHECKOUT":
      return "Select the open work session and provide the missing checkout time.";

    case "CHECK_IN_TIME_CORRECTION":
      return "Select the work session and provide the corrected check-in time.";

    case "CHECKOUT_TIME_CORRECTION":
      return "Select the work session and provide the corrected checkout time.";

    case "BREAK_CORRECTION":
      return "Select the completed break and provide its corrected start and end time.";

    case "BREAK_EXTENSION":
      return "Select the completed break and enter the additional approved break allowance requested.";

    case "OTHER":
      return "Describe the attendance issue that requires management review.";

    default:
      return "";
  }
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
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

function formatTime(value?: string | Date | null) {
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

function parseLocalDateTime(value: string) {
  if (!value) {
    return {
      date: "",
      hour: "",
      minute: "",
      period: "AM" as const,
    };
  }

  const [datePart, timePart = ""] = value.split("T");

  const [hourPart = "", minutePart = ""] = timePart.split(":");

  if (!hourPart) {
    return {
      date: datePart || "",
      hour: "",
      minute: minutePart || "",
      period: "AM" as const,
    };
  }

  const hour24 = Number(hourPart);

  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";

  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  return {
    date: datePart || "",
    hour: String(hour12),
    minute: minutePart || "",
    period,
  };
}

function formatDateTime12Hour(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getNoEligibleAttendanceMessage(
  type: AttendanceRegularizationRequestType,
) {
  switch (type) {
    case "MISSING_CHECKOUT":
      return "No attendance record with a missing checkout was found.";

    case "CHECK_IN_TIME_CORRECTION":
      return "No attendance record containing a check-in session was found.";

    case "CHECKOUT_TIME_CORRECTION":
      return "No completed attendance session was found for checkout correction.";

    case "BREAK_CORRECTION":
      return "No attendance record containing a completed break was found.";

    case "BREAK_EXTENSION":
      return "No completed break is available for extension.";

    case "MISSING_CHECK_IN":
      return "No attendance record is available for missing check-in regularization.";

    default:
      return "No eligible attendance record was found.";
  }
}

function formatDuration(
  start?: string | Date | null,
  end?: string | Date | null,
) {
  if (!start || !end) {
    return "—";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "—";
  }

  const totalMinutes = Math.max(
    0,
    Math.floor((endDate.getTime() - startDate.getTime()) / 60000),
  );

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function isPastAttendanceDate(attendanceDate?: string | null) {
  if (!attendanceDate) {
    return false;
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return attendanceDate < today;
}
