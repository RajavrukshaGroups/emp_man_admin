"use client";

import axios from "axios";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { userService } from "../services/user.service";

import type {
    UserListData,
    UserListParams,
} from "../types/user.types";

interface UseUsersResult {
    data: UserListData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useUsers(
    params: UserListParams = {},
): UseUsersResult {
    const [data, setData] =
        useState<UserListData | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

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

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

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

            setData(result);
        } catch (error: unknown) {
            console.error(
                "Failed to fetch users:",
                error,
            );

            if (axios.isAxiosError(error)) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load users.",
                );
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Unable to load users.");
            }

            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [
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

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchUsers,
    };
}