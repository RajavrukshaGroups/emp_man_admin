
import { apiClient } from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
  AttendancePolicy,
  AttendancePolicyListQuery,
  AttendancePolicyListResponse,
  CreateAttendancePolicyPayload,
  UpdateAttendancePolicyPayload,
} from "../types/attendance-policy.types";

export const attendancePolicyService = {
  async list(
    companyId: string,
    query: AttendancePolicyListQuery = {},
  ): Promise<AttendancePolicyListResponse> {
    const response = await apiClient.get<
      ApiResponse<AttendancePolicyListResponse>
    >(`/companies/${companyId}/attendance/policies`, {
      params: query,
    });

    return response.data.data;
  },

  async getById(
    companyId: string,
    policyId: string,
  ): Promise<AttendancePolicy> {
    const response = await apiClient.get<ApiResponse<AttendancePolicy>>(
      `/companies/${companyId}/attendance/policies/${policyId}`,
    );

    return response.data.data;
  },

  async create(
    companyId: string,
    payload: CreateAttendancePolicyPayload,
  ): Promise<AttendancePolicy> {
    const response = await apiClient.post<ApiResponse<AttendancePolicy>>(
      `/companies/${companyId}/attendance/policies`,
      payload,
    );

    return response.data.data;
  },

  async update(
    companyId: string,
    policyId: string,
    payload: UpdateAttendancePolicyPayload,
  ): Promise<AttendancePolicy> {
    const response = await apiClient.patch<ApiResponse<AttendancePolicy>>(
      `/companies/${companyId}/attendance/policies/${policyId}`,
      payload,
    );

    return response.data.data;
  },
};
