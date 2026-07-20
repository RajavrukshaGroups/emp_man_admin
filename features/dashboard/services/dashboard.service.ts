import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "../types/dashboard.types";

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
};