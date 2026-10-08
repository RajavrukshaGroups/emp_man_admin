import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CreateWorkCalendarDayPayload,
    CreateWorkCalendarPayload,
    ResolvedWorkDay,
    UpdateWorkCalendarDayPayload,
    UpdateWorkCalendarPayload,
    WorkCalendar,
    WorkCalendarDay,
    WorkCalendarDayFilters,
    WorkCalendarDayListResponse,
    WorkCalendarFilters,
    WorkCalendarListResponse,
    WorkCalendarRange,
} from "../types/work-calendar.types";


/* ============================================================
   QUERY BUILDERS
   ============================================================ */

function buildWorkCalendarParams(filters?: WorkCalendarFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        status: filters.status,
        isDefault: filters.isDefault,
        effectiveDate: filters.effectiveDate,
    };
}


function buildWorkCalendarDayParams(filters?: WorkCalendarDayFilters) {
    if (!filters) {
        return undefined;
    }

    return {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        type: filters.type,
        status: filters.status,
    };
}


/* ============================================================
   SERVICE
   ============================================================ */

export const workCalendarService = {

    // ============================================================
    // WORK CALENDARS
    // ============================================================

    /**
     * Create a company work calendar.
     *
     * Requires:
     * calendar.manage
     */
    async create(
        companyId: string,
        payload: CreateWorkCalendarPayload,
    ): Promise<WorkCalendar> {
        const response = await apiClient.post<
            ApiResponse<WorkCalendar>
        >(
            `/companies/${companyId}/work-calendars`,
            payload,
        );

        return response.data.data;
    },


    /**
     * List company work calendars.
     *
     * Requires:
     * calendar.read
     */
    async list(
        companyId: string,
        filters?: WorkCalendarFilters,
    ): Promise<WorkCalendarListResponse> {
        const response = await apiClient.get<
            ApiResponse<WorkCalendarListResponse>
        >(
            `/companies/${companyId}/work-calendars`,
            {
                params: buildWorkCalendarParams(filters),
            },
        );

        return response.data.data;
    },


    /**
     * Get one work calendar.
     */
    async getById(
        companyId: string,
        calendarId: string,
    ): Promise<WorkCalendar> {
        const response = await apiClient.get<
            ApiResponse<WorkCalendar>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}`,
        );

        return response.data.data;
    },


    /**
     * Update a work calendar.
     *
     * Requires:
     * calendar.manage
     */
    async update(
        companyId: string,
        calendarId: string,
        payload: UpdateWorkCalendarPayload,
    ): Promise<WorkCalendar> {
        const response = await apiClient.patch<
            ApiResponse<WorkCalendar>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}`,
            payload,
        );

        return response.data.data;
    },


    // ============================================================
    // CALENDAR DAYS
    // ============================================================

    /**
     * Create a holiday or working-day override.
     *
     * The frontend does not send isWorkingDay.
     * Backend derives it from the selected day type.
     */
    async createDay(
        companyId: string,
        calendarId: string,
        payload: CreateWorkCalendarDayPayload,
    ): Promise<WorkCalendarDay> {
        const response = await apiClient.post<
            ApiResponse<WorkCalendarDay>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}/days`,
            payload,
        );

        return response.data.data;
    },


    /**
     * List configured calendar days for one work calendar.
     */
    async listDays(
        companyId: string,
        calendarId: string,
        filters?: WorkCalendarDayFilters,
    ): Promise<WorkCalendarDayListResponse> {
        const response = await apiClient.get<
            ApiResponse<WorkCalendarDayListResponse>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}/days`,
            {
                params: buildWorkCalendarDayParams(filters),
            },
        );

        return response.data.data;
    },


    /**
     * Get one configured calendar day.
     */
    async getDayById(
        companyId: string,
        calendarId: string,
        calendarDayId: string,
    ): Promise<WorkCalendarDay> {
        const response = await apiClient.get<
            ApiResponse<WorkCalendarDay>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}/days/${calendarDayId}`,
        );

        return response.data.data;
    },


    /**
     * Update a holiday or working-day override.
     */
    async updateDay(
        companyId: string,
        calendarId: string,
        calendarDayId: string,
        payload: UpdateWorkCalendarDayPayload,
    ): Promise<WorkCalendarDay> {
        const response = await apiClient.patch<
            ApiResponse<WorkCalendarDay>
        >(
            `/companies/${companyId}/work-calendars/${calendarId}/days/${calendarDayId}`,
            payload,
        );

        return response.data.data;
    },


    // ============================================================
    // RESOLVER
    // ============================================================

    /**
     * Resolve one logical company date.
     *
     * Backend is authoritative for:
     * - normal working day
     * - weekly off
     * - holiday
     * - working-day override
     */
    async resolveDate(
        companyId: string,
        date: string,
    ): Promise<ResolvedWorkDay> {
        const response = await apiClient.get<
            ApiResponse<ResolvedWorkDay>
        >(
            `/companies/${companyId}/work-calendars/resolve`,
            {
                params: {
                    date,
                },
            },
        );

        return response.data.data;
    },


    /**
     * Resolve a date range.
     *
     * Useful for:
     * - leave calendar
     * - attendance calendar
     * - holiday / weekly-off visualization
     *
     * Do not calculate weekly offs independently in frontend.
     */
    async resolveRange(
        companyId: string,
        fromDate: string,
        toDate: string,
    ): Promise<WorkCalendarRange> {
        const response = await apiClient.get<
            ApiResponse<WorkCalendarRange>
        >(
            `/companies/${companyId}/work-calendars/range`,
            {
                params: {
                    fromDate,
                    toDate,
                },
            },
        );

        return response.data.data;
    },
};