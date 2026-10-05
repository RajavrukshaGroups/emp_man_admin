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

/* =========================================================
   SUMMARY
   ========================================================= */

export interface LeaveBalanceSummary {
    totalBalances: number;
    availableDays: number;
    pendingDays: number;
    usedDays: number;
}

export interface LeaveBalanceSummaryFilters {
    employeeId?: string;
    companyAccessId?: string;

    leaveTypeId?: string;
    leavePolicyId?: string;

    allocationMethod?: LeaveAllocationMethod;

    status?: LeaveBalanceStatus;

    leaveYearStart?: string;
    leaveYearEnd?: string;
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

export interface InitializeBulkLeaveBalancesPayload {
    leavePolicyId: string;

    leaveYearStart: string;
    leaveYearEnd: string;
    leaveYearLabel: string;

    /**
     * Omit or send an empty array to initialize
     * all eligible active employees.
     */
    employeeIds?: string[];
}

export interface InitializeBulkLeaveBalancesResult {
    processedEmployees: number;
    processedLeaveTypes: number;
    possibleBalances: number;

    created: number;
    skippedExisting: number;

    failedBatches: number;

    failures: Array<{
        message: string;
        employeeId?: string;
        leaveTypeId?: string;
    }>;
}

export interface AdjustLeaveBalancePayload {
    adjustmentDays: number;
    periodKey?: string;
    reason: string;
}

export interface AccrueLeaveBalancePayload {
    periodDate: string;
}

export interface AccrueBulkLeaveBalancesPayload {
    periodDate: string;
}

export interface AccrueBulkLeaveBalancesResult {
    periodKey: string;

    processed: number;
    eligible: number;
    accrued: number;
    alreadyAccrued: number;

    skippedInactiveEmployee: number;
    skippedInactiveCompanyAccess: number;

    failed: number;

    failures: Array<{
        balanceId?: string;
        employeeId?: string;
        leaveTypeId?: string;
        message: string;
    }>;
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

function buildSummaryParams(filters?: LeaveBalanceSummaryFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        employeeId: filters.employeeId,
        companyAccessId: filters.companyAccessId,

        leaveTypeId: filters.leaveTypeId,
        leavePolicyId: filters.leavePolicyId,

        allocationMethod: filters.allocationMethod,

        status: filters.status,

        leaveYearStart: filters.leaveYearStart,
        leaveYearEnd: filters.leaveYearEnd,
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
 * Bulk initialize leave balances.
 *
 * When employeeIds is omitted or empty,
 * the backend initializes missing balances for
 * all eligible active employees in the company.
 *
 * Existing balances are skipped safely.
 *
 * Requires:
 * leave.balance_manage
 */
    async initializeBulk(
        companyId: string,
        payload: InitializeBulkLeaveBalancesPayload,
    ): Promise<InitializeBulkLeaveBalancesResult> {
        const response = await api.post<
            ApiResponse<InitializeBulkLeaveBalancesResult>
        >(
            `/companies/${companyId}/leave/balances/initialize-bulk`,
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
 * Get aggregate leave balance totals visible to
 * the authenticated user.
 *
 * The backend applies the same scope restrictions
 * as the balance list.
 *
 * Requires:
 * leave.balance_read
 */
    async getSummary(
        companyId: string,
        filters?: LeaveBalanceSummaryFilters,
    ): Promise<LeaveBalanceSummary> {
        const response = await api.get<ApiResponse<LeaveBalanceSummary>>(
            `/companies/${companyId}/leave/balances/summary`,
            {
                params: buildSummaryParams(filters),
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
 * Credit all eligible MONTHLY_ACCRUAL leave balances
 * for a company for the selected month.
 *
 * Existing accruals are skipped safely by the backend.
 *
 * Requires:
 * leave.balance_manage
 */
    async accrueBulk(
        companyId: string,
        payload: AccrueBulkLeaveBalancesPayload,
    ): Promise<AccrueBulkLeaveBalancesResult> {
        const response = await api.post<
            ApiResponse<AccrueBulkLeaveBalancesResult>
        >(
            `/companies/${companyId}/leave/balances/accrue-bulk`,
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