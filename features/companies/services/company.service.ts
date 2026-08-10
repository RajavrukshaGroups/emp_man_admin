import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    Company,
    CompanyAdministratorResponse,
    CompanyListData,
    CompanyListParams,
    CompanyStatus,
    CreateCompanyPayload,
    UpdateCompanyPayload,
} from "../types/company.types";

export const companyService = {
    async getCompanies(
        params: CompanyListParams = {},
    ): Promise<CompanyListData> {
        const response = await apiClient.get<
            ApiResponse<CompanyListData>
        >("/companies", {
            params,
        });

        return response.data.data;
    },

    async getCompanyById(
        companyId: string,
    ): Promise<Company> {
        const response = await apiClient.get<
            ApiResponse<Company>
        >(`/companies/${companyId}`);

        return response.data.data;
    },

    /**
     * Get the single Company Administrator
     * assigned to the selected company.
     */
    async getCompanyAdministrator(
        companyId: string,
    ): Promise<CompanyAdministratorResponse> {
        const response = await apiClient.get<
            ApiResponse<CompanyAdministratorResponse>
        >(
            `/companies/${companyId}/administrators`,
        );

        return response.data.data;
    },

    async createCompany(
        payload: CreateCompanyPayload,
    ): Promise<Company> {
        const response = await apiClient.post<
            ApiResponse<Company>
        >("/companies", payload);

        return response.data.data;
    },

    async updateCompany(
        companyId: string,
        payload: UpdateCompanyPayload,
    ): Promise<Company> {
        const response = await apiClient.patch<
            ApiResponse<Company>
        >(`/companies/${companyId}`, payload);

        return response.data.data;
    },

    async updateCompanyStatus(
        companyId: string,
        status: CompanyStatus,
    ): Promise<Company> {
        const response = await apiClient.patch<
            ApiResponse<Company>
        >(`/companies/${companyId}/status`, {
            status,
        });

        return response.data.data;
    },

    async deleteCompany(
        companyId: string,
    ): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            `/companies/${companyId}`,
        );
    },
};