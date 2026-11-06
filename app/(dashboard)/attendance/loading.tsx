export default function AttendanceLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading attendance">
      {/* Page header */}
      <div className="space-y-3">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      {/* Attendance overview */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="animate-pulse space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-6 w-40 rounded bg-slate-100" />
            </div>

            <div className="h-7 w-28 rounded-full bg-slate-100" />
          </div>

          <div className="h-52 rounded-2xl bg-slate-100" />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </section>

      <span className="sr-only">Loading attendance...</span>
    </div>
  );
}
