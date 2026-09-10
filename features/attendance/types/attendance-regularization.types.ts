export type AttendanceRegularizationRequestType =
    | "MISSING_CHECK_IN"
    | "MISSING_CHECKOUT"
    | "CHECK_IN_TIME_CORRECTION"
    | "CHECKOUT_TIME_CORRECTION"
    | "BREAK_CORRECTION"
    | "BREAK_EXTENSION"
    | "OTHER";

export type AttendanceRegularizationStatus =
    | "PENDING"
    | "RECOMMENDED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export type AttendanceRegularizationApplicationStatus =
    | "NOT_APPLIED"
    | "APPLIED"
    | "FAILED";

export interface RegularizationLocationEvidence {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    capturedAt?: string | null;
    attendanceLocationId?: string | null;
    addressText?: string;
}

export interface AttendanceRegularizationUserReference {
    _id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface AttendanceRegularizationCompanyAccessReference {
    _id: string;
    employeeCode?: string;
    designation?: string;
    attendanceMode?: string;
    departmentId?: {
        _id: string;
        name?: string;
        code?: string;
        status?: string;
    } | null;
    teamId?: {
        _id: string;
        name?: string;
        code?: string;
        status?: string;
    } | null;
    roleId?: {
        _id: string;
        name?: string;
        code?: string;
        scopeType?: string;
        status?: string;
    } | null;
}

export interface AttendanceRegularizationEmployeeReference {
    _id: string;
    status?: string;

    userId?:
    | AttendanceRegularizationUserReference
    | string
    | null;
}

export interface AttendanceRegularizationAttendanceReference {
    _id: string;
    attendanceDate?: string;
    attendanceMode?: string;

    firstCheckInAt?: string | null;
    lastCheckOutAt?: string | null;

    totalWorkedMinutes?: number;
    totalBreakMinutes?: number;

    attendanceStatus?: string;
    calculationStatus?: string;
    payrollStatus?: string;
    payrollPeriod?: string | null;
}

export interface AttendanceRegularization {
    _id: string;

    companyId: string;

    attendanceId:
    | AttendanceRegularizationAttendanceReference
    | string
    | null;

    companyAccessId:
    | AttendanceRegularizationCompanyAccessReference
    | string;

    employeeId:
    | AttendanceRegularizationEmployeeReference
    | string;

    attendanceDate: string;

    targetWorkSessionId?: string | null;
    targetBreakId?: string | null;

    requestType: AttendanceRegularizationRequestType;

    requestedCheckInAt?: string | null;
    requestedCheckOutAt?: string | null;

    requestedBreakStartAt?: string | null;
    requestedBreakEndAt?: string | null;

    requestedBreakExtensionMinutes?: number | null;

    originalCheckInAt?: string | null;
    originalCheckOutAt?: string | null;

    originalBreakStartAt?: string | null;
    originalBreakEndAt?: string | null;

    originalBreakDurationMinutes?: number | null;

    locationEvidence?: RegularizationLocationEvidence | null;

    reason: string;
    attachmentUrl?: string;

    status: AttendanceRegularizationStatus;

    recommendedBy?:
    | AttendanceRegularizationUserReference
    | string
    | null;

    recommendedAt?: string | null;
    recommendationNote?: string;

    approvedBy?:
    | AttendanceRegularizationUserReference
    | string
    | null;

    approvedAt?: string | null;
    approvalNote?: string;

    rejectedBy?:
    | AttendanceRegularizationUserReference
    | string
    | null;

    rejectedAt?: string | null;
    rejectionReason?: string;

    cancelledBy?:
    | AttendanceRegularizationUserReference
    | string
    | null;

    cancelledAt?: string | null;
    cancellationReason?: string;

    applicationStatus: AttendanceRegularizationApplicationStatus;

    appliedAt?: string | null;

    appliedBy?:
    | AttendanceRegularizationUserReference
    | string
    | null;

    applicationError?: string;

    affectsFinalizedPayroll?: boolean;
    payrollAdjustmentRequired?: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface CreateAttendanceRegularizationPayload {
    attendanceId: string;

    targetWorkSessionId?: string | null;
    targetBreakId?: string | null;

    requestType: AttendanceRegularizationRequestType;

    requestedCheckInAt?: string | null;
    requestedCheckOutAt?: string | null;

    requestedBreakStartAt?: string | null;
    requestedBreakEndAt?: string | null;

    requestedBreakExtensionMinutes?: number | null;

    locationEvidence?: RegularizationLocationEvidence | null;

    reason: string;

    attachmentUrl?: string;
}

export interface AttendanceRegularizationListQuery {
    page?: number;
    limit?: number;

    employeeId?: string;
    companyAccessId?: string;
    attendanceId?: string;

    status?: AttendanceRegularizationStatus;

    requestType?: AttendanceRegularizationRequestType;

    fromDate?: string;
    toDate?: string;
}

export interface AttendanceRegularizationPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface AttendanceRegularizationListResponse {
    items: AttendanceRegularization[];

    pagination: AttendanceRegularizationPagination;
}

export interface RecommendAttendanceRegularizationPayload {
    note?: string;
}

export interface ApproveAttendanceRegularizationPayload {
    note?: string;
}

export interface RejectAttendanceRegularizationPayload {
    reason: string;
}

export interface CancelAttendanceRegularizationPayload {
    reason?: string;
}