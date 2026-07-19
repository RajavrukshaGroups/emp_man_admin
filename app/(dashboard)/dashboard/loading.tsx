import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />

        <span>Loading dashboard...</span>
      </div>
    </div>
  );
}
