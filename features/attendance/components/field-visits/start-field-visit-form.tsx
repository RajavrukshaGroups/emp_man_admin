"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, MapPin, Navigation, Play } from "lucide-react";
import { toast } from "sonner";

import { useGeolocation } from "@/hooks/use-geolocation";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../../services/attendance.service";

import type { FieldVisit, FieldVisitType } from "../../types/attendance.types";

interface StartFieldVisitFormProps {
  onStarted?: (fieldVisit: FieldVisit) => void;
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

const FIELD_VISIT_TYPES: Array<{
  value: FieldVisitType;
  label: string;
}> = [
  {
    value: "CLIENT_VISIT",
    label: "Client Visit",
  },
  {
    value: "PROJECT_SITE",
    label: "Project Site",
  },
  {
    value: "SALES_VISIT",
    label: "Sales Visit",
  },
  {
    value: "VENDOR_VISIT",
    label: "Vendor Visit",
  },
  {
    value: "DELIVERY",
    label: "Delivery",
  },
  {
    value: "COLLECTION",
    label: "Collection",
  },
  {
    value: "OFFICIAL_ERRAND",
    label: "Official Errand",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

export function StartFieldVisitForm({ onStarted }: StartFieldVisitFormProps) {
  const company = useAuthStore((state) => state.company);

  const {
    location,
    error: locationError,
    isLoading: isLocating,
    getCurrentLocation,
  } = useGeolocation();

  const [visitType, setVisitType] = useState<FieldVisitType>("CLIENT_VISIT");

  const [siteName, setSiteName] = useState("");

  const [purpose, setPurpose] = useState("");

  const [notes, setNotes] = useState("");

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Company information is unavailable.");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Please enter the purpose of the field visit.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Capture fresh GPS when the visit actually starts.
      const gps = await getCurrentLocation();

      const fieldVisit = await attendanceService.startFieldVisit(company._id, {
        visitType,

        siteName: siteName.trim(),

        purpose: purpose.trim(),

        notes: notes.trim(),

        location: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          capturedAt: gps.capturedAt,
        },
      });

      toast.success("Field visit started successfully.");

      onStarted?.(fieldVisit);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Unable to start field visit.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLoading = isLocating || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <p className="text-sm font-medium text-slate-500">Field work</p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Start Field Visit
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Record a client, project-site, vendor, sales, or other official visit.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="fieldVisitType"
            className="text-sm font-medium text-slate-700"
          >
            Visit type
          </label>

          <select
            id="fieldVisitType"
            value={visitType}
            onChange={(event) =>
              setVisitType(event.target.value as FieldVisitType)
            }
            disabled={actionLoading}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:opacity-60"
          >
            {FIELD_VISIT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="fieldVisitSiteName"
            className="text-sm font-medium text-slate-700"
          >
            Site / location name
          </label>

          <input
            id="fieldVisitSiteName"
            type="text"
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            disabled={actionLoading}
            maxLength={200}
            placeholder="e.g. ABC Industries - Whitefield"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="fieldVisitPurpose"
          className="text-sm font-medium text-slate-700"
        >
          Purpose <span className="text-red-500">*</span>
        </label>

        <textarea
          id="fieldVisitPurpose"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          disabled={actionLoading}
          required
          maxLength={1500}
          rows={4}
          placeholder="Describe the purpose of this visit..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:opacity-60"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="fieldVisitNotes"
          className="text-sm font-medium text-slate-700"
        >
          Notes
        </label>

        <textarea
          id="fieldVisitNotes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={actionLoading}
          maxLength={2000}
          rows={3}
          placeholder="Optional notes..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:opacity-60"
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />

              <p className="text-sm font-semibold text-slate-800">
                Start location
              </p>
            </div>

            {location ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                <Navigation className="h-4 w-4" />
                Location acquired · ±{Math.round(location.accuracy)}m
              </div>
            ) : locationError ? (
              <p className="mt-2 text-xs text-red-600">{locationError}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                GPS location is required to start a field visit.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={actionLoading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={actionLoading || !purpose.trim()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}

          {isSubmitting
            ? "Starting visit..."
            : isLocating
              ? "Getting location..."
              : "Start Field Visit"}
        </button>
      </div>
    </form>
  );
}
