"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { attendanceService } from "@/features/attendance/services/attendance.service";

type AttendancePhotoAction = "CHECK_IN" | "CHECK_OUT";

interface AttendancePhotoPreviewProps {
  companyId: string;
  attendanceId: string;
  sessionId: string;
  action: AttendancePhotoAction;
  onClose: () => void;
}

export function AttendancePhotoPreview({
  companyId,
  attendanceId,
  sessionId,
  action,
  onClose,
}: AttendancePhotoPreviewProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const title = action === "CHECK_IN" ? "Check-in Photo" : "Check-out Photo";

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadPhoto() {
      setLoading(true);
      setError("");
      setPhotoUrl(null);

      try {
        const blob = await attendanceService.getAttendanceSessionPhoto(
          companyId,
          attendanceId,
          sessionId,
          action,
        );

        if (cancelled) return;

        if (blob.type !== "image/jpeg") {
          throw new Error("Unexpected photo format.");
        }

        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      } catch (err) {
        if (cancelled) return;

        console.error("Unable to load attendance photo:", err);
        setError("Unable to load this photo. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPhoto();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [companyId, attendanceId, sessionId, action]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-photo-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2
            id="attendance-photo-title"
            className="text-base font-semibold text-slate-950"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo preview"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-64 items-center justify-center bg-slate-50 p-4">
          {loading ? (
            <div
              role="status"
              className="flex flex-col items-center gap-3 text-sm text-slate-600"
            >
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              Loading attendance photo...
            </div>
          ) : error ? (
            <p role="alert" className="text-center text-sm text-red-600">
              {error}
            </p>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt={title}
              className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
