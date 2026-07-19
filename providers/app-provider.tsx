"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/providers/auth-provider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      {children}

      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}
