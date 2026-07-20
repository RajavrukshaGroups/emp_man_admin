"use client";

import { useAuthStore } from "@/store/auth.store";

import { CompanyAdminDashboard } from "./company-admin-dashboard";
import { EmployeeDashboard } from "./employee-dashboard";
import { HrDashboard } from "./hr-dashboard";
import { TeamLeadDashboard } from "./team-lead-dashboard";
import { UnsupportedDashboard } from "./unsupported-dashboard";

export function DashboardRouter() {
  const role = useAuthStore((state) => state.role);

  switch (role?.code) {
    case "SUPER_ADMIN":
    case "COMPANY_ADMIN":
    case "ADMIN":
      return <CompanyAdminDashboard />;

    case "HR_MANAGER":
    case "HR_ADMIN":
      return <HrDashboard />;

    case "TEAM_LEAD":
      return <TeamLeadDashboard />;

    case "EMPLOYEE":
      return <EmployeeDashboard />;

    default:
      return <UnsupportedDashboard roleName={role?.name} />;
  }
}