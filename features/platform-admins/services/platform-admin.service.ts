import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CreatePlatformAdminPayload,
    PlatformAdmin,
    PlatformAdminListData,
    PlatformAdminListParams,
    PlatformAdminStatus,
    PlatformRoleListData,
    ResetPlatformAdminPasswordPayload,
    ResetPlatformAdminPasswordResponse,
    UpdatePlatformAdminPayload,
} from "../types/platform-admin.types";

export const platformAdminService = {
    /**
     * List Platform Administrators.
     */
    async getPlatformAdmins(
        params: PlatformAdminListParams = {},
    ): Promise<PlatformAdminListData> {
        const response = await apiClient.get<
            ApiResponse<PlatformAdminListData>
        >("/platform/admins", {
            params,
        });

        return response.data.data;
    },

    /**
 * Get active GLOBAL platform roles.
 */
    async getPlatformRoles(): Promise<PlatformRoleListData> {
        const response = await apiClient.get<
            ApiResponse<PlatformRoleListData>
        >("/platform/roles");

        return response.data.data;
    },

    /**
     * Get one Platform Administrator.
     */
    async getPlatformAdminById(
        platformAccessId: string,
    ): Promise<PlatformAdmin> {
        const response = await apiClient.get<
            ApiResponse<PlatformAdmin>
        >(`/platform/admins/${platformAccessId}`);

        return response.data.data;
    },

    /**
     * Create Platform Administrator.
     */
    async createPlatformAdmin(
        payload: CreatePlatformAdminPayload,
    ): Promise<PlatformAdmin> {
        const response = await apiClient.post<
            ApiResponse<PlatformAdmin>
        >("/platform/admins", payload);

        return response.data.data;
    },

    /**
     * Update Platform Administrator.
     */
    async updatePlatformAdmin(
        platformAccessId: string,
        payload: UpdatePlatformAdminPayload,
    ): Promise<PlatformAdmin> {
        const response = await apiClient.patch<
            ApiResponse<PlatformAdmin>
        >(
            `/platform/admins/${platformAccessId}`,
            payload,
        );

        return response.data.data;
    },

    /**
     * Activate / deactivate / suspend Platform Administrator.
     */
    async updatePlatformAdminStatus(
        platformAccessId: string,
        status: PlatformAdminStatus,
    ): Promise<PlatformAdmin> {
        const response = await apiClient.patch<
            ApiResponse<PlatformAdmin>
        >(
            `/platform/admins/${platformAccessId}/status`,
            {
                status,
            },
        );

        return response.data.data;
    },

    /**
     * Reset Platform Administrator password.
     */
    async resetPlatformAdminPassword(
        platformAccessId: string,
        payload: ResetPlatformAdminPasswordPayload,
    ): Promise<ResetPlatformAdminPasswordResponse> {
        const response = await apiClient.patch<
            ApiResponse<ResetPlatformAdminPasswordResponse>
        >(
            `/platform/admins/${platformAccessId}/reset-password`,
            payload,
        );

        return response.data.data;
    },
};