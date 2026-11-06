export default function LeaveLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading Leave Management"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />

          <div className="space-y-3">
            <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="h-11 w-36 animate-pulse rounded-xl bg-slate-200" />
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Workspace information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading Leave Management...</span>
    </div>
  );
}
