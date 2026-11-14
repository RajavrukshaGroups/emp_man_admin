
import axios from "axios";

import type { ApiResponse } from "@/types/api";

/**
 * Public authentication API client.
 *
 * Does not attach access tokens or attempt token refresh.
 */
const publicAuthClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Forgot Password
 */
export interface ForgotPasswordPayload {
  email: string;
}

export const forgotPassword = async (
  payload: ForgotPasswordPayload,
): Promise<ApiResponse<null>> => {
  const response = await publicAuthClient.post<ApiResponse<null>>(
    "/auth/forgot-password",
    payload,
  );

  return response.data;
};

/**
 * Reset Password
 */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<ApiResponse<null>> => {
  const response = await publicAuthClient.post<ApiResponse<null>>(
    "/auth/reset-password",
    payload,
  );

  return response.data;
};

/**
 * Accept Employee Login Invitation
 *
 * Public endpoint. The backend validates the invitation token,
 * password requirements, and account eligibility.
 */
export interface AcceptInvitationPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const acceptInvitation = async (
  payload: AcceptInvitationPayload,
): Promise<ApiResponse<null>> => {
  const response = await publicAuthClient.post<ApiResponse<null>>(
    "/auth/accept-invitation",
    payload,
  );

  return response.data;
};
