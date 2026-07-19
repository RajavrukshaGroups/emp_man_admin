"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  const isHydrated = useAuthStore((state) => state.isHydrated);

  const isInitializing = useAuthStore((state) => state.isInitializing);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isHydrated && !isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isInitializing, isAuthenticated, router]);

  if (!isHydrated || isInitializing || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 size={20} className="animate-spin" />
          Loading your account...
        </div>
      </div>
    );
  }

  return children;
}
