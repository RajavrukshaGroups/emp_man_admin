"use client";

interface OnboardingErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function OnboardingError({
  error,
  reset,
}: OnboardingErrorProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-950">
        Unable to load onboarding records
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Something went wrong while loading onboarding."}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
