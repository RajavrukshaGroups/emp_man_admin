export type LeaveStatus = "ACTIVE" | "INACTIVE";

export type LeavePaymentType = "PAID" | "UNPAID";

export type LeaveAllocationMethod =
    | "ANNUAL_UPFRONT"
    | "MONTHLY_ACCRUAL"
    | "MANUAL"
    | "NO_BALANCE";

export type LeaveApprovalWorkflow =
    | "DIRECT_APPROVAL"
    | "RECOMMEND_THEN_APPROVE";

export type LeaveProrationRounding =
    | "DOWN_TO_HALF"
    | "NEAREST_HALF"
    | "UP_TO_HALF";

export type LeaveSandwichRule =
    | "NONE"
    | "COUNT_INTERVENING_NON_WORKING_DAYS";

export type LeaveRequestStatus =
    | "PENDING"
    | "RECOMMENDED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export type LeaveCancellationStatus =
    | "NOT_REQUESTED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export type LeaveBalanceStatus = "ACTIVE" | "CLOSED";

export type LeaveBalanceApplicationStatus =
    | "NOT_REQUIRED"
    | "PENDING_RESERVATION"
    | "RESERVED"
    | "CONSUMED"
    | "RELEASED"
    | "FAILED";

export type LeaveAttendanceApplicationStatus =
    | "NOT_APPLIED"
    | "APPLIED"
    | "FAILED"
    | "REVERSED";

export type LeaveDayPortion =
    | "FULL_DAY"
    | "FIRST_HALF"
    | "SECOND_HALF";

export type LeaveDateDayPortion =
    | LeaveDayPortion
    | "NOT_APPLICABLE";

export type LeaveDayClassification =
    | "WORKING_DAY"
    | "WEEKLY_OFF"
    | "PUBLIC_HOLIDAY";

/* =========================================================
   COMMON REFERENCES
   ========================================================= */

export interface LeaveUserReference {
    _id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface LeaveEmployeeReference {
    _id: string;
    employeeCode?: string;
    designation?: string;

    userId?: string | LeaveUserReference;
}

export interface LeaveDepartmentReference {
    _id: string;
    name?: string;
    code?: string;
}

export interface LeaveTeamReference {
    _id: string;
    name?: string;
    code?: string;
}

export interface LeaveCompanyAccessReference {
    _id: string;
    employeeCode?: string;
    designation?: string;

    userId?: string | LeaveUserReference;

    departmentId?: string | LeaveDepartmentReference | null;
    teamId?: string | LeaveTeamReference | null;
}

/* =========================================================
   LEAVE TYPE
   ========================================================= */

export interface LeaveType {
    _id: string;

    companyId: string;

    name: string;
    code: string;
    description: string;

    paymentType: LeavePaymentType;

    requiresBalance: boolean;

    annualEntitlementDays: number;

    allocationMethod: LeaveAllocationMethod;

    monthlyEntitlementDays: number;

    maximumMonthlyUsageDays: number | null;

    allowMonthlyAccumulation: boolean;

    allowHalfDay: boolean;

    minimumServiceDays: number;

    minimumNoticeDays: number;

    maximumConsecutiveDays: number | null;

    allowBackdatedApplication: boolean;

    maximumBackdatedDays: number;

    requireAttachment: boolean;

    attachmentRequiredFromDays: number | null;

    allowNegativeBalance: boolean;

    carryForwardEnabled: boolean;

    maximumCarryForwardDays: number;

    effectiveFrom: string;
    effectiveTo: string | null;

    status: LeaveStatus;

    createdBy?: string | LeaveUserReference | null;
    updatedBy?: string | LeaveUserReference | null;

    createdAt: string;
    updatedAt: string;
}

/* =========================================================
   LEAVE POLICY
   ========================================================= */

export interface LeavePolicy {
    _id: string;

    companyId: string;

    name: string;
    code: string;
    description: string;

    leaveYearStartMonth: number;
    leaveYearStartDay: number;

    excludeWeeklyOffsFromLeaveDays: boolean;
    excludePublicHolidaysFromLeaveDays: boolean;

    sandwichRule: LeaveSandwichRule;

    approvalWorkflow: LeaveApprovalWorkflow;

    allowApprovalWithoutRecommendation: boolean;

    preventOverlappingRequests: boolean;
    preventAttendanceConflict: boolean;

    maximumFutureApplicationDays: number | null;

    requireReason: boolean;

    autoCreateLeaveBalances: boolean;

    reserveBalanceOnSubmission: boolean;

    prorateEntitlementForNewJoiners: boolean;

    prorationRounding: LeaveProrationRounding;

    allowEmployeeCancelPending: boolean;
    allowEmployeeCancelRecommended: boolean;

    allowApprovedLeaveCancellation: boolean;

    approvedCancellationRequiresApproval: boolean;

    effectiveFrom: string;
    effectiveTo: string | null;

    isDefault: boolean;

    status: LeaveStatus;

    createdBy?: string | LeaveUserReference | null;
    updatedBy?: string | LeaveUserReference | null;

    createdAt: string;
    updatedAt: string;
}

/* =========================================================
   LEAVE BALANCE
   ========================================================= */

export interface LeaveMonthlyBalance {
    periodKey: string;

    creditedDays: number;
    adjustedDays: number;
    pendingDays: number;
    usedDays: number;
    lapsedDays: number;
}

export interface LeaveBalanceAdjustment {
    _id: string;

    adjustmentDays: number;

    reason: string;

    adjustedBy: string | LeaveUserReference;

    adjustedAt: string;
}

export interface LeaveBalance {
    _id: string;

    companyId: string;

    employeeId: string | LeaveEmployeeReference;

    companyAccessId: string | LeaveCompanyAccessReference;

    leaveTypeId: string | LeaveType;

    leavePolicyId: string | LeavePolicy;

    leaveYearStart: string;
    leaveYearEnd: string;
    leaveYearLabel: string;

    allocationMethod: LeaveAllocationMethod;

    allocatedDays: number;
    accruedDays: number;
    carriedForwardDays: number;
    adjustedDays: number;

    pendingDays: number;
    usedDays: number;
    lapsedDays: number;

    availableDays: number;

    monthlyBalances: LeaveMonthlyBalance[];

    adjustmentHistory: LeaveBalanceAdjustment[];

    lastAccruedPeriodKey: string | null;

    status: LeaveBalanceStatus;

    closedAt: string | null;

    createdBy?: string | LeaveUserReference | null;
    updatedBy?: string | LeaveUserReference | null;

    createdAt: string;
    updatedAt: string;
}

/* =========================================================
   LEAVE REQUEST
   ========================================================= */

export interface LeaveDateDetail {
    date: string;

    dayPortion: LeaveDateDayPortion;

    dayClassification: LeaveDayClassification;

    leaveDays: number;

    countedAsLeave: boolean;

    attendanceId: string | null;
}

export interface LeaveBalanceAllocation {
    periodKey: string | null;
    days: number;
}

export interface LeaveStatusHistory {
    _id: string;

    fromStatus: LeaveRequestStatus | null;
    toStatus: LeaveRequestStatus;

    changedBy: string | LeaveUserReference;

    note: string;

    changedAt: string;
}

export interface LeaveRequest {
    _id: string;

    companyId: string;

    employeeId: string | LeaveEmployeeReference;

    companyAccessId: string | LeaveCompanyAccessReference;

    departmentId: string | LeaveDepartmentReference | null;

    teamId: string | LeaveTeamReference | null;

    reportingManagerId:
    | string
    | LeaveCompanyAccessReference
    | null;

    leaveTypeId: string | LeaveType;

    leavePolicyId: string | LeavePolicy;

    leaveBalanceId: string | LeaveBalance | null;

    balanceAllocations: LeaveBalanceAllocation[];

    leaveTypeName: string;
    leaveTypeCode: string;

    paymentType: LeavePaymentType;

    fromDate: string;
    toDate: string;

    startDayPortion: LeaveDayPortion;
    endDayPortion: LeaveDayPortion;

    dateDetails: LeaveDateDetail[];

    requestedDays: number;

    reason: string;

    attachmentUrl: string;

    status: LeaveRequestStatus;

    recommendedBy: string | LeaveUserReference | null;
    recommendedAt: string | null;
    recommendationNote: string;

    approvedBy: string | LeaveUserReference | null;
    approvedAt: string | null;
    approvalNote: string;

    rejectedBy: string | LeaveUserReference | null;
    rejectedAt: string | null;
    rejectionReason: string;

    cancelledBy: string | LeaveUserReference | null;
    cancelledAt: string | null;
    cancellationReason: string;

    cancellationStatus: LeaveCancellationStatus;

    cancellationRequestedBy: string | LeaveUserReference | null;
    cancellationRequestedAt: string | null;
    cancellationRequestReason: string;

    cancellationReviewedBy: string | LeaveUserReference | null;
    cancellationReviewedAt: string | null;
    cancellationReviewNote: string;

    balanceStatus: LeaveBalanceApplicationStatus;

    balanceError: string;

    attendanceApplicationStatus: LeaveAttendanceApplicationStatus;

    attendanceAppliedAt: string | null;
    attendanceAppliedBy: string | LeaveUserReference | null;
    attendanceApplicationError: string;

    payrollAdjustmentRequired: boolean;

    statusHistory: LeaveStatusHistory[];

    createdBy: string | LeaveUserReference;
    updatedBy: string | LeaveUserReference | null;

    createdAt: string;
    updatedAt: string;
}

/* =========================================================
   REQUEST PAYLOADS
   ========================================================= */

export interface CreateLeaveRequestPayload {
    leaveTypeId: string;

    fromDate: string;
    toDate: string;

    startDayPortion?: LeaveDayPortion;
    endDayPortion?: LeaveDayPortion;

    reason: string;

    attachmentUrl?: string;
}

export interface LeaveActionPayload {
    note?: string;
}

export interface RejectLeavePayload {
    reason: string;
}

export interface CancelLeavePayload {
    reason: string;
}

export interface LeaveCancellationRequestPayload {
    reason: string;
}

/* =========================================================
   LIST / FILTER TYPES
   ========================================================= */

export interface LeaveRequestFilters {
    page?: number;
    limit?: number;

    status?: LeaveRequestStatus;

    cancellationStatus?: LeaveCancellationStatus;

    employeeId?: string;
    departmentId?: string;
    teamId?: string;

    leaveTypeId?: string;

    fromDate?: string;
    toDate?: string;
}

export interface LeaveTypeFilters {
    page?: number;
    limit?: number;

    search?: string;

    status?: LeaveStatus;
}

export interface LeaveBalanceFilters {
    page?: number;
    limit?: number;

    employeeId?: string;
    leaveTypeId?: string;

    status?: LeaveBalanceStatus;

    leaveYearStart?: string;
}

/* =========================================================
   GENERIC PAGINATED RESPONSE
   ========================================================= */

export interface LeavePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface LeavePaginatedResponse<T> {
    items: T[];
    pagination: LeavePagination;
}