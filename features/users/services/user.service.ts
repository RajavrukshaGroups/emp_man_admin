import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    ChangePasswordPayload,
    CreateUserPayload,
    ResetPasswordPayload,
    UpdateUserPayload,
    UpdateUserStatusPayload,
    User,
    UserListData,
    UserListParams,
} from "../types/user.types";

export const userService = {
    async getUsers(
        params: UserListParams = {},
    ): Promise<UserListData> {
        const response = await apiClient.get<
            ApiResponse<UserListData>
        >("/users", {
            params,
        });

        return response.data.data;
    },

    async getUserById(
        userId: string,
    ): Promise<User> {
        const response = await apiClient.get<
            ApiResponse<User>
        >(`/users/${userId}`);

        return response.data.data;
    },

    async createUser(
        payload: CreateUserPayload,
    ): Promise<User> {
        const response = await apiClient.post<
            ApiResponse<User>
        >("/users", payload);

        return response.data.data;
    },

    async updateUser(
        userId: string,
        payload: UpdateUserPayload,
    ): Promise<User> {
        const response = await apiClient.patch<
            ApiResponse<User>
        >(`/users/${userId}`, payload);

        return response.data.data;
    },

    async updateUserStatus(
        userId: string,
        payload: UpdateUserStatusPayload,
    ): Promise<User> {
        const response = await apiClient.patch<
            ApiResponse<User>
        >(`/users/${userId}/status`, payload);

        return response.data.data;
    },

    async changePassword(
        userId: string,
        payload: ChangePasswordPayload,
    ): Promise<void> {
        await apiClient.patch<ApiResponse<null>>(
            `/users/${userId}/change-password`,
            payload,
        );
    },

    async resetPassword(
        userId: string,
        payload: ResetPasswordPayload,
    ): Promise<void> {
        await apiClient.patch<ApiResponse<null>>(
            `/users/${userId}/reset-password`,
            payload,
        );
    },

    async deleteUser(
        userId: string,
    ): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            `/users/${userId}`,
        );
    },
};