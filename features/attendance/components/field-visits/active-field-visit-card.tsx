"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Ban, Clock3, Loader2, MapPin, Navigation, Square } from "lucide-react";
import { toast } from "sonner";

import { useGeolocation } from "@/hooks/use-geolocation";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../../services/attendance.service";

import type { FieldVisit } from "../../types/attendance.types";

interface ActiveFieldVisitCardProps {
  fieldVisit: FieldVisit;

  onEnded?: (fieldVisit: FieldVisit) => void;

  onCancelled?: (fieldVisit: FieldVisit) => void;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatVisitType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const FieldVisitLocationMap = dynamic(
  () =>
    import("./field-visit-location-map").then(
      (module) => module.FieldVisitLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    ),
  },
);

export function ActiveFieldVisitCard({
  fieldVisit,
  onEnded,
  onCancelled,
}: ActiveFieldVisitCardProps) {
  const company = useAuthStore((state) => state.company);

  const {
    location,
    error: locationError,
    isLoading: isLocating,
    getCurrentLocation,
  } = useGeolocation();

  const [outcome, setOutcome] = useState("");

  const [endNotes, setEndNotes] = useState("");

  const [cancellationReason, setCancellationReason] = useState("");

  const [showEndForm, setShowEndForm] = useState(false);

  const [showCancelForm, setShowCancelForm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDetectLocation = async () => {
    try {
      await getCurrentLocation();

      toast.success("Current location detected.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to detect your current location.",
      );
    }
  };

  const handleEndVisit = async () => {
    if (!company?._id) {
      toast.error("Company information is unavailable.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Always capture a fresh GPS reading when ending the visit.
      const gps = await getCurrentLocation();

      const updatedFieldVisit = await attendanceService.endFieldVisit(
        company._id,
        fieldVisit._id,
        {
          location: {
            latitude: gps.latitude,
            longitude: gps.longitude,
            accuracy: gps.accuracy,
            capturedAt: gps.capturedAt,
          },

          outcome: outcome.trim(),

          notes: endNotes.trim(),
        },
      );

      toast.success("Field visit ended successfully.");

      onEnded?.(updatedFieldVisit);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          error instanceof Error ? error.message : "Unable to end field visit.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVisit = async () => {
    if (!company?._id) {
      toast.error("Company information is unavailable.");
      return;
    }

    const reason = cancellationReason.trim();

    if (!reason) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    try {
      setIsSubmitting(true);

      const updatedFieldVisit = await attendanceService.cancelFieldVisit(
        company._id,
        fieldVisit._id,
        {
          reason,
        },
      );

      toast.success("Field visit cancelled.");

      onCancelled?.(updatedFieldVisit);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to cancel field visit."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLoading = isSubmitting || isLocating;

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-amber-700" />

              <p className="text-sm font-semibold text-amber-800">
                Active Field Visit
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {fieldVisit.siteName || formatVisitType(fieldVisit.visitType)}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {formatVisitType(fieldVisit.visitType)}
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
            In Progress
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock3 className="h-4 w-4" />

              <p className="text-xs font-medium">Started at</p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDateTime(fieldVisit.startedAt)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4" />

              <p className="text-xs font-medium">Start GPS</p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              {fieldVisit.startLocation
                ? `${fieldVisit.startLocation.latitude.toFixed(
                    6,
                  )}, ${fieldVisit.startLocation.longitude.toFixed(6)}`
                : "—"}
            </p>

            {fieldVisit.startLocation?.accuracy != null ? (
              <p className="mt-1 text-xs text-slate-500">
                Accuracy ±{Math.round(fieldVisit.startLocation.accuracy)}m
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Purpose</p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {fieldVisit.purpose}
          </p>
        </div>

        {fieldVisit.notes ? (
          <div className="mt-3 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Notes</p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {fieldVisit.notes}
            </p>
          </div>
        ) : null}

        {!showEndForm && !showCancelForm ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowEndForm(true)}
              disabled={actionLoading}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Square className="h-4 w-4" />
              End Field Visit
            </button>

            <button
              type="button"
              onClick={() => setShowCancelForm(true)}
              disabled={actionLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              Cancel Visit
            </button>
          </div>
        ) : null}

        {showEndForm ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="font-semibold text-slate-950">End Field Visit</h3>

            <p className="mt-1 text-sm text-slate-500">
              Your current GPS location will be captured when the visit is
              completed.
            </p>

            <div className="mt-4">
              <label
                htmlFor="fieldVisitOutcome"
                className="text-sm font-medium text-slate-700"
              >
                Outcome
              </label>

              <textarea
                id="fieldVisitOutcome"
                value={outcome}
                onChange={(event) => setOutcome(event.target.value)}
                disabled={actionLoading}
                maxLength={2000}
                rows={3}
                placeholder="What was the outcome of this visit?"
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:opacity-60"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="fieldVisitEndNotes"
                className="text-sm font-medium text-slate-700"
              >
                Additional notes
              </label>

              <textarea
                id="fieldVisitEndNotes"
                value={endNotes}
                onChange={(event) => setEndNotes(event.target.value)}
                disabled={actionLoading}
                maxLength={2000}
                rows={3}
                placeholder="Optional notes..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:opacity-60"
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              {location ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <Navigation className="h-4 w-4" />
                  Location acquired · ±{Math.round(location.accuracy)}m
                </div>
              ) : locationError ? (
                <p className="text-xs text-red-600">{locationError}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Detect your location to preview the ending GPS position.
                </p>
              )}

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={actionLoading}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}

                {isLocating
                  ? "Detecting..."
                  : location
                    ? "Refresh Location"
                    : "Detect Location"}
              </button>
            </div>

            {location ? (
              <div className="mt-4">
                <FieldVisitLocationMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  accuracy={location.accuracy}
                />
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEndForm(false)}
                disabled={actionLoading}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleEndVisit}
                disabled={actionLoading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}

                {isLocating
                  ? "Getting location..."
                  : isSubmitting
                    ? "Ending visit..."
                    : "Complete Visit"}
              </button>
            </div>
          </div>
        ) : null}

        {showCancelForm ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
            <h3 className="font-semibold text-slate-950">Cancel Field Visit</h3>

            <p className="mt-1 text-sm text-slate-500">
              Cancelling preserves this visit in the audit history.
            </p>

            <div className="mt-4">
              <label
                htmlFor="fieldVisitCancellationReason"
                className="text-sm font-medium text-slate-700"
              >
                Cancellation reason <span className="text-red-500">*</span>
              </label>

              <textarea
                id="fieldVisitCancellationReason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                disabled={actionLoading}
                maxLength={1000}
                rows={3}
                placeholder="Why is this visit being cancelled?"
                className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-300 disabled:opacity-60"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCancelForm(false)}
                disabled={actionLoading}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCancelVisit}
                disabled={actionLoading || !cancellationReason.trim()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}

                {isSubmitting ? "Cancelling..." : "Cancel Field Visit"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
