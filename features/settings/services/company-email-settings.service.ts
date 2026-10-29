
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export type EmailProvider =
  | "GOOGLE_WORKSPACE"
  | "MICROSOFT_365";

export interface CompanyEmailSettings {
  _id: string;
  companyId: string;
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCompanyEmailSettingsPayload {
  provider: EmailProvider;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Retrieve company SMTP configuration.
 * The backend never returns the SMTP password.
 */
export const getCompanyEmailSettings = async (
  companyId: string,
): Promise<CompanyEmailSettings | null> => {
  const response = await apiClient.get<
    ApiResponse<CompanyEmailSettings | null>
  >(`/companies/${companyId}/email-settings`);

  return response.data.data;
};

/**
 * Create or replace SMTP configuration.
 *
 * Saving credentials resets verification and disables
 * email delivery until verification is completed.
 */
export const saveCompanyEmailSettings = async (
  companyId: string,
  payload: SaveCompanyEmailSettingsPayload,
): Promise<CompanyEmailSettings> => {
  const response = await apiClient.put<
    ApiResponse<CompanyEmailSettings>
  >(`/companies/${companyId}/email-settings`, payload);

  return response.data.data;
};

/**
 * Verify SMTP credentials through the backend.
 */
export const verifyCompanyEmailSettings = async (
  companyId: string,
): Promise<CompanyEmailSettings> => {
  const response = await apiClient.post<
    ApiResponse<CompanyEmailSettings>
  >(`/companies/${companyId}/email-settings/verify`, {});

  return response.data.data;
};

/**
 * Enable or disable company email delivery.
 */
export const updateCompanyEmailStatus = async (
  companyId: string,
  isEnabled: boolean,
): Promise<CompanyEmailSettings> => {
  const response = await apiClient.patch<
    ApiResponse<CompanyEmailSettings>
  >(`/companies/${companyId}/email-settings/status`, {
    isEnabled,
  });

  return response.data.data;
};


