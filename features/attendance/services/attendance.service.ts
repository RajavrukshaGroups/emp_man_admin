import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AttendanceRecord,
    CheckInPayload,
    CheckOutPayload,
    EndBreakPayload,
    MyTodayAttendanceResponse,
    StartBreakPayload,
} from "../types/attendance.types";

export const attendanceService = {
    async getMyToday(
        companyId: string,
    ): Promise<MyTodayAttendanceResponse> {
        const response = await apiClient.get<
            ApiResponse<MyTodayAttendanceResponse>
        >(
            `/companies/${companyId}/attendance/me/today`,
        );

        return response.data.data;
    },

    async checkIn(
        companyId: string,
        payload: CheckInPayload,
    ): Promise<AttendanceRecord> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRecord>
        >(
            `/companies/${companyId}/attendance/check-in`,
            payload,
        );

        return response.data.data;
    },

    async checkOut(
        companyId: string,
        payload: CheckOutPayload,
    ): Promise<AttendanceRecord> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRecord>
        >(
            `/companies/${companyId}/attendance/check-out`,
            payload,
        );

        return response.data.data;
    },

    async startBreak(
        companyId: string,
        payload: StartBreakPayload,
    ): Promise<AttendanceRecord> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRecord>
        >(
            `/companies/${companyId}/attendance/break/start`,
            payload,
        );

        return response.data.data;
    },

    async endBreak(
        companyId: string,
        payload: EndBreakPayload,
    ): Promise<AttendanceRecord> {
        const response = await apiClient.post<
            ApiResponse<AttendanceRecord>
        >(
            `/companies/${companyId}/attendance/break/end`,
            payload,
        );

        return response.data.data;
    },
};