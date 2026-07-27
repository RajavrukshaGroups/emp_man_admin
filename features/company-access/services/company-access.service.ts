import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CompanyAccess,
    CompanyAccessListData,
    CompanyAccessListParams,
    CreateCompanyAccessPayload,
    UpdateCompanyAccessPayload
} from "../types/company-access.types";

export const companyAccessService = {
    async createCompanyAccess(
        companyId: string,
        payload: CreateCompanyAccessPayload,
    ): Promise<CompanyAccess> {
        const response = await apiClient.post<ApiResponse<CompanyAccess>>(
            `/companies/${companyId}/access`,
            payload,
        );

        return response.data.data;
    },

    async updateCompanyAccess(
        companyId: string,
        accessId: string,
        payload: UpdateCompanyAccessPayload,
    ): Promise<CompanyAccess> {
        const response = await apiClient.patch<ApiResponse<CompanyAccess>>(
            `/companies/${companyId}/access/${accessId}`,
            payload,
        );

        return response.data.data;
    },

    async getCompanyAccessList(
        companyId: string,
        params: CompanyAccessListParams = {},
    ): Promise<CompanyAccessListData> {
        const response = await apiClient.get<
            ApiResponse<CompanyAccessListData>
        >(`/companies/${companyId}/access`, {
            params,
        });

        return response.data.data;
    },

    async getCompanyAccessById(
        companyId: string,
        accessId: string,
    ): Promise<CompanyAccess> {
        const response = await apiClient.get<ApiResponse<CompanyAccess>>(
            `/companies/${companyId}/access/${accessId}`,
        );

        return response.data.data;
    },

    async getUserCompanyAccess(
        userId: string,
    ): Promise<CompanyAccess[]> {
        const response = await apiClient.get<
            ApiResponse<CompanyAccess[]>
        >(`/users/${userId}/company-access`);

        return response.data.data;
    },
};