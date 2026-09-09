export type AttendanceShiftStatus = "ACTIVE" | "INACTIVE";

export interface AttendanceShift {
    _id: string;
    companyId: string;

    name: string;
    code: string;
    description?: string;

    startTime: string;
    endTime: string;

    isOvernight: boolean;

    fullDayMinutes: number;
    halfDayMinutes: number;

    lateGraceMinutes: number;
    earlyCheckoutGraceMinutes: number;

    standardBreakMinutes: number;
    maxBreakMinutes: number;

    allowMultipleBreaks: boolean;

    workingDays: number[];

    effectiveFrom?: string | null;
    effectiveTo?: string | null;

    status: AttendanceShiftStatus;

    workingHours?: number;

    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAttendanceShiftPayload {
    name: string;
    code: string;
    description?: string;

    startTime: string;
    endTime: string;

    isOvernight?: boolean;

    fullDayMinutes: number;
    halfDayMinutes: number;

    lateGraceMinutes?: number;
    earlyCheckoutGraceMinutes?: number;

    standardBreakMinutes?: number;
    maxBreakMinutes?: number;

    allowMultipleBreaks?: boolean;

    workingDays?: number[];

    effectiveFrom?: string | null;
    effectiveTo?: string | null;

    status?: AttendanceShiftStatus;
}

export type UpdateAttendanceShiftPayload =
    Partial<CreateAttendanceShiftPayload>;

export interface AttendanceShiftListQuery {
    page?: number;
    limit?: number;

    status?: AttendanceShiftStatus;

    search?: string;

    effectiveOn?: string;
}

export interface AttendanceShiftPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface AttendanceShiftListResponse {
    items: AttendanceShift[];

    pagination: AttendanceShiftPagination;
}