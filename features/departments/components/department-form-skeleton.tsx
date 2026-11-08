function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );
}

function SkeletonSection({
  titleWidth,
  fields,
  textarea = false,
}: {
  titleWidth: string;
  fields: number;
  textarea?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <SkeletonBar className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBar className={`h-5 ${titleWidth}`} />
          <SkeletonBar className="h-3 w-64 max-w-full" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: fields }).map((_, index) => (
          <div
            key={index}
            className={textarea ? "sm:col-span-2 xl:col-span-3" : "space-y-2"}
          >
            <SkeletonBar className="mb-2 h-4 w-28" />
            <SkeletonBar
              className={textarea ? "h-28 w-full rounded-xl" : "h-11 w-full rounded-xl"}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DepartmentFormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading department form">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBar className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="space-y-3">
            <SkeletonBar className="h-9 w-56" />
            <SkeletonBar className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <SkeletonBar className="h-16 w-44 rounded-xl" />
      </div>

      <SkeletonSection titleWidth="w-48" fields={2} />
      <SkeletonSection titleWidth="w-48" fields={3} />
      <SkeletonSection titleWidth="w-52" fields={1} textarea />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-4 w-64 max-w-full" />
          <SkeletonBar className="h-3 w-72 max-w-full" />
        </div>
        <div className="flex gap-3">
          <SkeletonBar className="h-11 w-24 rounded-xl" />
          <SkeletonBar className="h-11 w-44 rounded-xl" />
        </div>
      </div>

      <span className="sr-only">Loading department form...</span>
    </div>
  );
}
