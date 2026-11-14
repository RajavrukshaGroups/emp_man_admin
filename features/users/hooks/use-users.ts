"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import { userService } from "../services/user.service";
import type { UserListData, UserListParams } from "../types/user.types";

interface UseUsersResult {
  data: UserListData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Unable to load users.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load users.";
}

export function useUsers(params: UserListParams = {}): UseUsersResult {
  const {
    page,
    limit,
    search,
    status,
    gender,
    emailVerified,
    mobileVerified,
    sortBy,
    sortOrder,
  } = params;

  const [data, setData] = useState<UserListData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const queryKey = JSON.stringify([
    page,
    limit,
    search,
    status,
    gender,
    emailVerified,
    mobileVerified,
    sortBy,
    sortOrder,
  ]);

  const [loadedQueryKey, setLoadedQueryKey] = useState<string | null>(null);
  const [errorQueryKey, setErrorQueryKey] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (refresh = false): Promise<void> => {
      const requestId = ++requestIdRef.current;

      setError(null);
      setErrorQueryKey(null);

      setIsRefreshing(refresh);

      try {
        const result = await userService.getUsers({
          page,
          limit,
          search,
          status,
          gender,
          emailVerified,
          mobileVerified,
          sortBy,
          sortOrder,
        });

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setData(result);
        setLoadedQueryKey(queryKey);
      } catch (error: unknown) {
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        console.error("Failed to fetch users:", error);
        setError(getErrorMessage(error));
        setErrorQueryKey(queryKey);

        if (!refresh) {
          setData(null);
          setLoadedQueryKey(null);
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [
      page,
      limit,
      search,
      status,
      gender,
      emailVerified,
      mobileVerified,
      sortBy,
      sortOrder,
      queryKey,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;
    void fetchUsers();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchUsers]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchUsers(true);
  }, [fetchUsers]);

  const hasCurrentData = loadedQueryKey === queryKey;
  const currentError = errorQueryKey === queryKey ? error : null;
  const isQueryLoading = !hasCurrentData && !currentError;

  return {
    data: hasCurrentData ? data : null,
    isLoading: isQueryLoading,
    isRefreshing,
    error: currentError,
    refetch,
  };
}
