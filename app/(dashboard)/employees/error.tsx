"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface EmployeesErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function EmployeesError({
  error,
  reset,
}: EmployeesErrorProps) {
  useEffect(() => {
    console.error("Employees page error:", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold text-slate-950">
        Unable to load employees
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Something went wrong while loading the employee page. Please try again.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <RefreshCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}