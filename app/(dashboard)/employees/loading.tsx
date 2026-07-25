export default function EmployeesLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
