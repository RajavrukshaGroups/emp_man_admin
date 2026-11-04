import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AttendanceManagementQuery,
    AttendanceManagementResponse,
    AttendanceRecord,
    MyAttendanceCalendarResponse,
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
    MonthlyAttendanceReportQuery,
    MonthlyAttendanceReportResponse,
    AttendancePhotoEvidenceResponse,
    AttendancePhotoAction,
    AttendancePhotoRequirementResponse,
    UploadAttendancePhotoPayload,
} from "../types/attendance.types";


export type AttendanceLocationEligibilityAction =
    | "CHECK_IN"
    | "CHECK_OUT";

export interface AttendanceLocationEligibilityPayload {
    action: AttendanceLocationEligibilityAction;
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number | null;
        capturedAt: string;
    } | null;
    attendanceLocationId?: string | null;
}

export interface AttendanceLocationEligibilityResponse {
    eligible: boolean;
    action: AttendanceLocationEligibilityAction;
    attendanceLocationPolicy:
    | "GEOFENCE_REQUIRED"
    | "LOCATION_ONLY"
    | "NOT_REQUIRED";
    checkedAt: string;
}



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
    // MY MONTHLY ATTENDANCE CALENDAR
    // ============================================================

    async getMyAttendanceCalendar(
        companyId: string,
        month: string,
    ): Promise<MyAttendanceCalendarResponse> {
        const response = await apiClient.get<
            ApiResponse<MyAttendanceCalendarResponse>
        >(
            `/companies/${companyId}/attendance/me/calendar`,
            {
                params: { month },
            },
        );

        return response.data.data;
    },

    // ============================================================
    // ATTENDANCE DETAILS
    // ============================================================

    async getAttendanceById(
        companyId: string,
        attendanceId: string,
    ): Promise<AttendanceRecord> {
        const response = await apiClient.get<ApiResponse<AttendanceRecord>>(
            `/companies/${companyId}/attendance/${attendanceId}`,
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
    // MONTHLY ATTENDANCE REPORT
    // ============================================================

    /**
     * Employee-wise monthly attendance register.
     *
     * Supports Company Administrator, authorized HR,
     * and Team Lead users within their permitted scope.
     *
     * The backend is responsible for enforcing
     * company, department, and team visibility.
     */
    async getMonthlyReport(
        companyId: string,
        query: MonthlyAttendanceReportQuery,
    ): Promise<MonthlyAttendanceReportResponse> {
        const response = await apiClient.get<
            ApiResponse<MonthlyAttendanceReportResponse>
        >(
            `/companies/${companyId}/attendance/reports/monthly`,
            {
                params: query,
            },
        );

        return response.data.data;
    },


    async downloadMonthlyReportExcel(
        companyId: string,
        query: Omit<MonthlyAttendanceReportQuery, "page" | "limit">,
    ): Promise<Blob> {
        const response = await apiClient.get<Blob>(
            `/companies/${companyId}/attendance/reports/monthly/export`,
            {
                params: query,
                responseType: "blob",
            },
        );

        return response.data;
    },

    async downloadMonthlyReportPdf(
        companyId: string,
        query: Omit<MonthlyAttendanceReportQuery, "page" | "limit">,
    ): Promise<Blob> {
        const response = await apiClient.get<Blob>(
            `/companies/${companyId}/attendance/reports/monthly/export/pdf`,
            {
                params: query,
                responseType: "blob",
            },
        );

        return response.data;
    },


    // ============================================================
    // LOCATION ELIGIBILITY (BEFORE CAMERA)
    // ============================================================

    async checkLocationEligibility(
        companyId: string,
        payload: AttendanceLocationEligibilityPayload,
    ): Promise<AttendanceLocationEligibilityResponse> {
        const response = await apiClient.post<
            ApiResponse<AttendanceLocationEligibilityResponse>
        >(
            `/companies/${companyId}/attendance/location-eligibility`,
            payload,
        );

        return response.data.data;
    },


    // ============================================================
    // ATTENDANCE PHOTO EVIDENCE UPLOAD
    // ============================================================

    async getPhotoRequirement(
        companyId: string,
        action: AttendancePhotoAction,
        attendanceId?: string,
        fieldVisitId?: string,
    ): Promise<AttendancePhotoRequirementResponse> {
        const response = await apiClient.get<
            ApiResponse<AttendancePhotoRequirementResponse>
        >(
            `/companies/${companyId}/attendance/photo-requirement`,
            {
                params: {
                    action,
                    ...(attendanceId ? { attendanceId } : {}),
                    ...(fieldVisitId ? { fieldVisitId } : {}),
                },
            },
        );

        return response.data.data;
    },
    async uploadPhotoEvidence(
        companyId: string,
        payload: UploadAttendancePhotoPayload,
    ): Promise<AttendancePhotoEvidenceResponse> {
        const formData = new FormData();

        formData.append("action", payload.action);
        formData.append("photo", payload.photo);

        if (payload.attendanceId) {
            formData.append("attendanceId", payload.attendanceId);
        }

        if (payload.fieldVisitId) {
            formData.append("fieldVisitId", payload.fieldVisitId);
        }

        const response = await apiClient.post<
            ApiResponse<AttendancePhotoEvidenceResponse>
        >(
            `/companies/${companyId}/attendance/photo-evidence`,
            formData,
            {
                headers: {
                    "Content-Type": undefined,
                },
            },
        );

        return response.data.data;
    },


    // ============================================================
    // SECURE ATTENDANCE SESSION PHOTO VIEWING
    // ============================================================

    async getAttendanceSessionPhoto(
        companyId: string,
        attendanceId: string,
        sessionId: string,
        action: "CHECK_IN" | "CHECK_OUT",
    ): Promise<Blob> {
        const response = await apiClient.get<Blob>(
            `/companies/${companyId}/attendance/${attendanceId}/sessions/${sessionId}/photo`,
            {
                params: { action },
                responseType: "blob",
                headers: {
                    Accept: "image/jpeg",
                },
            },
        );

        return response.data;
    },


    // ============================================================
    // SECURE FIELD VISIT PHOTO VIEWING
    // ============================================================

    async getFieldVisitPhoto(
        companyId: string,
        fieldVisitId: string,
        action: "START" | "END",
    ): Promise<Blob> {
        const response = await apiClient.get<Blob>(
            `/companies/${companyId}/attendance/field-visits/${fieldVisitId}/photo`,
            {
                params: { action },
                responseType: "blob",
                headers: {
                    Accept: "image/jpeg",
                },
            },
        );

        return response.data;
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
