import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CompanyAdministratorResponse,
    CreateCompanyAdministratorPayload,
    CreateCompanyAdministratorResponse,
    UpdateCompanyAdministratorPayload,
} from "../types/company-administrator.types";

export const companyAdministratorService = {
    async createCompanyAdministrator(
        companyId: string,
        payload: CreateCompanyAdministratorPayload,
    ): Promise<CreateCompanyAdministratorResponse> {
        const response = await apiClient.post<
            ApiResponse<CreateCompanyAdministratorResponse>
        >(
            `/companies/${companyId}/administrators`,
            payload,
        );

        return response.data.data;
    },

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

    async updateCompanyAdministrator(
        companyId: string,
        payload: UpdateCompanyAdministratorPayload,
    ): Promise<CreateCompanyAdministratorResponse> {
        const response = await apiClient.patch<
            ApiResponse<CreateCompanyAdministratorResponse>
        >(
            `/companies/${companyId}/administrators`,
            payload,
        );

        return response.data.data;
    },
    async resetCompanyAdministratorPassword(
        companyId: string,
        payload: {
            newPassword: string;
            confirmPassword: string;
        },
    ): Promise<void> {
        await apiClient.patch<ApiResponse<null>>(
            `/companies/${companyId}/administrators/reset-password`,
            payload,
        );
    },
    async updateCompanyAdministratorStatus(
        companyId: string,
        status: "ACTIVE" | "INACTIVE",
    ): Promise<void> {
        await apiClient.patch<
            ApiResponse<{
                userId: string;
                companyAccessId: string;
                status: "ACTIVE" | "INACTIVE";
            }>
        >(
            `/companies/${companyId}/administrators/status`,
            { status },
        );
    },
};