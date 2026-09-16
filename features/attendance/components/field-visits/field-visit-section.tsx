"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPinned } from "lucide-react";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { attendanceService } from "../../services/attendance.service";
import type { FieldVisit } from "../../types/attendance.types";

import { ActiveFieldVisitCard } from "./active-field-visit-card";
import { StartFieldVisitForm } from "./start-field-visit-form";

interface FieldVisitSectionProps {
  /**
   * Called after a field-visit state change so the parent
   * attendance screen can refresh /me/today if required.
   */
  onAttendanceChanged?: () => void | Promise<void>;

  /**
   * Today-attendance state can disable field-visit creation.
   *
   * Backend remains authoritative; this is only UX control.
   */
  canStartFieldVisit?: boolean;
}

export function FieldVisitSection({
  onAttendanceChanged,
  canStartFieldVisit = false,
}: FieldVisitSectionProps) {
  const company = useAuthStore((state) => state.company);

  const [activeFieldVisit, setActiveFieldVisit] = useState<FieldVisit | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * ============================================================
   * LOAD ACTIVE FIELD VISIT
   * ============================================================
   */
  const loadActiveFieldVisit = useCallback(async () => {
    if (!company?._id) {
      setActiveFieldVisit(null);
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);

      const fieldVisit = await attendanceService.getMyActiveFieldVisit(
        company._id,
      );

      setActiveFieldVisit(fieldVisit);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(error, "Unable to load your active field visit."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id]);

  useEffect(() => {
    void loadActiveFieldVisit();
  }, [loadActiveFieldVisit]);

  /**
   * ============================================================
   * AFTER START
   * ============================================================
   */
  const handleStarted = async (fieldVisit: FieldVisit) => {
    /**
     * We already have the authoritative visit returned by
     * the backend, so update immediately instead of waiting
     * for another GET request.
     */
    setActiveFieldVisit(fieldVisit);

    try {
      await onAttendanceChanged?.();
    } catch {
      // Field visit itself already started successfully.
      // Parent refresh failure should not undo local state.
    }
  };

  /**
   * ============================================================
   * AFTER END
   * ============================================================
   */
  const handleEnded = async (_fieldVisit: FieldVisit) => {
    setActiveFieldVisit(null);

    try {
      await onAttendanceChanged?.();
    } catch {
      // Field visit already ended successfully.
    }
  };

  /**
   * ============================================================
   * AFTER CANCEL
   * ============================================================
   */
  const handleCancelled = async (_fieldVisit: FieldVisit) => {
    setActiveFieldVisit(null);

    try {
      await onAttendanceChanged?.();
    } catch {
      // Field visit already cancelled successfully.
    }
  };

  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading field visit...
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * LOAD ERROR
   * ============================================================
   */
  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-800">
          Unable to load field visit
        </p>

        <p className="mt-1 text-sm text-red-700">{loadError}</p>

        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            void loadActiveFieldVisit();
          }}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  /**
   * ============================================================
   * ACTIVE VISIT
   * ============================================================
   */
  if (activeFieldVisit) {
    return (
      <ActiveFieldVisitCard
        fieldVisit={activeFieldVisit}
        onEnded={handleEnded}
        onCancelled={handleCancelled}
      />
    );
  }

  /**
   * ============================================================
   * NOT ELIGIBLE TO START
   * ============================================================
   *
   * Usually:
   * - employee has not checked in
   * - employee is on break
   * - today's state does not permit a field visit
   */
  if (!canStartFieldVisit) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <MapPinned className="h-5 w-5 text-slate-600" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Field Visit</h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Check in and make sure you are not on an active break before
              starting a field visit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * READY TO START
   * ============================================================
   */
  return <StartFieldVisitForm onStarted={handleStarted} />;
}
