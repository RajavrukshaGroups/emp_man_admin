import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    ApproveAttendanceRegularizationPayload,
    AttendanceRegularization,
    AttendanceRegularizationListQuery,
    AttendanceRegularizationListResponse,
    CancelAttendanceRegularizationPayload,
    CreateAttendanceRegularizationPayload,
    RecommendAttendanceRegularizationPayload,
    RejectAttendanceRegularizationPayload,
} from "../types/attendance-regularization.types";

export const attendanceRegularizationService = {
    async create(
        companyId: string,
        payload: CreateAttendanceRegularizationPayload,
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations`,
            payload,
        );

        return response.data.data;
    },

    async getMyHistory(
        companyId: string,
        query: AttendanceRegularizationListQuery = {},
    ): Promise<AttendanceRegularizationListResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendanceRegularizationListResponse>
        >(
            `/companies/${companyId}/attendance/regularizations/me/history`,
            {
                params: query,
            },
        );

        return response.data.data;
    },

    async list(
        companyId: string,
        query: AttendanceRegularizationListQuery = {},
    ): Promise<AttendanceRegularizationListResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendanceRegularizationListResponse>
        >(
            `/companies/${companyId}/attendance/regularizations`,
            {
                params: query,
            },
        );

        return response.data.data;
    },

    async getById(
        companyId: string,
        regularizationId: string,
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.get<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations/${regularizationId}`,
        );

        return response.data.data;
    },

    async recommend(
        companyId: string,
        regularizationId: string,
        payload: RecommendAttendanceRegularizationPayload = {},
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations/${regularizationId}/recommend`,
            payload,
        );

        return response.data.data;
    },

    async approve(
        companyId: string,
        regularizationId: string,
        payload: ApproveAttendanceRegularizationPayload = {},
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations/${regularizationId}/approve`,
            payload,
        );

        return response.data.data;
    },

    async reject(
        companyId: string,
        regularizationId: string,
        payload: RejectAttendanceRegularizationPayload,
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations/${regularizationId}/reject`,
            payload,
        );

        return response.data.data;
    },

    async cancel(
        companyId: string,
        regularizationId: string,
        payload: CancelAttendanceRegularizationPayload = {},
    ): Promise<AttendanceRegularization> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRegularization>
        >(
            `/companies/${companyId}/attendance/regularizations/${regularizationId}/cancel`,
            payload,
        );

        return response.data.data;
    },
};