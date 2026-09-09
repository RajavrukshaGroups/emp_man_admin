"use client";

import dynamic from "next/dynamic";

export const AttendanceLocationMap = dynamic(
  () =>
    import("./attendance-location-map").then(
      (module) => module.AttendanceLocationMap,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[420px] w-full animate-pulse items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
        <p className="text-sm font-medium text-slate-400">Loading map...</p>
      </div>
    ),
  },
);
