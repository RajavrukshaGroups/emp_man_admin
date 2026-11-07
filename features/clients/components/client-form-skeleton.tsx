type ClientFormSkeletonProps = {
  mode: "create" | "edit";
};

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

function SkeletonSection({
  fields,
  notes = false,
}: {
  fields?: number;
  notes?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <SkeletonBar className="h-5 w-44 max-w-full" />
        <SkeletonBar className="h-4 w-full max-w-sm" />
      </div>

      {notes ? (
        <SkeletonBar className="h-36 w-full rounded-xl" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: fields ?? 0 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBar className="h-4 w-28" />
              <SkeletonBar className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ClientFormSkeleton({ mode }: ClientFormSkeletonProps) {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6"
      role="status"
      aria-label={`Loading ${mode} client form`}
    >
      <div className="space-y-3">
        <SkeletonBar className="h-4 w-36" />
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="h-9 w-56" />
        <SkeletonBar className="h-4 w-full max-w-md" />
      </div>

      <SkeletonSection fields={mode === "create" ? 6 : 5} />
      <SkeletonSection fields={5} />
      <SkeletonSection fields={7} />
      <SkeletonSection notes />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SkeletonBar className="h-11 w-full rounded-xl sm:w-28" />
        <SkeletonBar className="h-11 w-full rounded-xl sm:w-40" />
      </div>

      <span className="sr-only">Loading client form...</span>
    </div>
  );
}
