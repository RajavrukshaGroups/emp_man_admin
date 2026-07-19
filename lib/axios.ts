import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

import { storage } from "@/lib/storage";

import type { ApiErrorResponse } from "@/types/api";
import type {
    RefreshTokenResponseData,
} from "@/types/auth";
import type { ApiResponse } from "@/types/api";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is missing from the environment variables.",
    );
}

interface RetryableRequestConfig
    extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

/**
 * Main authenticated API client.
 *
 * withCredentials is required when the backend stores
 * the refresh token inside an HTTP-only cookie.
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

/**
 * Separate client for refreshing the token.
 *
 * This prevents the refresh request from passing through
 * the main response interceptor and creating an infinite loop.
 */
const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

let isRefreshing = false;

let refreshSubscribers: Array<
    (accessToken: string) => void
> = [];

const subscribeToTokenRefresh = (
    callback: (accessToken: string) => void,
): void => {
    refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (
    accessToken: string,
): void => {
    refreshSubscribers.forEach((callback) =>
        callback(accessToken),
    );

    refreshSubscribers = [];
};

const clearSessionAndRedirect = (): void => {
    storage.clearAuthStorage();

    if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
    ) {
        window.location.replace("/login");
    }
};

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = storage.getAccessToken();

        if (accessToken) {
            config.headers.Authorization =
                `Bearer ${accessToken}`;
        }

        return config;
    },

    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

apiClient.interceptors.response.use(
    (response) => response,

    async (
        error: AxiosError<ApiErrorResponse>,
    ) => {
        const originalRequest =
            error.config as
            | RetryableRequestConfig
            | undefined;

        const statusCode = error.response?.status;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const requestUrl =
            originalRequest.url ?? "";

        const isLoginRequest =
            requestUrl.includes("/auth/login");

        const isRefreshRequest =
            requestUrl.includes(
                "/auth/refresh-token",
            );

        if (
            statusCode !== 401 ||
            originalRequest._retry ||
            isLoginRequest ||
            isRefreshRequest
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeToTokenRefresh(
                    (newAccessToken) => {
                        originalRequest.headers.Authorization =
                            `Bearer ${newAccessToken}`;

                        resolve(
                            apiClient(originalRequest),
                        );
                    },
                );
            });
        }

        isRefreshing = true;

        try {
            const response =
                await refreshClient.post<
                    ApiResponse<RefreshTokenResponseData>
                >("/auth/refresh-token");

            const newAccessToken =
                response.data.data.accessToken;

            storage.setAccessToken(newAccessToken);

            notifyRefreshSubscribers(
                newAccessToken,
            );

            originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;

            return apiClient(originalRequest);
        } catch (refreshError) {
            refreshSubscribers = [];

            clearSessionAndRedirect();

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export const getApiErrorMessage = (
    error: unknown,
    fallbackMessage =
        "Something went wrong. Please try again.",
): string => {
    if (
        axios.isAxiosError<ApiErrorResponse>(
            error,
        )
    ) {
        const validationMessage =
            error.response?.data?.errors?.[0]
                ?.message;

        return (
            validationMessage ||
            error.response?.data?.message ||
            error.message ||
            fallbackMessage
        );
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
};

export default apiClient;