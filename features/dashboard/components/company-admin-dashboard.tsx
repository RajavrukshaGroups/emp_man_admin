"use client";

import {
  Building2,
  Network,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";

const companyAdminQuickActions = [
  {
    title: "Add employee",
    description: "Register a new employee in the company.",
    href: "/onboarding/new",
    icon: UserPlus,
    permission: "employee.create",
  },
  {
    title: "Create department",
    description: "Create a new department.",
    href: "/departments/create",
    icon: Building2,
    permission: "department.create",
  },
  {
    title: "Create team",
    description: "Create a team under a department.",
    href: "/teams/create",
    icon: Network,
    permission: "team.create",
  },
  {
    title: "Manage roles",
    description: "Configure roles and access permissions.",
    href: "/roles",
    icon: ShieldCheck,
    permission: "role.read",
  },
];

export function CompanyAdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);

  const { data, isLoading, error } = useDashboardSummary(company?._id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Company administration"
        title={`Welcome back, ${
          user?.firstName ?? user?.displayName ?? "Administrator"
        }`}
        description={`Manage employees, organizational structure and access control for ${
          company?.name ?? "your company"
        }.`}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total employees"
          value={data?.employees.total ?? 0}
          icon={Users}
          description={`${data?.employees.active ?? 0} active`}
          href="/employees"
          isLoading={isLoading}
        />
        <StatCard
          title="Departments"
          value={data?.departments.total ?? 0}
          icon={Building2}
          description={`${data?.departments.active ?? 0} active`}
          href="/departments"
          isLoading={isLoading}
        />
        <StatCard
          title="Teams"
          value={data?.teams.total ?? 0}
          icon={Network}
          description={`${data?.teams.active ?? 0} active`}
          href="/teams"
          isLoading={isLoading}
        />
        <StatCard
          title="Roles"
          value={data?.roles.total ?? 0}
          icon={UserCog}
          description="Active company roles"
          href="/roles"
          isLoading={isLoading}
        />
      </div>

      <QuickActions
        title="Administrative actions"
        description="Common company administration tasks."
        actions={companyAdminQuickActions}
      />
    </div>
  );
}
