function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

interface CompanyFormSkeletonProps {
  mode?: "create" | "edit";
}

export function CompanyFormSkeleton({
  mode = "create",
}: CompanyFormSkeletonProps) {
  const sections = [
    { title: "Company information", fields: 5 },
    { title: "Contact information", fields: 3 },
    { title: "Company address", fields: 6 },
    { title: "Regional settings", fields: 4 },
  ];

  return (
    <div
      className="space-y-6"
      role="status"
      aria-label={`Loading ${mode} company form`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1 space-y-3">
          <SkeletonBar className="h-4 w-36" />
          <SkeletonBar className="h-9 w-64 max-w-full" />
          <SkeletonBar className="h-4 w-full max-w-2xl" />
          <SkeletonBar className="h-4 w-3/4 max-w-xl" />
        </div>

        <div className="w-full rounded-xl border border-blue-100 bg-blue-50 p-4 xl:w-56">
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="mt-3 h-4 w-40 max-w-full" />
        </div>
      </div>

      {sections.map((section) => (
        <section
          key={section.title}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <SkeletonBar className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-5 w-48 max-w-full" />
                <SkeletonBar className="h-4 w-full max-w-md" />
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {Array.from({ length: section.fields }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <SkeletonBar className="h-4 w-48 max-w-full" />
        <SkeletonBar className="mt-3 h-4 w-full max-w-xl" />
      </div>

      <span className="sr-only">Loading company form...</span>
    </div>
  );
}
