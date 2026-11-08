export function DepartmentDetailsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading department details">
      <div className="h-10 w-60 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>

      <span className="sr-only">Loading department details...</span>
    </div>
  );
}
