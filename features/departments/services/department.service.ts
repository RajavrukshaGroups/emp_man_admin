import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CreateDepartmentPayload,
    Department,
    DepartmentListData,
    DepartmentListParams,
    DepartmentStatus,
    UpdateDepartmentPayload,
} from "../types/department.types";

export const departmentService = {
    async getDepartments(
        companyId: string,
        params: DepartmentListParams = {},
    ): Promise<DepartmentListData> {
        const response = await apiClient.get<
            ApiResponse<DepartmentListData>
        >(`/companies/${companyId}/departments`, {
            params,
        });

        return response.data.data;
    },

    async getDepartmentById(
        companyId: string,
        departmentId: string,
    ): Promise<Department> {
        const response = await apiClient.get<
            ApiResponse<Department>
        >(
            `/companies/${companyId}/departments/${departmentId}`,
        );

        return response.data.data;
    },

    async createDepartment(
        companyId: string,
        payload: CreateDepartmentPayload,
    ): Promise<Department> {
        const response = await apiClient.post<
            ApiResponse<Department>
        >(
            `/companies/${companyId}/departments`,
            payload,
        );

        return response.data.data;
    },

    async updateDepartment(
        companyId: string,
        departmentId: string,
        payload: UpdateDepartmentPayload,
    ): Promise<Department> {
        const response = await apiClient.patch<
            ApiResponse<Department>
        >(
            `/companies/${companyId}/departments/${departmentId}`,
            payload,
        );

        return response.data.data;
    },

    async updateDepartmentStatus(
        companyId: string,
        departmentId: string,
        status: DepartmentStatus,
    ): Promise<Department> {
        const response = await apiClient.patch<
            ApiResponse<Department>
        >(
            `/companies/${companyId}/departments/${departmentId}/status`,
            {
                status,
            },
        );

        return response.data.data;
    },

    async deleteDepartment(
        companyId: string,
        departmentId: string,
    ): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            `/companies/${companyId}/departments/${departmentId}`,
        );
    },
};