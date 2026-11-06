function SkeletonBar({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

export function CompanyAdministratorCreateSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading company administrator form"
    >
      <div className="space-y-3">
        <SkeletonBar className="h-4 w-40" />
        <SkeletonBar className="h-4 w-44" />
        <SkeletonBar className="h-9 w-full max-w-md" />
        <SkeletonBar className="h-4 w-full max-w-2xl" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <SkeletonBar className="h-14 w-14 shrink-0 rounded-2xl" />

          <div className="flex-1 space-y-3">
            <SkeletonBar className="h-3 w-32" />
            <SkeletonBar className="h-6 w-52 max-w-full" />
            <SkeletonBar className="h-4 w-64 max-w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <SkeletonBar className="h-5 w-52 max-w-full" />
        <SkeletonBar className="mt-3 h-4 w-full max-w-2xl" />
        <SkeletonBar className="mt-2 h-4 w-3/4" />
      </div>

      {[6, 4, 6, 3, 1].map((fieldCount, sectionIndex) => (
        <section
          key={sectionIndex}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <SkeletonBar className="h-6 w-56 max-w-full" />
          <SkeletonBar className="mt-3 h-4 w-full max-w-lg" />

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: fieldCount }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <span className="sr-only">Loading administrator form...</span>
    </div>
  );
}
