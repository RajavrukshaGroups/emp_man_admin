export default function EmployeesLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading employees">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      {/* Employee summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
              <div className="space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee search and table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-32" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-28" />
          </div>
        </div>

        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </section>

      <span className="sr-only">Loading employees...</span>
    </div>
  );
}
