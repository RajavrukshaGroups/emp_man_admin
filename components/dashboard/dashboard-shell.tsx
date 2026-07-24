"use client";

import { useCallback, useState, type ReactNode } from "react";

import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopHeader } from "@/components/dashboard/top-header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsDesktopSidebarCollapsed((current) => !current);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 lg:block",
          isDesktopSidebarCollapsed ? "w-20" : "w-72",
        ].join(" ")}
      >
        <Sidebar
          collapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={toggleDesktopSidebar}
        />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={isMobileSidebarOpen} onClose={closeMobileSidebar} />

      {/* Main dashboard area */}
      <div
        className={[
          "min-w-0 transition-[padding] duration-300",
          isDesktopSidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
        ].join(" ")}
      >
        <TopHeader onMenuClick={openMobileSidebar} />

        <main className="min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
