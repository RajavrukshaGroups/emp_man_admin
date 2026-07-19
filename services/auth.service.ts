import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";
import type {
  AuthenticatedUserResponseData,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponseData,
  RefreshTokenResponseData,
} from "@/types/auth";

export const authService = {
  async login(
    payload: LoginRequest,
  ): Promise<LoginResponseData> {
    const response = await apiClient.post<
      ApiResponse<LoginResponseData>
    >("/auth/login", payload);

    return response.data.data;
  },

  async getAuthenticatedUser(): Promise<AuthenticatedUserResponseData> {
    const response = await apiClient.get<
      ApiResponse<AuthenticatedUserResponseData>
    >("/auth/me");

    return response.data.data;
  },

  async refreshToken(): Promise<RefreshTokenResponseData> {
    const response = await apiClient.post<
      ApiResponse<RefreshTokenResponseData>
    >("/auth/refresh-token");

    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<null>>(
      "/auth/logout",
    );
  },

  async logoutAll(): Promise<void> {
    await apiClient.post<ApiResponse<null>>(
      "/auth/logout-all",
    );
  },

  async changePassword(
    payload: ChangePasswordRequest,
  ): Promise<void> {
    await apiClient.post<ApiResponse<null>>(
      "/auth/change-password",
      payload,
    );
  },
};