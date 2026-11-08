function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );
}

function SkeletonSection({
  fields,
  titleWidth,
  cards = false,
}: {
  fields: number;
  titleWidth: string;
  cards?: boolean;
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
          <div key={index} className={cards ? "" : "space-y-2"}>
            {cards ? (
              <SkeletonBar className="h-24 w-full rounded-xl" />
            ) : (
              <>
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-11 w-full rounded-xl" />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamFormSkeleton({ variant = "create" }: { variant?: "create" | "edit" }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading team form">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBar className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="space-y-3">
            <SkeletonBar className="h-9 w-52" />
            <SkeletonBar className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <SkeletonBar className="h-16 w-44 rounded-xl" />
      </div>

      <SkeletonSection titleWidth="w-44" fields={variant === "create" ? 3 : 2} />
      <SkeletonSection titleWidth="w-52" fields={1} />
      {variant === "create" && (
        <SkeletonSection titleWidth="w-32" fields={6} cards />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SkeletonBar className="mb-3 h-5 w-44" />
        <SkeletonBar className="mb-6 h-3 w-64 max-w-full" />
        <SkeletonBar className="h-28 w-full rounded-xl" />
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <SkeletonBar className="h-4 w-64 max-w-full" />
        <div className="flex gap-3">
          <SkeletonBar className="h-11 w-24 rounded-xl" />
          <SkeletonBar className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      <span className="sr-only">Loading team form...</span>
    </div>
  );
}
