import type { CompanyAccess } from "@/features/company-access/types/company-access.types";
import type { Employee } from "@/features/employees/types/employee.types";
import type { User } from "@/features/users/types/user.types";

export type OnboardingNextStep =
    | "COMPANY_ACCESS"
    | "EMPLOYEE_PROFILE"
    | "COMPLETED";

export interface OnboardingUser extends User {
    onboardingStatus:
    | "USER_CREATED"
    | "COMPANY_ACCESS_CREATED"
    | "COMPLETED";

    onboardingCompanyId?: string | null;
    onboardingCompletedAt?: string | null;
}

export interface OnboardingRecord {
    user: OnboardingUser;
    companyAccess: CompanyAccess | null;
    employee: Employee | null;
    nextStep: OnboardingNextStep;
}

export interface OnboardingPagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface OnboardingListData {
    records: OnboardingRecord[];
    pagination: OnboardingPagination;
}

export interface OnboardingListParams {
    page?: number;
    limit?: number;
    search?: string;
    onboardingStatus?:
    | "USER_CREATED"
    | "COMPANY_ACCESS_CREATED"
    | "COMPLETED";
}