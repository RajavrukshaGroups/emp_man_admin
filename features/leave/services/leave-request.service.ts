import api from "@/lib/axios";

import type {
    CancelLeavePayload,
    CreateLeaveRequestPayload,
    LeaveCancellationRequestPayload,
    LeaveRequest,
    LeaveRequestFilters,
    RejectLeavePayload,
} from "../types/leave.types";

/* =========================================================
   API RESPONSE TYPES
   ========================================================= */

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface LeaveRequestListResponse {
    items: LeaveRequest[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/* =========================================================
   ACTION PAYLOADS
   ========================================================= */

export interface RecommendLeavePayload {
    note?: string;
}

export interface ApproveLeavePayload {
    note?: string;
}

export interface ApproveLeaveCancellationPayload {
    note?: string;
}

export interface RejectLeaveCancellationPayload {
    // reason: string;
    note?: string;
}

/* =========================================================
   QUERY BUILDER
   ========================================================= */

function buildLeaveRequestParams(filters?: LeaveRequestFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        page: filters.page,
        limit: filters.limit,

        status: filters.status,

        cancellationStatus: filters.cancellationStatus,

        employeeId: filters.employeeId,
        departmentId: filters.departmentId,
        teamId: filters.teamId,

        leaveTypeId: filters.leaveTypeId,

        fromDate: filters.fromDate,
        toDate: filters.toDate,
    };
}

/* =========================================================
   SERVICE
   ========================================================= */

export const leaveRequestService = {
    /**
     * Submit a leave request.
     */
    async create(
        companyId: string,
        payload: CreateLeaveRequestPayload,
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests`,
            payload,
        );

        return response.data.data;
    },

    /**
     * List leave requests.
     *
     * Backend scope decides what the authenticated user can see:
     *
     * Employee     → self
     * Team Lead    → permitted team scope
     * Company Admin → company scope
     */
    async list(
        companyId: string,
        filters?: LeaveRequestFilters,
    ): Promise<LeaveRequestListResponse> {
        const response = await api.get<ApiResponse<LeaveRequestListResponse>>(
            `/companies/${companyId}/leave/requests`,
            {
                params: buildLeaveRequestParams(filters),
            },
        );

        return response.data.data;
    },

    /**
     * Get one leave request.
     */
    async getById(
        companyId: string,
        leaveRequestId: string,
    ): Promise<LeaveRequest> {
        const response = await api.get<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}`,
        );

        return response.data.data;
    },

    /**
     * Team Lead / authorized manager recommendation.
     */
    async recommend(
        companyId: string,
        leaveRequestId: string,
        payload: RecommendLeavePayload = {},
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/recommend`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Company-level approval.
     */
    async approve(
        companyId: string,
        leaveRequestId: string,
        payload: ApproveLeavePayload = {},
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/approve`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Reject a leave request.
     */
    async reject(
        companyId: string,
        leaveRequestId: string,
        payload: RejectLeavePayload,
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/reject`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Cancel own PENDING / RECOMMENDED leave.
     */
    async cancel(
        companyId: string,
        leaveRequestId: string,
        payload: CancelLeavePayload,
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/cancel`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Request cancellation of an already APPROVED leave.
     */
    async requestCancellation(
        companyId: string,
        leaveRequestId: string,
        payload: LeaveCancellationRequestPayload,
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/cancellation-request`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Approve cancellation of an APPROVED leave.
     */
    async approveCancellation(
        companyId: string,
        leaveRequestId: string,
        payload: ApproveLeaveCancellationPayload = {},
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/cancellation/approve`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Reject cancellation of an APPROVED leave.
     */
    async rejectCancellation(
        companyId: string,
        leaveRequestId: string,
        payload: RejectLeaveCancellationPayload,
    ): Promise<LeaveRequest> {
        const response = await api.post<ApiResponse<LeaveRequest>>(
            `/companies/${companyId}/leave/requests/${leaveRequestId}/cancellation/reject`,
            payload,
        );

        return response.data.data;
    },
};