export const APP_NAME =
    process.env.NEXT_PUBLIC_APP_NAME || "Employee Management System";

export const APP_ENV =
    process.env.NEXT_PUBLIC_APP_ENV || "development";

export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",

    DASHBOARD: "/dashboard",
    COMPANIES: "/companies",
    DEPARTMENTS: "/departments",
    TEAMS: "/teams",
    EMPLOYEES: "/employees",
    USERS: "/users",
    ROLES: "/roles",
    PERMISSIONS: "/permissions",
    COMPANY_ACCESS: "/company-access",
    PROFILE: "/profile",
} as const;

export const EMPLOYMENT_TYPES = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERN",
    "CONSULTANT",
] as const;

export const COMMON_STATUSES = [
    "ACTIVE",
    "INACTIVE",
] as const;