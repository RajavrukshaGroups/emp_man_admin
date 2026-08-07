"use client";

export default function TeamsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-bold text-red-900">Unable to load teams</h2>

      <p className="mt-2 text-sm text-red-700">
        Something went wrong while loading the teams page.
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
