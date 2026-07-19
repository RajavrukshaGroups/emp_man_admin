"use client";

import { create } from "zustand";
import {
    createJSONStorage,
    persist,
} from "zustand/middleware";

import { storage } from "@/lib/storage";
import { authService } from "@/services/auth.service";

import type {
    AuthSessionData,
    AuthState,
    ChangePasswordRequest,
    LoginRequest,
} from "@/types/auth";

interface AuthActions {
    login: (payload: LoginRequest) => Promise<void>;

    initializeAuth: () => Promise<void>;

    logout: () => Promise<void>;

    logoutAll: () => Promise<void>;

    changePassword: (
        payload: ChangePasswordRequest,
    ) => Promise<void>;

    setHydrated: (value: boolean) => void;

    clearSession: () => void;
}

type AuthStore = AuthState & AuthActions;

const extractPermissions = (
    session: AuthSessionData,
): string[] => {
    return (
        session.role?.permissions?.map(
            (permission) => permission.code,
        ) ?? []
    );
};

const getSessionState = (
    session: AuthSessionData,
) => ({
    user: session.user,
    companyAccess: session.companyAccess,
    company: session.company,
    role: session.role,
    permissions: extractPermissions(session),
    isAuthenticated: true,
});

const emptySessionState = {
    user: null,
    companyAccess: null,
    company: null,
    role: null,
    permissions: [],
    isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            ...emptySessionState,

            isLoading: false,
            isInitializing: true,
            isHydrated: false,

            login: async (payload) => {
                set({
                    isLoading: true,
                });

                try {
                    const data = await authService.login(payload);

                    storage.setAccessToken(data.accessToken);

                    set({
                        ...getSessionState(data),
                        isLoading: false,
                        isInitializing: false,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                    });

                    throw error;
                }
            },

            initializeAuth: async () => {
                const token = storage.getAccessToken();

                if (!token) {
                    set({
                        ...emptySessionState,
                        isInitializing: false,
                    });

                    return;
                }

                set({
                    isInitializing: true,
                });

                try {
                    const data =
                        await authService.getAuthenticatedUser();

                    set({
                        ...getSessionState(data),
                        isInitializing: false,
                    });
                } catch {
                    storage.clearAuthStorage();

                    set({
                        ...emptySessionState,
                        isInitializing: false,
                    });
                }
            },

            logout: async () => {
                set({
                    isLoading: true,
                });

                try {
                    await authService.logout();
                } catch {
                    // Clear the local session even if the API request fails.
                } finally {
                    storage.clearAuthStorage();

                    set({
                        ...emptySessionState,
                        isLoading: false,
                        isInitializing: false,
                    });
                }
            },

            logoutAll: async () => {
                set({
                    isLoading: true,
                });

                try {
                    await authService.logoutAll();
                } finally {
                    storage.clearAuthStorage();

                    set({
                        ...emptySessionState,
                        isLoading: false,
                        isInitializing: false,
                    });
                }
            },

            changePassword: async (payload) => {
                set({
                    isLoading: true,
                });

                try {
                    await authService.changePassword(payload);

                    // Your backend says:
                    // "Password changed successfully. Please log in again."
                    storage.clearAuthStorage();

                    set({
                        ...emptySessionState,
                        isLoading: false,
                        isInitializing: false,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                    });

                    throw error;
                }
            },

            clearSession: () => {
                storage.clearAuthStorage();

                set({
                    ...emptySessionState,
                    isLoading: false,
                    isInitializing: false,
                });
            },

            setHydrated: (value) => {
                set({
                    isHydrated: value,
                });
            },
        }),
        {
            name: "employee-management-auth-store",

            storage: createJSONStorage(
                () => localStorage,
            ),

            partialize: (state) => ({
                user: state.user,
                companyAccess: state.companyAccess,
                company: state.company,
                role: state.role,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        },
    ),
);