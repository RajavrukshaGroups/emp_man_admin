import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    OnboardingListData,
    OnboardingListParams,
    OnboardingRecord,
} from "../types/onboarding.types";

export const onboardingService = {
    async getPendingOnboarding(
        params: OnboardingListParams = {},
    ): Promise<OnboardingListData> {
        const response = await apiClient.get<
            ApiResponse<OnboardingListData>
        >("/onboarding", {
            params,
        });

        return response.data.data;
    },

    async getOnboardingByUserId(
        userId: string,
    ): Promise<OnboardingRecord> {
        const response = await apiClient.get<
            ApiResponse<OnboardingRecord>
        >(`/onboarding/${userId}`);

        return response.data.data;
    },
};