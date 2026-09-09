import { apiClient } from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AttendanceShift,
    AttendanceShiftListQuery,
    AttendanceShiftListResponse,
    CreateAttendanceShiftPayload,
    UpdateAttendanceShiftPayload,
} from "../types/attendance-shift.types";

export const attendanceShiftService = {
    async list(
        companyId: string,
        query: AttendanceShiftListQuery = {},
    ): Promise<AttendanceShiftListResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendanceShiftListResponse>
        >(`/companies/${companyId}/attendance/shifts`, {
            params: query,
        });

        return response.data.data;
    },

    async getById(
        companyId: string,
        shiftId: string,
    ): Promise<AttendanceShift> {
        const response = await apiClient.get<
            ApiResponse<AttendanceShift>
        >(
            `/companies/${companyId}/attendance/shifts/${shiftId}`,
        );

        return response.data.data;
    },

    async create(
        companyId: string,
        payload: CreateAttendanceShiftPayload,
    ): Promise<AttendanceShift> {
        const response = await apiClient.post<
            ApiResponse<AttendanceShift>
        >(
            `/companies/${companyId}/attendance/shifts`,
            payload,
        );

        return response.data.data;
    },

    async update(
        companyId: string,
        shiftId: string,
        payload: UpdateAttendanceShiftPayload,
    ): Promise<AttendanceShift> {
        const response = await apiClient.patch<
            ApiResponse<AttendanceShift>
        >(
            `/companies/${companyId}/attendance/shifts/${shiftId}`,
            payload,
        );

        return response.data.data;
    },
};