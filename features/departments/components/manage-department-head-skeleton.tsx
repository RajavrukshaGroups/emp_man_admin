export function ManageDepartmentHeadSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading department head management"
    >
      <div className="h-12 w-80 max-w-full animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />

      <span className="sr-only">Loading department head management...</span>
    </div>
  );
}
