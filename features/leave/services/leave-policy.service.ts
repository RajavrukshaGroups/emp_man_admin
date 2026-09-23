import api from "@/lib/axios";

import type {
    LeaveApprovalWorkflow,
    LeavePolicy,
    LeaveProrationRounding,
    LeaveSandwichRule,
    LeaveStatus,
} from "../types/leave.types";

/* =========================================================
   API RESPONSE
   ========================================================= */

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

/* =========================================================
   LIST RESPONSE
   ========================================================= */

export interface LeavePolicyListResponse {
    items: LeavePolicy[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/* =========================================================
   FILTERS
   ========================================================= */

export interface LeavePolicyListFilters {
    page?: number;
    limit?: number;

    search?: string;

    status?: LeaveStatus;

    isDefault?: boolean;

    effectiveOn?: string;

    sortBy?: "name" | "code" | "effectiveFrom" | "createdAt" | "updatedAt";

    sortOrder?: "asc" | "desc";
}

/* =========================================================
   CREATE PAYLOAD
   ========================================================= */

export interface CreateLeavePolicyPayload {
    name: string;
    code: string;

    description?: string;

    leaveYearStartMonth?: number;
    leaveYearStartDay?: number;

    excludeWeeklyOffsFromLeaveDays?: boolean;
    excludePublicHolidaysFromLeaveDays?: boolean;

    sandwichRule?: LeaveSandwichRule;

    approvalWorkflow?: LeaveApprovalWorkflow;

    allowApprovalWithoutRecommendation?: boolean;

    preventOverlappingRequests?: boolean;
    preventAttendanceConflict?: boolean;

    maximumFutureApplicationDays?: number | null;

    requireReason?: boolean;

    autoCreateLeaveBalances?: boolean;
    reserveBalanceOnSubmission?: boolean;

    prorateEntitlementForNewJoiners?: boolean;

    prorationRounding?: LeaveProrationRounding;

    allowEmployeeCancelPending?: boolean;
    allowEmployeeCancelRecommended?: boolean;

    allowApprovedLeaveCancellation?: boolean;
    approvedCancellationRequiresApproval?: boolean;

    effectiveFrom: string;
    effectiveTo?: string | null;

    isDefault?: boolean;

    status?: LeaveStatus;
}

/* =========================================================
   UPDATE PAYLOAD
   ========================================================= */

export type UpdateLeavePolicyPayload =
    Partial<Omit<CreateLeavePolicyPayload, "effectiveFrom">> & {
        effectiveFrom?: string;
    };

/* =========================================================
   QUERY PARAMS
   ========================================================= */

function buildParams(filters?: LeavePolicyListFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        page: filters.page,
        limit: filters.limit,

        search: filters.search,

        status: filters.status,

        // Backend validation expects "true" / "false"
        isDefault:
            filters.isDefault === undefined
                ? undefined
                : String(filters.isDefault),

        effectiveOn: filters.effectiveOn,

        sortBy: filters.sortBy,

        sortOrder: filters.sortOrder,
    };
}

/* =========================================================
   SERVICE
   ========================================================= */

export const leavePolicyService = {
    /**
     * Create company leave policy.
     */
    async create(
        companyId: string,
        payload: CreateLeavePolicyPayload,
    ): Promise<LeavePolicy> {
        const response = await api.post<ApiResponse<LeavePolicy>>(
            `/companies/${companyId}/leave/policies`,
            payload,
        );

        return response.data.data;
    },

    /**
     * List company leave policies.
     *
     * Example for current default policy:
     *
     * {
     *   status: "ACTIVE",
     *   isDefault: true
     * }
     */
    async list(
        companyId: string,
        filters?: LeavePolicyListFilters,
    ): Promise<LeavePolicyListResponse> {
        const response = await api.get<ApiResponse<LeavePolicyListResponse>>(
            `/companies/${companyId}/leave/policies`,
            {
                params: buildParams(filters),
            },
        );

        return response.data.data;
    },

    /**
     * Get one leave policy.
     */
    async getById(
        companyId: string,
        policyId: string,
    ): Promise<LeavePolicy> {
        const response = await api.get<ApiResponse<LeavePolicy>>(
            `/companies/${companyId}/leave/policies/${policyId}`,
        );

        return response.data.data;
    },

    /**
     * Update company leave policy.
     */
    async update(
        companyId: string,
        policyId: string,
        payload: UpdateLeavePolicyPayload,
    ): Promise<LeavePolicy> {
        const response = await api.patch<ApiResponse<LeavePolicy>>(
            `/companies/${companyId}/leave/policies/${policyId}`,
            payload,
        );

        return response.data.data;
    },
};