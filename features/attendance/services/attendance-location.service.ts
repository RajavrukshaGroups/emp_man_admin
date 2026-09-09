import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

import type {
    AttendanceLocation,
    AttendanceLocationListQuery,
    AttendanceLocationListResponse,
    CreateAttendanceLocationPayload,
    UpdateAttendanceLocationPayload,
} from "../types/attendance-location.types";

export const attendanceLocationService = {
    async list(
        companyId: string,
        query: AttendanceLocationListQuery = {},
    ): Promise<AttendanceLocationListResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendanceLocationListResponse>
        >(
            `/companies/${companyId}/attendance/locations`,
            {
                params: query,
            },
        );

        return response.data.data;
    },

    async getById(
        companyId: string,
        locationId: string,
    ): Promise<AttendanceLocation> {
        const response = await apiClient.get<
            ApiResponse<AttendanceLocation>
        >(
            `/companies/${companyId}/attendance/locations/${locationId}`,
        );

        return response.data.data;
    },

    async create(
        companyId: string,
        payload: CreateAttendanceLocationPayload,
    ): Promise<AttendanceLocation> {
        const response = await apiClient.post<
            ApiResponse<AttendanceLocation>
        >(
            `/companies/${companyId}/attendance/locations`,
            payload,
        );

        return response.data.data;
    },

    async update(
        companyId: string,
        locationId: string,
        payload: UpdateAttendanceLocationPayload,
    ): Promise<AttendanceLocation> {
        const response = await apiClient.patch<
            ApiResponse<AttendanceLocation>
        >(
            `/companies/${companyId}/attendance/locations/${locationId}`,
            payload,
        );

        return response.data.data;
    },
};