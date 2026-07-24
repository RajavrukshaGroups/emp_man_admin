"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleLogout = async () => {
    try {
      await logout();

      toast.success("Logged out successfully.");

      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to logout.");
    }
  };

  const initials =
    user?.displayName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              Welcome, {user?.firstName ?? "User"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {companyAccess?.designation ?? role?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {initials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-slate-900">
                  {user?.displayName}
                </p>

                <p className="max-w-40 truncate text-xs text-slate-500">
                  {role?.name}
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <UserRound className="h-4 w-4" />
                  My profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoading ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
