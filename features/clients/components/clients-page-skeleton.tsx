import { ClientsTableSkeleton } from "./clients-table-skeleton";

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function ClientsPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading clients page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <SkeletonBar className="h-4 w-36" />
          <SkeletonBar className="h-9 w-44" />
          <SkeletonBar className="h-4 w-full max-w-md" />
        </div>

        <SkeletonBar className="h-11 w-40 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_170px_190px_170px_180px_auto]">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBar key={index} className="h-11 w-full rounded-xl" />
          ))}
          <div className="flex gap-2">
            <SkeletonBar className="h-11 w-24 rounded-xl" />
            <SkeletonBar className="h-11 w-11 rounded-xl" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ClientsTableSkeleton />
      </section>

      <span className="sr-only">Loading clients page...</span>
    </div>
  );
}
