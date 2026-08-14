import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";
import type {
  DashboardSummary,
  TeamLeadDashboardSummary,
} from "../types/dashboard.types";
export const dashboardService = {
  async getSummary(
    companyId: string,
  ): Promise<DashboardSummary> {
    const response = await apiClient.get<
      ApiResponse<DashboardSummary>
    >(
      `/companies/${companyId}/dashboard/summary`,
    );

    return response.data.data;
  },
  async getTeamLeadDashboardSummary(
    companyId: string,
  ): Promise<TeamLeadDashboardSummary> {
    const response = await apiClient.get<
      ApiResponse<TeamLeadDashboardSummary>
    >(`/companies/${companyId}/dashboard/team-lead`);

    return response.data.data;
  },
};