import apiClient from "@/lib/axios";

import type {
    CreateWorkCategoryRequest,
    UpdateWorkCategoryRequest,
    UpdateWorkCategoryStatusRequest,
    WorkCategory,
    WorkCategoryListQuery,
    WorkCategoryListResult,
} from "../types/workCategory.types";

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

function buildWorkCategoryQuery(
    query: WorkCategoryListQuery = {},
) {
    const params = new URLSearchParams();

    if (query.page !== undefined) {
        params.set("page", String(query.page));
    }

    if (query.limit !== undefined) {
        params.set("limit", String(query.limit));
    }

    if (query.search) {
        params.set("search", query.search);
    }

    if (query.status) {
        params.set("status", query.status);
    }

    if (query.departmentId) {
        params.set("departmentId", query.departmentId);
    }

    if (query.teamId) {
        params.set("teamId", query.teamId);
    }

    if (query.sortBy) {
        params.set("sortBy", query.sortBy);
    }

    if (query.sortOrder) {
        params.set("sortOrder", query.sortOrder);
    }

    return params.toString();
}

export const workCategoryService = {
    async getWorkCategories(
        companyId: string,
        query: WorkCategoryListQuery = {},
    ): Promise<WorkCategoryListResult> {
        const queryString =
            buildWorkCategoryQuery(query);

        const url = queryString
            ? `/companies/${companyId}/work-categories?${queryString}`
            : `/companies/${companyId}/work-categories`;

        const response =
            await apiClient.get<
                ApiResponse<WorkCategoryListResult>
            >(url);

        return response.data.data;
    },

    async getWorkCategoryById(
        companyId: string,
        workCategoryId: string,
    ): Promise<WorkCategory> {
        const response =
            await apiClient.get<
                ApiResponse<WorkCategory>
            >(
                `/companies/${companyId}/work-categories/${workCategoryId}`,
            );

        return response.data.data;
    },
    /**
 * ============================================================
 * CREATE WORK CATEGORY
 *
 * POST /companies/:companyId/work-categories
 * ============================================================
 */

    async createWorkCategory(
        companyId: string,
        payload: CreateWorkCategoryRequest,
    ): Promise<WorkCategory> {
        const response = await apiClient.post<
            ApiResponse<WorkCategory>
        >(
            `/companies/${companyId}/work-categories`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ============================================================
     * UPDATE WORK CATEGORY
     *
     * PATCH /companies/:companyId/work-categories/:workCategoryId
     * ============================================================
     */

    async updateWorkCategory(
        companyId: string,
        workCategoryId: string,
        payload: UpdateWorkCategoryRequest,
    ): Promise<WorkCategory> {
        const response = await apiClient.patch<
            ApiResponse<WorkCategory>
        >(
            `/companies/${companyId}/work-categories/${workCategoryId}`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ============================================================
     * UPDATE WORK CATEGORY STATUS
     *
     * PATCH
     * /companies/:companyId/work-categories/:workCategoryId/status
     * ============================================================
     */

    async updateWorkCategoryStatus(
        companyId: string,
        workCategoryId: string,
        payload: UpdateWorkCategoryStatusRequest,
    ): Promise<WorkCategory> {
        const response = await apiClient.patch<
            ApiResponse<WorkCategory>
        >(
            `/companies/${companyId}/work-categories/${workCategoryId}/status`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ============================================================
     * DELETE WORK CATEGORY
     *
     * Soft delete.
     *
     * DELETE
     * /companies/:companyId/work-categories/:workCategoryId
     * ============================================================
     */

    async deleteWorkCategory(
        companyId: string,
        workCategoryId: string,
    ): Promise<{
        workCategoryId: string;
        deletedAt: string;
    }> {
        const response = await apiClient.delete<
            ApiResponse<{
                workCategoryId: string;
                deletedAt: string;
            }>
        >(
            `/companies/${companyId}/work-categories/${workCategoryId}`,
        );

        return response.data.data;
    },
};