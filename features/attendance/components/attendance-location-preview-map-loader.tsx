"use client";

import dynamic from "next/dynamic";

export const AttendanceLocationPreviewMap = dynamic(
  () =>
    import("./attendance-location-preview-map").then(
      (module) => module.AttendanceLocationPreviewMap,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[300px] w-full animate-pulse items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
        <p className="text-sm font-medium text-slate-400">
          Loading location map...
        </p>
      </div>
    ),
  },
);
