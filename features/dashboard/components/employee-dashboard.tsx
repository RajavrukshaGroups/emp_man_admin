"use client";

import { CalendarCheck, CalendarDays, FileText, UserRound } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";

const employeeQuickActions = [
  {
    title: "My profile",
    description: "View and update your personal information.",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Attendance",
    description: "View your attendance records.",
    href: "/attendance",
    icon: CalendarCheck,
    permission: "attendance.read",
  },
  {
    title: "Leave requests",
    description: "View or submit leave requests.",
    href: "/leave",
    icon: CalendarDays,
    permission: "leave.read",
  },
  {
    title: "Payslips",
    description: "View salary slips and payment records.",
    href: "/payslips",
    icon: FileText,
    permission: "payslip.read",
  },
];

export function EmployeeDashboard() {
  const user = useAuthStore((state) => state.user);
  const companyAccess = useAuthStore((state) => state.companyAccess);

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Employee self-service"
        title={`Welcome back, ${
          user?.firstName ?? user?.displayName ?? "Employee"
        }`}
        description="Access your profile, attendance, leave and employment information."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employee code"
          value={companyAccess?.employeeCode ?? "Not assigned"}
          icon={UserRound}
        />

        <StatCard
          title="Attendance"
          value="Present"
          icon={CalendarCheck}
          description="Today's status"
        />

        <StatCard
          title="Leave balance"
          value={12}
          icon={CalendarDays}
          description="Days available"
        />

        <StatCard
          title="Payslips"
          value={6}
          icon={FileText}
          description="Available documents"
        />
      </div>

      <QuickActions
        title="Self-service"
        description="Frequently used employee services."
        actions={employeeQuickActions}
      />
    </div>
  );
}
