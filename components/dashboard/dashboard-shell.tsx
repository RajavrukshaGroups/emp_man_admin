"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GlobalLoader } from "@/components/common/global-loader";

import { useCallback, useState, type ReactNode } from "react";

import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopHeader } from "@/components/dashboard/top-header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  const [pendingNavigation, setPendingNavigation] = useState<{
    href: string;
    title: string;
    fromPath: string;
  } | null>(null);

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

  const handleSidebarNavigation = useCallback(
    (href: string, title: string) => {
      if (pathname === href) {
        setPendingNavigation(null);
        return;
      }

      setPendingNavigation({
        href,
        title,
        fromPath: pathname,
      });

      setIsMobileSidebarOpen(false);
    },
    [pathname],
  );

  useEffect(() => {
    if (!pendingNavigation) return;

    if (
      pathname !== pendingNavigation.fromPath &&
      (pathname === pendingNavigation.href ||
        pathname.startsWith(`${pendingNavigation.href}/`))
    ) {
      setPendingNavigation(null);
    }
  }, [pathname, pendingNavigation]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <GlobalLoader
        isOpen={pendingNavigation !== null}
        message={
          pendingNavigation
            ? `Loading ${pendingNavigation.title.toLowerCase()}...`
            : "Loading..."
        }
      />
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
          onNavigate={handleSidebarNavigation}
        />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        onNavigate={handleSidebarNavigation}
      />
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
