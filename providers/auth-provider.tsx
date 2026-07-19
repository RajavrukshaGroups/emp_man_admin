"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/store/auth.store";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const isHydrated = useAuthStore(
    (state) => state.isHydrated,
  );

  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth,
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void initializeAuth();
  }, [isHydrated, initializeAuth]);

  return children;
}