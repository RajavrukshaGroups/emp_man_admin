"use client";

import {
  Building2,
  ClipboardList,
  Network,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";
import { useTeamLeadDashboardSummary } from "../hooks/use-team-lead-dashboard-summary";

const teamLeadQuickActions = [
  {
    title: "View team",
    description: "View employees assigned to your team.",
    href: "/employees",
    icon: Users,
    permission: "employee.read",
  },
  {
    title: "Manage team",
    description: "Review and update team information.",
    href: "/teams",
    icon: ClipboardList,
    permission: "team.read",
  },
];

export function TeamLeadDashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);

  const { data, isLoading, error } = useTeamLeadDashboardSummary(company?._id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Team overview"
        title={`Welcome back, ${
          user?.firstName ?? user?.displayName ?? "Team Lead"
        }`}
        description="Monitor your team members and day-to-day workforce activity."
      />
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Team members"
          value={data?.members.total ?? 0}
          icon={Users}
          description="Employees assigned to your team"
          href="/employees"
          isLoading={isLoading}
        />

        <StatCard
          title="Active members"
          value={data?.members.active ?? 0}
          icon={UserCheck}
          description={`${data?.members.inactive ?? 0} inactive`}
          href="/employees?status=ACTIVE"
          isLoading={isLoading}
        />

        <StatCard
          title="Team"
          value={data?.team?.name ?? "Not assigned"}
          icon={Network}
          description={
            data?.team
              ? `${data.team.code} • ${data.team.status}`
              : "No team assigned"
          }
          href="/teams"
          isLoading={isLoading}
        />

        <StatCard
          title="Department"
          value={data?.department?.name ?? "Not assigned"}
          icon={Building2}
          description={
            data?.department
              ? `${data.department.code} • ${data.department.status}`
              : "No department assigned"
          }
          href="/departments"
          isLoading={isLoading}
        />
      </div>

      <QuickActions
        title="Team actions"
        description="Quick access to team management tools."
        actions={teamLeadQuickActions}
      />
    </div>
  );
}
