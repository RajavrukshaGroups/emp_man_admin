import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">{children}</div>
    </ProtectedRoute>
  );
}
