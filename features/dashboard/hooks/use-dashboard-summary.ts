"use client";

import { useCallback, useEffect, useState } from "react";

import { dashboardService } from "../services/dashboard.service";
import type { DashboardSummary } from "../types/dashboard.types";

interface UseDashboardSummaryResult {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardSummary(
  companyId?: string,
): UseDashboardSummaryResult {
  const [data, setData] =
    useState<DashboardSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!companyId) {
      setData(null);
      setError("Company context is unavailable.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const summary =
        await dashboardService.getSummary(companyId);

      setData(summary);
    } catch (error) {
      console.error(
        "Unable to fetch dashboard summary:",
        error,
      );

      setError(
        "Unable to load dashboard summary.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}