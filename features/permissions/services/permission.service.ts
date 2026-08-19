import apiClient from "@/lib/axios";

import type { Permission } from "../types/permission.types";

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export const permissionService = {
    /**
     * GET /permissions
     *
     * Retrieves all active system permissions.
     */
    async getPermissions(): Promise<Permission[]> {
        const response = await apiClient.get<ApiResponse<Permission[]>>(
            "/permissions",
        );

        return response.data.data;
    },
};