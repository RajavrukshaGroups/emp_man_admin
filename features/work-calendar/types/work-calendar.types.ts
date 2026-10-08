export type WorkCalendarStatus = "ACTIVE" | "INACTIVE";

export type WorkCalendarDayType =
    | "PUBLIC_HOLIDAY"
    | "COMPANY_HOLIDAY"
    | "FESTIVAL_HOLIDAY"
    | "SPECIAL_HOLIDAY"
    | "WORKING_DAY_OVERRIDE";

export type WorkDayClassification =
    | "WORKING_DAY"
    | "WEEKLY_OFF"
    | "HOLIDAY";

export type WorkDaySource =
    | "WEEKLY_RULE"
    | "CALENDAR_DAY"
    | "WORKING_DAY_OVERRIDE";


/* ============================================================
   WORK CALENDAR
   ============================================================ */

export interface WorkCalendar {
    _id: string;

    companyId: string;

    name: string;
    code: string;
    description: string;

    /**
     * JavaScript weekday numbering:
     * 0 = Sunday
     * 1 = Monday
     * ...
     * 6 = Saturday
     */
    weeklyOffDays: number[];

    effectiveFrom: string;
    effectiveTo: string | null;

    isDefault: boolean;

    status: WorkCalendarStatus;

    createdBy?: string | null;
    updatedBy?: string | null;

    createdAt: string;
    updatedAt: string;
}


/* ============================================================
   CALENDAR DAY
   ============================================================ */

export interface WorkCalendarDay {
    _id: string;

    companyId: string;
    workCalendarId: string;

    /**
     * Logical company date: YYYY-MM-DD
     */
    date: string;

    type: WorkCalendarDayType;

    name: string;
    description: string;

    /**
     * Derived by backend.
     *
     * WORKING_DAY_OVERRIDE => true
     * Holiday types        => false
     */
    isWorkingDay: boolean;

    status: WorkCalendarStatus;

    createdBy?: string | null;
    updatedBy?: string | null;

    createdAt: string;
    updatedAt: string;
}


/* ============================================================
   RESOLVED WORK DAY
   ============================================================ */

export interface ResolvedWorkDay {
    date: string;

    isWorkingDay: boolean;

    classification: WorkDayClassification;

    source: WorkDaySource;

    name: string | null;

    holidayType: WorkCalendarDayType | null;

    workCalendarId: string;
}


/* ============================================================
   RESOLVED RANGE
   ============================================================ */

export interface WorkCalendarRangeSummary {
    totalDays: number;
    workingDays: number;
    nonWorkingDays: number;
}

export interface WorkCalendarRange {
    fromDate: string;
    toDate: string;

    days: ResolvedWorkDay[];

    summary: WorkCalendarRangeSummary;
}


/* ============================================================
   CREATE / UPDATE CALENDAR
   ============================================================ */

export interface CreateWorkCalendarPayload {
    name: string;
    code: string;

    description?: string;

    weeklyOffDays: number[];

    effectiveFrom: string;
    effectiveTo?: string | null;

    isDefault?: boolean;

    status?: WorkCalendarStatus;
}

export interface UpdateWorkCalendarPayload {
    name?: string;
    code?: string;

    description?: string;

    weeklyOffDays?: number[];

    effectiveFrom?: string;
    effectiveTo?: string | null;

    isDefault?: boolean;

    status?: WorkCalendarStatus;
}


/* ============================================================
   CREATE / UPDATE CALENDAR DAY
   ============================================================ */

export interface CreateWorkCalendarDayPayload {
    date: string;

    type: WorkCalendarDayType;

    name: string;

    description?: string;

    status?: WorkCalendarStatus;
}

export interface UpdateWorkCalendarDayPayload {
    date?: string;

    type?: WorkCalendarDayType;

    name?: string;

    description?: string;

    status?: WorkCalendarStatus;
}


/* ============================================================
   LIST FILTERS
   ============================================================ */

export interface WorkCalendarFilters {
    status?: WorkCalendarStatus;

    isDefault?: boolean;

    effectiveDate?: string;
}

export interface WorkCalendarDayFilters {
    fromDate?: string;
    toDate?: string;

    type?: WorkCalendarDayType;

    status?: WorkCalendarStatus;
}


/* ============================================================
   PAGINATION
   ============================================================ */

export interface WorkCalendarPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface WorkCalendarListResponse {
    items: WorkCalendar[];
    pagination: WorkCalendarPagination;
}

export interface WorkCalendarDayListResponse {
    items: WorkCalendarDay[];
    pagination: WorkCalendarPagination;
}