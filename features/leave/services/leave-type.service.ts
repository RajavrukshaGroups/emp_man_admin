import api from "@/lib/axios";

import type {
    LeaveAllocationMethod,
    LeavePaymentType,
    LeaveStatus,
    LeaveType,
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

export interface LeaveTypeListResponse {
    items: LeaveType[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/* =========================================================
   FILTERS
   ========================================================= */

export interface LeaveTypeListFilters {
    page?: number;
    limit?: number;

    search?: string;

    status?: LeaveStatus;

    paymentType?: LeavePaymentType;

    allocationMethod?: LeaveAllocationMethod;

    effectiveOn?: string;

    sortBy?: "name" | "code" | "effectiveFrom" | "createdAt" | "updatedAt";

    sortOrder?: "asc" | "desc";
}

/* =========================================================
   CREATE PAYLOAD
   ========================================================= */

export interface CreateLeaveTypePayload {
    name: string;
    code: string;

    description?: string;

    paymentType?: LeavePaymentType;

    requiresBalance?: boolean;

    annualEntitlementDays?: number;

    allocationMethod?: LeaveAllocationMethod;

    monthlyEntitlementDays?: number;

    maximumMonthlyUsageDays?: number | null;

    allowMonthlyAccumulation?: boolean;

    allowHalfDay?: boolean;

    minimumServiceDays?: number;

    minimumNoticeDays?: number;

    maximumConsecutiveDays?: number | null;

    allowBackdatedApplication?: boolean;

    maximumBackdatedDays?: number;

    requireAttachment?: boolean;

    attachmentRequiredFromDays?: number | null;

    allowNegativeBalance?: boolean;

    carryForwardEnabled?: boolean;

    maximumCarryForwardDays?: number;

    effectiveFrom: string;

    effectiveTo?: string | null;

    status?: LeaveStatus;
}

/* =========================================================
   UPDATE PAYLOAD
   ========================================================= */

export type UpdateLeaveTypePayload =
    Partial<Omit<CreateLeaveTypePayload, "effectiveFrom">> & {
        effectiveFrom?: string;
    };

/* =========================================================
   QUERY BUILDER
   ========================================================= */

function buildParams(filters?: LeaveTypeListFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        page: filters.page,
        limit: filters.limit,

        search: filters.search,

        status: filters.status,

        paymentType: filters.paymentType,

        allocationMethod: filters.allocationMethod,

        effectiveOn: filters.effectiveOn,

        sortBy: filters.sortBy,

        sortOrder: filters.sortOrder,
    };
}

/* =========================================================
   SERVICE
   ========================================================= */

export const leaveTypeService = {
    /**
     * Create a company leave type.
     *
     * Requires: leave.type_manage
     */
    async create(
        companyId: string,
        payload: CreateLeaveTypePayload,
    ): Promise<LeaveType> {
        const response = await api.post<ApiResponse<LeaveType>>(
            `/companies/${companyId}/leave/types`,
            payload,
        );

        return response.data.data;
    },

    /**
     * List company leave types.
     *
     * Employee Apply Leave will primarily use:
     *
     * { status: "ACTIVE" }
     */
    async list(
        companyId: string,
        filters?: LeaveTypeListFilters,
    ): Promise<LeaveTypeListResponse> {
        const response = await api.get<ApiResponse<LeaveTypeListResponse>>(
            `/companies/${companyId}/leave/types`,
            {
                params: buildParams(filters),
            },
        );

        return response.data.data;
    },

    /**
     * Get one leave type.
     */
    async getById(
        companyId: string,
        leaveTypeId: string,
    ): Promise<LeaveType> {
        const response = await api.get<ApiResponse<LeaveType>>(
            `/companies/${companyId}/leave/types/${leaveTypeId}`,
        );

        return response.data.data;
    },

    /**
     * Update company leave type.
     *
     * Requires: leave.type_manage
     */
    async update(
        companyId: string,
        leaveTypeId: string,
        payload: UpdateLeaveTypePayload,
    ): Promise<LeaveType> {
        const response = await api.patch<ApiResponse<LeaveType>>(
            `/companies/${companyId}/leave/types/${leaveTypeId}`,
            payload,
        );

        return response.data.data;
    },
};