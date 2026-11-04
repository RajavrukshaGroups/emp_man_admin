"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";

interface AttendancePhotoCameraProps {
  actionLabel: string;
  isSubmitting?: boolean;
  onCapture: (photo: File) => void;
  onCancel: () => void;
}

export function AttendancePhotoCamera({
  actionLabel,
  isSubmitting = false,
  onCapture,
  onCancel,
}: AttendancePhotoCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameraVersion, setCameraVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access requires HTTPS or localhost and a supported browser.",
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to access your camera.",
          );
        }
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraVersion]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.videoWidth < 320 || video.videoHeight < 320) {
      setError("Camera is not ready. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the photograph.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to create the photograph.");
          return;
        }

        const file = new File([blob], `attendance-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setPhoto(file);
        setPreview(URL.createObjectURL(file));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      },
      "image/jpeg",
      0.85,
    );
  }

  function retakePhoto() {
    setPhoto(null);
    setPreview(null);
    setError(null);
    setIsStarting(true);
    setCameraVersion((version) => version + 1);
  }
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${actionLabel} photograph`}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Attendance photograph
            </h3>
            <p className="text-sm text-slate-500">
              Capture a photograph to {actionLabel.toLowerCase()}.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close camera"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${preview ? "hidden" : ""}`}
          />

          {preview && (
            <img
              src={preview}
              alt="Captured attendance photograph"
              className="h-full w-full object-cover"
            />
          )}

          {isStarting && !preview && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </button>

          {photo ? (
            <>
              <button
                type="button"
                onClick={retakePhoto}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                Retake
              </button>

              <button
                type="button"
                onClick={() => onCapture(photo)}
                disabled={isSubmitting}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Use photograph
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isStarting || Boolean(error) || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              Capture
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
