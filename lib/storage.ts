const STORAGE_KEYS = {
    ACCESS_TOKEN: "employee_management_access_token",
    AUTH_STORE: "employee-management-auth-store",
} as const;

const isBrowser = (): boolean =>
    typeof window !== "undefined";

export const storage = {
    getAccessToken(): string | null {
        if (!isBrowser()) {
            return null;
        }

        return localStorage.getItem(
            STORAGE_KEYS.ACCESS_TOKEN,
        );
    },

    setAccessToken(token: string): void {
        if (!isBrowser()) {
            return;
        }

        localStorage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN,
            token,
        );
    },

    removeAccessToken(): void {
        if (!isBrowser()) {
            return;
        }

        localStorage.removeItem(
            STORAGE_KEYS.ACCESS_TOKEN,
        );
    },

    getItem<T>(key: string): T | null {
        if (!isBrowser()) {
            return null;
        }

        const value = localStorage.getItem(key);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    },

    setItem<T>(key: string, value: T): void {
        if (!isBrowser()) {
            return;
        }

        localStorage.setItem(
            key,
            JSON.stringify(value),
        );
    },

    removeItem(key: string): void {
        if (!isBrowser()) {
            return;
        }

        localStorage.removeItem(key);
    },

    clearAuthStorage(): void {
        if (!isBrowser()) {
            return;
        }

        localStorage.removeItem(
            STORAGE_KEYS.ACCESS_TOKEN,
        );

        localStorage.removeItem(
            STORAGE_KEYS.AUTH_STORE,
        );
    },
};

export { STORAGE_KEYS };