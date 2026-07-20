"use client";

import { CalendarCheck, ClipboardList, UserCheck, Users } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";

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

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Team overview"
        title={`Welcome back, ${
          user?.firstName ?? user?.displayName ?? "Team Lead"
        }`}
        description="Monitor your team members and day-to-day workforce activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Team members"
          value={12}
          icon={Users}
          href="/employees"
        />

        <StatCard
          title="Active members"
          value={11}
          icon={UserCheck}
          description="Currently active"
        />

        <StatCard
          title="Present today"
          value={10}
          icon={CalendarCheck}
          description="Attendance summary"
        />

        <StatCard
          title="Pending requests"
          value={2}
          icon={ClipboardList}
          description="Awaiting review"
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
