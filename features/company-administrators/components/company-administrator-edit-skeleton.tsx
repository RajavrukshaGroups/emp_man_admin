export function CompanyAdministratorEditSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading company administrator details"
    >
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-slate-200" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-slate-200" />
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}

      <span className="sr-only">Loading administrator details...</span>
    </div>
  );
}
