import api from "@/lib/axios";

import type {
    LeaveAllocationMethod,
    LeaveBalance,
    LeaveBalanceStatus,
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

export interface LeaveBalanceListResponse {
    items: LeaveBalance[];

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

export interface LeaveBalanceListFilters {
    page?: number;
    limit?: number;

    employeeId?: string;
    companyAccessId?: string;

    leaveTypeId?: string;
    leavePolicyId?: string;

    allocationMethod?: LeaveAllocationMethod;

    status?: LeaveBalanceStatus;

    leaveYearStart?: string;
    leaveYearEnd?: string;

    search?: string;

    sortBy?:
    | "leaveYearStart"
    | "leaveYearEnd"
    | "allocatedDays"
    | "accruedDays"
    | "pendingDays"
    | "usedDays"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

export interface EmployeeLeaveBalanceFilters {
    leaveTypeId?: string;

    status?: LeaveBalanceStatus;

    leaveYearStart?: string;
    leaveYearEnd?: string;

    sortBy?:
    | "leaveYearStart"
    | "leaveYearEnd"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

/* =========================================================
   PAYLOADS
   ========================================================= */

export interface InitializeLeaveBalancePayload {
    employeeId: string;

    leaveTypeId: string;
    leavePolicyId: string;

    leaveYearStart: string;
    leaveYearEnd: string;
    leaveYearLabel: string;

    carriedForwardDays?: number;
}

export interface AdjustLeaveBalancePayload {
    adjustmentDays: number;
    periodKey?: string;
    reason: string;
}

export interface AccrueLeaveBalancePayload {
    periodDate: string;
}

/* =========================================================
   QUERY BUILDERS
   ========================================================= */

function buildListParams(filters?: LeaveBalanceListFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        page: filters.page,
        limit: filters.limit,

        employeeId: filters.employeeId,
        companyAccessId: filters.companyAccessId,

        leaveTypeId: filters.leaveTypeId,
        leavePolicyId: filters.leavePolicyId,

        allocationMethod: filters.allocationMethod,

        status: filters.status,

        leaveYearStart: filters.leaveYearStart,
        leaveYearEnd: filters.leaveYearEnd,

        search: filters.search,

        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
    };
}

function buildEmployeeParams(filters?: EmployeeLeaveBalanceFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        leaveTypeId: filters.leaveTypeId,

        status: filters.status,

        leaveYearStart: filters.leaveYearStart,
        leaveYearEnd: filters.leaveYearEnd,

        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
    };
}

/* =========================================================
   SERVICE
   ========================================================= */

export const leaveBalanceService = {
    /**
     * Initialize an employee leave balance.
     *
     * Requires:
     * leave.balance_manage
     */
    async initialize(
        companyId: string,
        payload: InitializeLeaveBalancePayload,
    ): Promise<LeaveBalance> {
        const response = await api.post<ApiResponse<LeaveBalance>>(
            `/companies/${companyId}/leave/balances/initialize`,
            payload,
        );

        return response.data.data;
    },

    /**
     * List leave balances visible to the authenticated user.
     *
     * Backend scope remains authoritative.
     */
    async list(
        companyId: string,
        filters?: LeaveBalanceListFilters,
    ): Promise<LeaveBalanceListResponse> {
        const response = await api.get<ApiResponse<LeaveBalanceListResponse>>(
            `/companies/${companyId}/leave/balances`,
            {
                params: buildListParams(filters),
            },
        );

        return response.data.data;
    },

    /**
     * Get balances belonging to a specific employee.
     *
     * This endpoint returns LeaveBalance[] directly.
     */
    async getByEmployee(
        companyId: string,
        employeeId: string,
        filters?: EmployeeLeaveBalanceFilters,
    ): Promise<LeaveBalance[]> {
        const response = await api.get<ApiResponse<LeaveBalance[]>>(
            `/companies/${companyId}/leave/balances/employee/${employeeId}`,
            {
                params: buildEmployeeParams(filters),
            },
        );

        return response.data.data;
    },

    /**
     * Get one leave balance.
     */
    async getById(
        companyId: string,
        balanceId: string,
    ): Promise<LeaveBalance> {
        const response = await api.get<ApiResponse<LeaveBalance>>(
            `/companies/${companyId}/leave/balances/${balanceId}`,
        );

        return response.data.data;
    },

    /**
     * Administrative balance adjustment.
     *
     * Positive:
     * +1   → credit one day
     *
     * Negative:
     * -0.5 → deduct half day
     */
    async adjust(
        companyId: string,
        balanceId: string,
        payload: AdjustLeaveBalancePayload,
    ) {
        const response = await api.patch<ApiResponse<LeaveBalance>>(
            `/companies/${companyId}/leave/balances/${balanceId}/adjust`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Credit a MONTHLY_ACCRUAL leave balance.
     */
    async accrue(
        companyId: string,
        balanceId: string,
        payload: AccrueLeaveBalancePayload,
    ): Promise<LeaveBalance> {
        const response = await api.post<ApiResponse<LeaveBalance>>(
            `/companies/${companyId}/leave/balances/${balanceId}/accrue`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Close an employee leave balance.
     *
     * Current controller does not pass a body to the service.
     */
    async close(
        companyId: string,
        balanceId: string,
    ): Promise<LeaveBalance> {
        const response = await api.post<ApiResponse<LeaveBalance>>(
            `/companies/${companyId}/leave/balances/${balanceId}/close`,
            {},
        );

        return response.data.data;
    },
};