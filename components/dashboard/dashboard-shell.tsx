"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopHeader } from "@/components/dashboard/top-header";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 hidden w-72 lg:block">
        <Sidebar />
      </div>

      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <TopHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
