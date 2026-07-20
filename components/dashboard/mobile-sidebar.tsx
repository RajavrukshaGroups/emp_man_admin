"use client";

import { X } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50"
        aria-label="Close sidebar overlay"
      />

      <div className="relative h-full w-72 max-w-[85vw]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/10 p-2 text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
