"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/platform/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Companies",
    href: "/platform/companies",
    icon: Building2,
  },
  {
    label: "Platform Admins",
    href: "/platform/admins",
    icon: UserCog,
  },
  {
    label: "Audit Logs",
    href: "/platform/audit",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    href: "/platform/settings",
    icon: Settings,
  },
];

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const accessType = useAuthStore((state) => state.accessType);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isInitializing = useAuthStore((state) => state.isInitializing);

  const isHydrated = useAuthStore((state) => state.isHydrated);

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isHydrated || isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (accessType !== "GLOBAL") {
      router.replace("/dashboard");
    }
  }, [accessType, isAuthenticated, isHydrated, isInitializing, router]);

  async function handleLogout() {
    await logout();

    router.replace("/login");
    router.refresh();
  }

  if (!isHydrated || isInitializing) {
    return <PlatformLayoutSkeleton />;
  }

  if (!isAuthenticated || accessType !== "GLOBAL") {
    return null;
  }

  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Super Administrator";

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((value) => value?.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "SA";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-slate-950 text-white transition-all duration-300 lg:flex ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Brand */}
        <div
          className={`flex h-24 items-center border-b border-slate-800 ${
            isSidebarCollapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          <Link
            href="/platform/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold">EMS Platform</p>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  Super Administration
                </p>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Collapsed expand button */}
        {isSidebarCollapsed && (
          <div className="flex justify-center border-b border-slate-800 py-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`flex-1 space-y-2 py-5 ${
            isSidebarCollapsed ? "px-3" : "px-4"
          }`}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl py-3 text-sm font-semibold transition ${
                  isSidebarCollapsed
                    ? "justify-center px-3"
                    : "justify-between px-4"
                } ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span
                  className={`flex items-center ${
                    isSidebarCollapsed ? "justify-center" : "gap-3"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </span>

                {!isSidebarCollapsed && isActive && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-slate-800 p-4">
          {!isSidebarCollapsed && (
            <div className="mb-4 rounded-xl bg-slate-900 p-4">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {role?.name ?? "Super Administrator"}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            title={isSidebarCollapsed ? "Sign out" : undefined}
            className={`flex h-11 w-full items-center rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 transition hover:bg-slate-900 hover:text-white ${
              isSidebarCollapsed ? "justify-center" : "justify-center gap-2"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />

            {!isSidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div
        className={`transition-[padding] duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Platform Administration
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage companies and platform-level access.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="text-xs text-slate-500">
                  {role?.name ?? "Super Administrator"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function PlatformLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 hidden w-72 animate-pulse bg-slate-900 lg:block" />

      <div className="lg:pl-72">
        <div className="h-20 animate-pulse border-b border-slate-200 bg-white" />

        <main className="space-y-6 px-5 py-8 sm:px-8">
          <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
