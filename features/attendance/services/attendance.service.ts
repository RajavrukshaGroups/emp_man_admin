import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AttendanceManagementQuery,
    AttendanceManagementResponse,
    AttendanceRecord,
    CancelFieldVisitPayload,
    CheckInPayload,
    CheckOutPayload,
    DailyAttendanceSummaryQuery,
    DailyAttendanceSummaryResponse,
    EndBreakPayload,
    EndFieldVisitPayload,
    FieldVisit,
    FieldVisitHistoryResponse,
    FieldVisitManagementQuery,
    MyAttendanceHistoryQuery,
    MyAttendanceHistoryResponse,
    MyFieldVisitHistoryQuery,
    MyTodayAttendanceResponse,
    StartBreakPayload,
    StartFieldVisitPayload,
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

    // ============================================================
    // FIELD VISITS
    // ============================================================

    async startFieldVisit(
        companyId: string,
        payload: StartFieldVisitPayload,
    ): Promise<FieldVisit> {
        const response = await apiClient.post<ApiResponse<FieldVisit>>(
            `/companies/${companyId}/attendance/field-visits/start`,
            payload,
        );

        return response.data.data;
    },

    async endFieldVisit(
        companyId: string,
        fieldVisitId: string,
        payload: EndFieldVisitPayload,
    ): Promise<FieldVisit> {
        const response = await apiClient.post<ApiResponse<FieldVisit>>(
            `/companies/${companyId}/attendance/field-visits/${fieldVisitId}/end`,
            payload,
        );

        return response.data.data;
    },

    async cancelFieldVisit(
        companyId: string,
        fieldVisitId: string,
        payload: CancelFieldVisitPayload,
    ): Promise<FieldVisit> {
        const response = await apiClient.post<ApiResponse<FieldVisit>>(
            `/companies/${companyId}/attendance/field-visits/${fieldVisitId}/cancel`,
            payload,
        );

        return response.data.data;
    },

    async getMyActiveFieldVisit(
        companyId: string,
    ): Promise<FieldVisit | null> {
        const response = await apiClient.get<ApiResponse<FieldVisit | null>>(
            `/companies/${companyId}/attendance/field-visits/me/active`,
        );

        return response.data.data;
    },

    async getMyFieldVisitHistory(
        companyId: string,
        query: MyFieldVisitHistoryQuery = {},
    ): Promise<FieldVisitHistoryResponse> {
        const response = await apiClient.get<
            ApiResponse<FieldVisitHistoryResponse>
        >(
            `/companies/${companyId}/attendance/field-visits/me/history`,
            {
                params: query,
            },
        );

        return response.data.data;
    },

    async getFieldVisits(
        companyId: string,
        query: FieldVisitManagementQuery = {},
    ): Promise<FieldVisitHistoryResponse> {
        const response = await apiClient.get<
            ApiResponse<FieldVisitHistoryResponse>
        >(
            `/companies/${companyId}/attendance/field-visits`,
            {
                params: query,
            },
        );

        return response.data.data;
    },

    async getFieldVisitById(
        companyId: string,
        fieldVisitId: string,
    ): Promise<FieldVisit> {
        const response = await apiClient.get<ApiResponse<FieldVisit>>(
            `/companies/${companyId}/attendance/field-visits/${fieldVisitId}`,
        );

        return response.data.data;
    },
};