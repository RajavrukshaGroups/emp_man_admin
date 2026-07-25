import type { CompanyAccess } from "@/features/company-access/types/company-access.types";
import type { User } from "@/features/users/types/user.types";

export type OnboardingStep =
    | "USER_ACCOUNT"
    | "COMPANY_ACCESS"
    | "EMPLOYEE_PROFILE";

export interface OnboardingState {
    currentStep: OnboardingStep;
    createdUser: User | null;
    companyAccess: CompanyAccess | null;
    employeeId: string | null;
}