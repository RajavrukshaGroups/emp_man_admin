export type AdministratorGender =
    | "MALE"
    | "FEMALE"
    | "OTHER"
    | "PREFER_NOT_TO_SAY";

export type AdministratorStatus =
    | "ACTIVE"
    | "INACTIVE";

export type EmploymentType =
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN"
    | "CONSULTANT"
    | "FREELANCER";

export type WorkLocationType =
    | "HEAD_OFFICE"
    | "BRANCH"
    | "REMOTE"
    | "HYBRID"
    | "CLIENT_LOCATION";

export interface CreateCompanyAdministratorPayload {
    firstName: string;
    middleName?: string;
    lastName: string;
    displayName?: string;

    email: string;
    mobile?: string;

    password: string;

    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
    dateOfBirth?: string;

    employeeCode: string;
    designation?: string;

    employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN"
    | "CONSULTANT"
    | "FREELANCER";

    joiningDate?: string;

    workLocationType?:
    | "HEAD_OFFICE"
    | "BRANCH"
    | "REMOTE"
    | "HYBRID"
    | "CLIENT_LOCATION";

    workLocationName?: string;

    notes?: string;

    emailVerified?: boolean;
    mobileVerified?: boolean;
}

export interface CompanyAdministratorCompany {
    _id: string;

    name: string;

    code: string;

    slug: string;

    status: string;
}

export interface CompanyAdministratorUser {
    _id: string;

    firstName: string;

    middleName?: string;

    lastName: string;

    displayName: string;

    email: string;

    mobile?: string;

    profilePhoto?: string;

    gender?: AdministratorGender;

    dateOfBirth?: string | null;

    status: string;

    emailVerified: boolean;

    mobileVerified: boolean;

    onboardingStatus?: string;

    onboardingCompanyId?: string | null;

    onboardingCompletedAt?: string | null;

    createdAt?: string;

    updatedAt?: string;
}

export interface CompanyAdministratorAccess {
    _id: string;

    employeeCode?: string | null;

    designation?: string;

    employmentType?: EmploymentType;

    departmentId?: string | null;

    teamId?: string | null;

    reportingManagerId?: string | null;

    joiningDate?: string | null;

    workLocationType?: WorkLocationType;

    workLocationName?: string;

    isPrimaryCompany: boolean;

    status: string;

    notes?: string;

    createdAt?: string;

    updatedAt?: string;
}

export interface CompanyAdministratorRole {
    _id: string;

    name: string;

    code: string;

    scopeType: string;

    description?: string;

    status: string;
}

export interface CompanyAdministrator {
    user: CompanyAdministratorUser;

    companyAccess: CompanyAdministratorAccess;

    role: CompanyAdministratorRole;
}

export interface CompanyAdministratorResponse {
    administrator: CompanyAdministrator | null;
}

export interface CreateCompanyAdministratorResponse {
    company: CompanyAdministratorCompany;

    administrator: CompanyAdministratorUser;

    companyAccess: CompanyAdministratorAccess;

    role: CompanyAdministratorRole;
}