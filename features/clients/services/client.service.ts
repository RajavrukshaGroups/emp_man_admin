import apiClient from "@/lib/axios";

import type {
    Client,
    ClientListQuery,
    ClientListResult,
    CreateClientRequest,
    UpdateClientRequest,
    UpdateClientStatusRequest
} from "../types/client.types";

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

function buildClientQuery(query: ClientListQuery = {}) {
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

    if (query.clientType) {
        params.set("clientType", query.clientType);
    }

    if (query.industry) {
        params.set("industry", query.industry);
    }

    if (query.engagementType) {
        params.set("engagementType", query.engagementType);
    }

    if (query.sortBy) {
        params.set("sortBy", query.sortBy);
    }

    if (query.sortOrder) {
        params.set("sortOrder", query.sortOrder);
    }

    return params.toString();
}

export const clientService = {
    async getClients(
        companyId: string,
        query: ClientListQuery = {},
    ): Promise<ClientListResult> {
        const queryString = buildClientQuery(query);

        const url = queryString
            ? `/companies/${companyId}/clients?${queryString}`
            : `/companies/${companyId}/clients`;

        const response =
            await apiClient.get<ApiResponse<ClientListResult>>(url);

        return response.data.data;
    },

    async getClientById(
        companyId: string,
        clientId: string,
    ): Promise<Client> {
        const response = await apiClient.get<ApiResponse<Client>>(
            `/companies/${companyId}/clients/${clientId}`,
        );

        return response.data.data;
    },

    async createClient(
        companyId: string,
        payload: CreateClientRequest,
    ): Promise<Client> {
        const response = await apiClient.post<ApiResponse<Client>>(
            `/companies/${companyId}/clients`,
            payload,
        );

        return response.data.data;
    },

    async updateClient(
        companyId: string,
        clientId: string,
        payload: UpdateClientRequest,
    ): Promise<Client> {
        const response = await apiClient.patch<ApiResponse<Client>>(
            `/companies/${companyId}/clients/${clientId}`,
            payload,
        );

        return response.data.data;
    },

    async updateClientStatus(
        companyId: string,
        clientId: string,
        payload: UpdateClientStatusRequest,
    ): Promise<Client> {
        const response = await apiClient.patch<ApiResponse<Client>>(
            `/companies/${companyId}/clients/${clientId}/status`,
            payload,
        );

        return response.data.data;
    },

    async deleteClient(
        companyId: string,
        clientId: string,
    ): Promise<{
        clientId: string;
        deletedAt: string;
    }> {
        const response = await apiClient.delete<
            ApiResponse<{
                clientId: string;
                deletedAt: string;
            }>
        >(
            `/companies/${companyId}/clients/${clientId}`,
        );

        return response.data.data;
    },
};