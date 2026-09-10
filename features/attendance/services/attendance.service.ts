import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AttendanceManagementQuery,
    AttendanceManagementResponse,
    AttendanceRecord,
    CheckInPayload,
    CheckOutPayload,
    DailyAttendanceSummaryQuery,
    DailyAttendanceSummaryResponse,
    EndBreakPayload,
    MyAttendanceHistoryQuery,
    MyAttendanceHistoryResponse,
    MyTodayAttendanceResponse,
    StartBreakPayload,
} from "../types/attendance.types";


export const attendanceService = {
    // ============================================================
    // SELF ATTENDANCE
    // ============================================================

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


    async getMyHistory(
        companyId: string,
        query: MyAttendanceHistoryQuery = {},
    ): Promise<MyAttendanceHistoryResponse> {
        const response = await apiClient.get<
            ApiResponse<MyAttendanceHistoryResponse>
        >(
            `/companies/${companyId}/attendance/me/history`,
            {
                params: query,
            },
        );

        return response.data.data;
    },


    // ============================================================
    // MANAGEMENT ATTENDANCE
    // ============================================================

    /**
     * Returns attendance records visible to the authenticated user.
     *
     * Backend scope enforcement determines what is returned:
     *
     * COMPANY / GLOBAL
     *   -> company-visible attendance
     *
     * TEAM
     *   -> managed team attendance + self where applicable
     *
     * The frontend must never attempt to implement security scope
     * by filtering company-wide records locally.
     */
    // ============================================================
    // MANAGEMENT ATTENDANCE
    // ============================================================

    async getAttendanceRecords(
        companyId: string,
        query: AttendanceManagementQuery = {},
    ): Promise<AttendanceManagementResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendanceManagementResponse>
        >(
            `/companies/${companyId}/attendance`,
            {
                params: query,
            },
        );

        return response.data.data;
    },


    async getDailySummary(
        companyId: string,
        query: DailyAttendanceSummaryQuery,
    ): Promise<DailyAttendanceSummaryResponse> {
        const response = await apiClient.get<
            ApiResponse<DailyAttendanceSummaryResponse>
        >(
            `/companies/${companyId}/attendance/daily-summary`,
            {
                params: query,
            },
        );

        return response.data.data;
    },


    // ============================================================
    // CHECK IN
    // ============================================================

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


    // ============================================================
    // CHECK OUT
    // ============================================================

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


    // ============================================================
    // BREAK
    // ============================================================

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