"use client";

interface ResumeOnboardingErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function ResumeOnboardingError({
  error,
  reset,
}: ResumeOnboardingErrorProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-950">
        Unable to resume onboarding
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        {error.message ||
          "Something went wrong while loading the onboarding record."}
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
