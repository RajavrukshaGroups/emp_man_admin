import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CreateRolePayload,
    Permission,
    Role,
    RoleListData,
    RoleListParams,
} from "../types/role.types";

export const roleService = {
    async getRoles(
        companyId: string,
        params: RoleListParams = {},
    ): Promise<RoleListData> {
        const response = await apiClient.get<
            ApiResponse<RoleListData>
        >(
            `/companies/${companyId}/roles`,
            {
                params,
            },
        );

        return response.data.data;
    },

    async getRoleById(
        companyId: string,
        roleId: string,
    ): Promise<Role> {
        const response = await apiClient.get<
            ApiResponse<Role>
        >(
            `/companies/${companyId}/roles/${roleId}`,
        );

        return response.data.data;
    },

    async getPermissions(): Promise<Permission[]> {
        const response = await apiClient.get<
            ApiResponse<Permission[]>
        >("/permissions");

        return response.data.data;
    },


    async createRole(
        companyId: string,
        payload: CreateRolePayload,
    ): Promise<Role> {
        const response = await apiClient.post<
            ApiResponse<Role>
        >(
            `/companies/${companyId}/roles`,
            payload,
        );

        return response.data.data;
    },

    async updateRoleStatus(
        companyId: string,
        roleId: string,
        status: "ACTIVE" | "INACTIVE",
    ): Promise<Role> {
        const response = await apiClient.patch<
            ApiResponse<Role>
        >(
            `/companies/${companyId}/roles/${roleId}/status`,
            {
                status,
            },
        );

        return response.data.data;
    },

    async deleteRole(
        companyId: string,
        roleId: string,
    ): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            `/companies/${companyId}/roles/${roleId}`,
        );
    },
};