"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  return (
    <div
      className={[
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-slate-950/60 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Close sidebar overlay"
        tabIndex={open ? 0 : -1}
      />

      <div
        className={[
          "relative h-dvh w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close sidebar"
          tabIndex={open ? 0 : -1}
        >
          <X className="h-5 w-5" />
        </button>

        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
