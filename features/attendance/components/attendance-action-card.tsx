"use client";

import { useState } from "react";
import {
  CalendarClock,
  Coffee,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { useGeolocation } from "@/hooks/use-geolocation";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../services/attendance.service";

import type { MyTodayAttendanceResponse } from "../types/attendance.types";

interface AttendanceActionCardProps {
  today: MyTodayAttendanceResponse;

  onAttendanceChanged?: (today: MyTodayAttendanceResponse) => void;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m`;
}

function formatTime(value?: string | null): string {
  if (!value) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function AttendanceActionCard({
  today,
  onAttendanceChanged,
}: AttendanceActionCardProps) {
  const company = useAuthStore((state) => state.company);

  const {
    location,
    error: locationError,
    isLoading: isLocating,

    getCurrentLocation,
  } = useGeolocation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const attendance = today.attendance;

  const state = today.state;

  const shift = attendance?.shiftSnapshot;

  const statusLabel = state.onBreak
    ? "On break"
    : state.checkedIn
      ? "Checked in"
      : attendance
        ? "Checked out"
        : "Not checked in";

  const refreshTodayAttendance = async () => {
    if (!company?._id) {
      return;
    }

    const updated = await attendanceService.getMyToday(company._id);

    onAttendanceChanged?.(updated);
  };

  const handleCheckIn = async () => {
    if (!company?._id) {
      toast.error("Company information is unavailable.");

      return;
    }

    try {
      setIsSubmitting(true);

      /**
       * Always capture a fresh GPS position
       * immediately before check-in.
       */
      const gps = await getCurrentLocation();

      await attendanceService.checkIn(company._id, {
        location: {
          latitude: gps.latitude,

          longitude: gps.longitude,

          accuracy: gps.accuracy,

          capturedAt: gps.capturedAt,
        },

        notes: "",
      });

      toast.success("Checked in successfully.");

      await refreshTodayAttendance();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          error instanceof Error ? error.message : "Unable to check in.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartBreak = async () => {
    if (!company?._id) {
      return;
    }

    try {
      setIsSubmitting(true);

      await attendanceService.startBreak(company._id, {
        type: "OTHER",
        notes: "",
      });

      toast.success("Break started.");

      await refreshTodayAttendance();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start break."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndBreak = async () => {
    if (!company?._id) {
      return;
    }

    try {
      setIsSubmitting(true);

      await attendanceService.endBreak(company._id, {
        notes: "",
      });

      toast.success("Break ended. Welcome back.");

      await refreshTodayAttendance();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to end break."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!company?._id) {
      return;
    }

    try {
      setIsSubmitting(true);

      /**
       * Checkout also needs fresh location
       * evidence because the backend may
       * enforce geofence rules.
       */
      const gps = await getCurrentLocation();

      await attendanceService.checkOut(company._id, {
        location: {
          latitude: gps.latitude,

          longitude: gps.longitude,

          accuracy: gps.accuracy,

          capturedAt: gps.capturedAt,
        },

        notes: "",
      });

      toast.success("Checked out successfully.");

      await refreshTodayAttendance();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          error instanceof Error ? error.message : "Unable to check out.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLoading = isSubmitting || isLocating;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today</p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {shift?.name ?? "Attendance"}
            </h2>

            {shift ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" />

                <span>
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>
            ) : null}
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Current status */}
        <div className="rounded-2xl bg-slate-950 px-5 py-7 text-center text-white sm:px-8 sm:py-9">
          <p className="text-sm font-medium text-slate-300">Current status</p>

          <p className="mt-2 text-2xl font-bold">{statusLabel}</p>

          {/* Actions */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {state.canCheckIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}

                {isLocating
                  ? "Getting location..."
                  : isSubmitting
                    ? "Checking in..."
                    : "Check In"}
              </button>
            ) : null}

            {state.canStartBreak ? (
              <button
                type="button"
                onClick={handleStartBreak}
                disabled={actionLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Coffee className="h-5 w-5" />
                )}
                Start Break
              </button>
            ) : null}

            {state.canEndBreak ? (
              <button
                type="button"
                onClick={handleEndBreak}
                disabled={actionLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Coffee className="h-5 w-5" />
                )}
                End Break
              </button>
            ) : null}

            {state.canCheckOut ? (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}

                {isLocating
                  ? "Getting location..."
                  : isSubmitting
                    ? "Checking out..."
                    : "Check Out"}
              </button>
            ) : null}
          </div>

          {/* GPS state */}
          {(state.canCheckIn || state.canCheckOut) && (
            <div className="mt-5">
              {locationError ? (
                <div className="mx-auto max-w-lg rounded-xl bg-red-500/10 px-4 py-3 text-left text-xs leading-5 text-red-200">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>{locationError}</span>
                  </div>
                </div>
              ) : location ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-300">
                  <Navigation className="h-4 w-4" />
                  Location acquired
                  {" · "}±{Math.round(location.accuracy)}m
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                  <MapPin className="h-4 w-4" />
                  Location will be verified before this attendance action.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryItem
            label="Check in"
            value={formatTime(attendance?.firstCheckInAt)}
          />

          <SummaryItem
            label="Check out"
            value={formatTime(attendance?.lastCheckOutAt)}
          />

          <SummaryItem
            label="Worked"
            value={formatMinutes(attendance?.totalWorkedMinutes ?? 0)}
          />

          <SummaryItem
            label="Break"
            value={formatMinutes(attendance?.totalBreakMinutes ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;

  value: string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Timer className="h-4 w-4" />

        <p className="text-xs font-medium">{label}</p>
      </div>

      <p className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">
        {value}
      </p>
    </div>
  );
}
