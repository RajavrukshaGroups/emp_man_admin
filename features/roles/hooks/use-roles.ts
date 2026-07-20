"use client";

import axios from "axios";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { roleService } from "../services/role.service";

import type {
  RoleListData,
  RoleListParams,
} from "../types/role.types";

interface UseRolesResult {
  data: RoleListData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoles(
  companyId?: string,
  params: RoleListParams = {},
): UseRolesResult {
  const [data, setData] =
    useState<RoleListData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const fetchRoles = useCallback(async () => {
    if (!companyId) {
      setData(null);
      setError(
        "Company context is unavailable.",
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result =
        await roleService.getRoles(
          companyId,
          {
            page,
            limit,
            search:
              search.trim() || undefined,
            status,
            sortBy,
            sortOrder,
          },
        );

      setData(result);
    } catch (error) {
      console.error(
        "Unable to fetch roles:",
        error,
      );

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ??
            "Unable to load roles.",
        );
      } else {
        setError(
          "Unable to load roles.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    companyId,
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRoles,
  };
}