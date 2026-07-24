"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { dashboardNavigation } from "@/components/dashboard/navigation";

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const company = useAuthStore((state) => state.company);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);

  const visibleNavigation = dashboardNavigation.filter((item) => {
    if (item.permission && !permissions.includes(item.permission)) {
      return false;
    }

    if (item.roles && role?.code && !item.roles.includes(role.code)) {
      return false;
    }

    return true;
  });

  return (
    <aside className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
      <div className="shrink-0 border-b border-white/10 px-3 py-4">
        <div
          className={[
            "flex items-center",
            collapsed ? "justify-center" : "justify-between gap-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Building2 className="h-6 w-6" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {company?.name ?? "Employee Management"}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {role?.name ?? "Account"}
                </p>
              </div>
            )}
          </div>

          {!collapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:inline-flex"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 hidden h-9 w-full items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2 text-sm font-medium transition",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />

                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={[
          "shrink-0 border-t border-white/10 py-3",
          collapsed ? "px-2" : "px-5",
        ].join(" ")}
      >
        {collapsed ? (
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-semibold text-slate-400"
            title="Employee Management System"
          >
            EMS
          </div>
        ) : (
          <p className="text-xs text-slate-500">Employee Management System</p>
        )}
      </div>
    </aside>
  );
}
