interface UnsupportedDashboardProps {
  roleName?: string;
}

export function UnsupportedDashboard({
  roleName,
}: UnsupportedDashboardProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h1 className="font-semibold text-amber-900">
        Dashboard not configured
      </h1>

      <p className="mt-1 text-sm text-amber-700">
        No dashboard is currently configured for the role{" "}
        {roleName ? `"${roleName}"` : "assigned to this account"}.
      </p>
    </div>
  );
}