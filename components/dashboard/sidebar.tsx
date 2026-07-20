"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { dashboardNavigation } from "@/components/dashboard/navigation";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
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
    <aside className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Building2 className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {company?.name ?? "Employee Management"}
            </p>

            <p className="truncate text-xs text-slate-400">
              {role?.name ?? "Account"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-slate-500">
          Employee Management System
        </p>
      </div>
    </aside>
  );
}