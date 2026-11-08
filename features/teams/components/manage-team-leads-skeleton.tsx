export function ManageTeamLeadsSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading team leads"
    >
      <div className="h-12 w-72 max-w-full animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />

      <span className="sr-only">Loading team leads...</span>
    </div>
  );
}
