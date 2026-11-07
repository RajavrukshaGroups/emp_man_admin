function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

const sections = [
  { title: "Company information", fields: 5 },
  { title: "Contact information", fields: 3 },
  { title: "Company address", fields: 4 },
  { title: "Regional settings", fields: 4 },
  { title: "Record information", fields: 3 },
  { title: "Company administrator", fields: 4 },
];

export function CompanyDetailsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading company details">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <SkeletonBar className="h-4 w-36" />
          <SkeletonBar className="h-9 w-64 max-w-full" />
          <SkeletonBar className="h-4 w-full max-w-md" />
        </div>

        <div className="flex flex-wrap gap-3">
          <SkeletonBar className="h-11 w-28 rounded-xl" />
          <SkeletonBar className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-white/10" />

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-7 w-56 max-w-full animate-pulse rounded-lg bg-white/20" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-40 animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-white/10" />
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 bg-white px-6 py-5">
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="h-5 w-32 max-w-full" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <SkeletonBar className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-5 w-44 max-w-full" />
                <SkeletonBar className="h-4 w-full max-w-xs" />
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {Array.from({ length: section.fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBar className="h-3 w-24" />
                  <SkeletonBar className="h-5 w-36 max-w-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <span className="sr-only">Loading company details...</span>
    </div>
  );
}
