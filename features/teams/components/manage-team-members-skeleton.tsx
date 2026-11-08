export function ManageTeamMembersSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading team members"
    >
      <div className="h-12 w-80 max-w-full animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />

      <span className="sr-only">Loading team members...</span>
    </div>
  );
}
