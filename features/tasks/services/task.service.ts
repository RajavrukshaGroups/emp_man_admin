import apiClient from "@/lib/axios";

import type {
    CancelTaskRequest,
    CompleteTaskRequest,
    CreateTaskRequest,
    ReassignTaskRequest,
    ReopenTaskRequest,
    SubmitTaskRequest,
    Task,
    TaskActivityListResult,
    TaskListQuery,
    TaskListResult,
    UpdateTaskProgressRequest,
    UpdateTaskRequest,
} from "../types/task.types";
interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

/**
 * ============================================================
 * BUILD TASK QUERY
 * ============================================================
 */

function buildTaskQuery(query: TaskListQuery = {}) {
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

    if (query.priority) {
        params.set("priority", query.priority);
    }

    if (query.clientId) {
        params.set("clientId", query.clientId);
    }

    if (query.departmentId) {
        params.set("departmentId", query.departmentId);
    }

    if (query.teamId) {
        params.set("teamId", query.teamId);
    }

    if (query.workCategoryId) {
        params.set("workCategoryId", query.workCategoryId);
    }

    if (query.assigneeId) {
        params.set("assigneeId", query.assigneeId);
    }

    if (query.assignedById) {
        params.set("assignedById", query.assignedById);
    }

    if (query.dueDateFrom) {
        params.set("dueDateFrom", query.dueDateFrom);
    }

    if (query.dueDateTo) {
        params.set("dueDateTo", query.dueDateTo);
    }

    if (query.overdue !== undefined) {
        params.set("overdue", String(query.overdue));
    }

    if (query.sortBy) {
        params.set("sortBy", query.sortBy);
    }

    if (query.sortOrder) {
        params.set("sortOrder", query.sortOrder);
    }

    return params.toString();
}

export const taskService = {
    /**
     * ==========================================================
     * LIST TASKS
     *
     * GET /companies/:companyId/tasks
     * ==========================================================
     */

    async getTasks(
        companyId: string,
        query: TaskListQuery = {},
    ): Promise<TaskListResult> {
        const queryString = buildTaskQuery(query);

        const url = queryString
            ? `/companies/${companyId}/tasks?${queryString}`
            : `/companies/${companyId}/tasks`;

        const response =
            await apiClient.get<ApiResponse<TaskListResult>>(url);

        return response.data.data;
    },

    /**
     * ==========================================================
     * GET TASK
     *
     * GET /companies/:companyId/tasks/:taskId
     * ==========================================================
     */

    async getTaskById(
        companyId: string,
        taskId: string,
    ): Promise<Task> {
        const response = await apiClient.get<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}`,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * GET TASK ACTIVITY
     *
     * Jira-style ticket timeline.
     *
     * GET /companies/:companyId/tasks/:taskId/activities
     * ==========================================================
     */

    async getTaskActivities(
        companyId: string,
        taskId: string,
    ): Promise<TaskActivityListResult> {
        const response =
            await apiClient.get<ApiResponse<TaskActivityListResult>>(
                `/companies/${companyId}/tasks/${taskId}/activities`,
            );

        return response.data.data;
    },

    /**
     * ==========================================================
     * CREATE TASK
     *
     * POST /companies/:companyId/tasks
     * ==========================================================
     */

    async createTask(
        companyId: string,
        payload: CreateTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.post<ApiResponse<Task>>(
            `/companies/${companyId}/tasks`,
            payload,
        );

        return response.data.data;
    },

    /**
     * UPDATE TASK METADATA
     *
     * Editable while ASSIGNED:
     * - client
     * - work category
     * - title
     * - description
     * - quantity
     * - priority
     * - due date
     *
     * Once work has started, backend restricts
     * structural field changes.
     */
    async updateTask(
        companyId: string,
        taskId: string,
        payload: UpdateTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}`,
            payload,
        );

        return response.data.data;
    },

    /**
 * ==========================================================
 * REASSIGN TASK
 *
 * Transfers the current ticket to another employee.
 *
 * Existing:
 * - status
 * - progress
 * - start date
 * - work note
 * - ticket history
 *
 * are preserved by the backend.
 *
 * PATCH /companies/:companyId/tasks/:taskId/reassign
 * ==========================================================
 */

    async reassignTask(
        companyId: string,
        taskId: string,
        payload: ReassignTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/reassign`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * START TASK
     *
     * ASSIGNED → IN_PROGRESS
     * REOPENED → IN_PROGRESS
     *
     * PATCH /companies/:companyId/tasks/:taskId/start
     * ==========================================================
     */

    async startTask(
        companyId: string,
        taskId: string,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/start`,
            {},
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * UPDATE PROGRESS
     *
     * PATCH /companies/:companyId/tasks/:taskId/progress
     * ==========================================================
     */

    async updateTaskProgress(
        companyId: string,
        taskId: string,
        payload: UpdateTaskProgressRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/progress`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * SUBMIT TASK
     *
     * IN_PROGRESS → SUBMITTED
     *
     * Frontend label:
     * "Submit for review"
     *
     * PATCH /companies/:companyId/tasks/:taskId/submit
     * ==========================================================
     */

    async submitTask(
        companyId: string,
        taskId: string,
        payload: SubmitTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/submit`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * COMPLETE TASK
     *
     * SUBMITTED → COMPLETED
     *
     * Team Lead / authorized manager.
     *
     * PATCH /companies/:companyId/tasks/:taskId/complete
     * ==========================================================
     */

    async completeTask(
        companyId: string,
        taskId: string,
        payload: CompleteTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/complete`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * REOPEN TASK
     *
     * SUBMITTED → REOPENED
     * COMPLETED → REOPENED
     *
     * PATCH /companies/:companyId/tasks/:taskId/reopen
     * ==========================================================
     */

    async reopenTask(
        companyId: string,
        taskId: string,
        payload: ReopenTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/reopen`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * CANCEL TASK
     *
     * PATCH /companies/:companyId/tasks/:taskId/cancel
     * ==========================================================
     */

    async cancelTask(
        companyId: string,
        taskId: string,
        payload: CancelTaskRequest,
    ): Promise<Task> {
        const response = await apiClient.patch<ApiResponse<Task>>(
            `/companies/${companyId}/tasks/${taskId}/cancel`,
            payload,
        );

        return response.data.data;
    },

    /**
     * ==========================================================
     * DELETE TASK
     *
     * Soft delete only.
     *
     * DELETE /companies/:companyId/tasks/:taskId
     * ==========================================================
     */

    async deleteTask(
        companyId: string,
        taskId: string,
    ): Promise<{
        taskId: string;
        deletedAt: string;
    }> {
        const response = await apiClient.delete<
            ApiResponse<{
                taskId: string;
                deletedAt: string;
            }>
        >(`/companies/${companyId}/tasks/${taskId}`);

        return response.data.data;
    },
};