"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { userService } from "../services/user.service";

import type { User } from "../types/user.types";

interface UseUserResult {
    data: User | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useUser(
    userId: string | undefined,
): UseUserResult {
    const [data, setData] = useState<User | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        if (!userId) {
            setData(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await userService.getUserById(userId);

            setData(result);
        } catch (error: unknown) {
            console.error("Failed to fetch user:", error);

            if (axios.isAxiosError(error)) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load user.",
                );
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Unable to load user.");
            }

            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void fetchUser();
    }, [fetchUser]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchUser,
    };
}