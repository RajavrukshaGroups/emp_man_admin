"use client";

import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface GlobalLoaderProps {
  isOpen: boolean;
  message?: string;
}

export function GlobalLoader({
  isOpen,
  message = "Please wait...",
}: GlobalLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={message}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 backdrop-blur-sm"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
        }
      }}
    >
      <div className="flex min-w-64 flex-col items-center gap-4 rounded-2xl border border-white/40 bg-white px-8 py-7 shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

        <p className="text-center text-base font-semibold text-slate-900">
          {message}
        </p>

        <p className="text-center text-sm text-slate-500">
          Please wait while we process your request.
        </p>
      </div>
    </div>,
    document.body,
  );
}
