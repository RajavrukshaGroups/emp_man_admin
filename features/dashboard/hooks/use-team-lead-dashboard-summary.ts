"use client";

import { useCallback, useEffect, useState } from "react";

import { dashboardService } from "../services/dashboard.service";

import type { TeamLeadDashboardSummary } from "../types/dashboard.types";

export function useTeamLeadDashboardSummary(companyId?: string) {
    const [data, setData] =
        useState<TeamLeadDashboardSummary | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const loadDashboard = useCallback(async () => {
        if (!companyId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result =
                await dashboardService.getTeamLeadDashboardSummary(
                    companyId,
                );

            setData(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to load Team Lead dashboard.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    return {
        data,
        isLoading,
        error,
        refetch: loadDashboard,
    };
}