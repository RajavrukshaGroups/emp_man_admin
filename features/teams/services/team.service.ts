import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    AssignTeamLeadsPayload,
    AssignTeamMembersPayload,
    AssignTeamMembersResult,
    CreateTeamPayload,
    RemoveTeamMembersResult,
    Team,
    TeamListData,
    TeamListParams,
    TeamStatus,
    UpdateTeamPayload,
} from "../types/team.types";

export const teamService = {
    async getTeams(
        companyId: string,
        params: TeamListParams = {},
    ): Promise<TeamListData> {
        const response = await apiClient.get<
            ApiResponse<TeamListData>
        >(`/companies/${companyId}/teams`, {
            params,
        });

        return response.data.data;
    },

    async getTeamById(
        companyId: string,
        teamId: string,
    ): Promise<Team> {
        const response = await apiClient.get<
            ApiResponse<Team>
        >(
            `/companies/${companyId}/teams/${teamId}`,
        );

        return response.data.data;
    },

    async createTeam(
        companyId: string,
        payload: CreateTeamPayload,
    ): Promise<Team> {
        const response = await apiClient.post<
            ApiResponse<Team>
        >(
            `/companies/${companyId}/teams`,
            payload,
        );

        return response.data.data;
    },

    async updateTeam(
        companyId: string,
        teamId: string,
        payload: UpdateTeamPayload,
    ): Promise<Team> {
        const response = await apiClient.patch<
            ApiResponse<Team>
        >(
            `/companies/${companyId}/teams/${teamId}`,
            payload,
        );

        return response.data.data;
    },

    async updateTeamStatus(
        companyId: string,
        teamId: string,
        status: TeamStatus,
    ): Promise<Team> {
        const response = await apiClient.patch<
            ApiResponse<Team>
        >(
            `/companies/${companyId}/teams/${teamId}/status`,
            {
                status,
            },
        );

        return response.data.data;
    },

    async assignTeamLeads(
        companyId: string,
        teamId: string,
        payload: AssignTeamLeadsPayload,
    ): Promise<Team> {
        const response = await apiClient.patch<
            ApiResponse<Team>
        >(
            `/companies/${companyId}/teams/${teamId}/leads`,
            payload,
        );

        return response.data.data;
    },

    async assignTeamMembers(
        companyId: string,
        teamId: string,
        payload: AssignTeamMembersPayload,
    ): Promise<AssignTeamMembersResult> {
        const response = await apiClient.patch<
            ApiResponse<AssignTeamMembersResult>
        >(
            `/companies/${companyId}/teams/${teamId}/members`,
            payload,
        );

        return response.data.data;
    },

    async removeTeamMembers(
        companyId: string,
        teamId: string,
        payload: AssignTeamMembersPayload,
    ): Promise<RemoveTeamMembersResult> {
        const response = await apiClient.patch<
            ApiResponse<RemoveTeamMembersResult>
        >(
            `/companies/${companyId}/teams/${teamId}/members/remove`,
            payload,
        );

        return response.data.data;
    },

    async deleteTeam(
        companyId: string,
        teamId: string,
    ): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            `/companies/${companyId}/teams/${teamId}`,
        );
    },
};