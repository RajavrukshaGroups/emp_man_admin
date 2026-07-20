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

const companyAdminQuickActions = [
  {
    title: "Add employee",
    description: "Register a new employee in the company.",
    href: "/employees/new",
    icon: UserPlus,
    permission: "employee.create",
  },
  {
    title: "Create department",
    description: "Create a new department.",
    href: "/departments/new",
    icon: Building2,
    permission: "department.create",
  },
  {
    title: "Create team",
    description: "Create a team under a department.",
    href: "/teams/new",
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total employees"
          value={128}
          icon={Users}
          trendValue="8.4%"
          trendDirection="up"
          description="from last month"
          href="/employees"
        />

        <StatCard
          title="Departments"
          value={8}
          icon={Building2}
          description="Active departments"
          href="/departments"
        />

        <StatCard
          title="Teams"
          value={14}
          icon={Network}
          description="Across all departments"
          href="/teams"
        />

        <StatCard
          title="Roles"
          value={6}
          icon={UserCog}
          description="Configured access roles"
          href="/roles"
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
