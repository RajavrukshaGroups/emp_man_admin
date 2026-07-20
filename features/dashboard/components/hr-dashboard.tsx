"use client";

import { Building2, Network, UserCheck, UserPlus, Users } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";

const hrQuickActions = [
  {
    title: "Add employee",
    description: "Register a new employee in the company.",
    href: "/employees/new",
    icon: UserPlus,
    permission: "employee.create",
  },
  {
    title: "View employees",
    description: "Browse and manage employee records.",
    href: "/employees",
    icon: Users,
    permission: "employee.read",
  },
  {
    title: "Manage departments",
    description: "Create and update company departments.",
    href: "/departments",
    icon: Building2,
    permission: "department.read",
  },
  {
    title: "Manage teams",
    description: "View and organize company teams.",
    href: "/teams",
    icon: Network,
    permission: "team.read",
  },
];
export function HrDashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);

  const { data, isLoading, error } = useDashboardSummary(company?._id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="HR overview"
        title={`Welcome back, ${
          user?.firstName ?? user?.displayName ?? "HR Manager"
        }`}
        description="Monitor employees, departments and teams from one central dashboard."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total employees"
          value={data?.employees.total ?? 0}
          icon={Users}
          description="Company workforce"
          href="/employees"
          isLoading={isLoading}
        />

        <StatCard
          title="Active employees"
          value={data?.employees.active ?? 0}
          icon={UserCheck}
          description="Currently active"
          href="/employees?status=ACTIVE"
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
      </div>

      <QuickActions actions={hrQuickActions} />
    </div>
  );
}
