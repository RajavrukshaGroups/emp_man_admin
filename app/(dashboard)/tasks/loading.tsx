export default function TasksLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading Tasks">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="h-11 w-36 animate-pulse rounded-xl bg-slate-200" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>

      {/* Task table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}
