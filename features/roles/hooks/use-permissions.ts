"use client";

import axios from "axios";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { roleService } from "../services/role.service";
import type { Permission } from "../types/role.types";

interface UsePermissionsResult {
    permissions: Permission[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsResult {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPermissions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await roleService.getPermissions();

            const activePermissions = data.filter(
                (permission) => permission.status === "ACTIVE",
            );

            setPermissions(activePermissions);
        } catch (error: unknown) {
            console.error("Failed to fetch permissions:", error);

            if (axios.isAxiosError(error)) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load permissions.",
                );
            } else {
                setError("Unable to load permissions.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchPermissions();
    }, [fetchPermissions]);

    return {
        permissions,
        isLoading,
        error,
        refetch: fetchPermissions,
    };
}