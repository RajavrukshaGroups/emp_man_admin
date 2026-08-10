import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CompanyAdministratorResponse,
    CreateCompanyAdministratorPayload,
    CreateCompanyAdministratorResponse,
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
};