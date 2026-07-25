import type { User } from "@/features/users/types/user.types";

export type EmploymentType =
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN"
    | "CONSULTANT"
    | "FREELANCER";

export type CompanyAccessStatus =
    | "ONBOARDING"
    | "ACTIVE"
    | "INACTIVE"
    | "RESIGNED"
    | "TERMINATED";

export type WorkLocationType =
    | "HEAD_OFFICE"
    | "BRANCH"
    | "REMOTE"
    | "HYBRID"
    | "CLIENT_LOCATION";

export interface CompanyAccessRole {
    _id: string;
    name: string;
    code: string;
    description?: string;
    scopeType: string;
    status: string;
}

export interface CompanyAccessCompany {
    _id: string;
    name: string;
    slug: string;
    code: string;
    logo?: string;
    status: string;
}

export interface ReportingManagerAccess {
    _id: string;
    employeeCode?: string | null;
    designation?: string;
    status: CompanyAccessStatus;
    userId?: Pick<
        User,
        | "_id"
        | "firstName"
        | "middleName"
        | "lastName"
        | "displayName"
        | "email"
        | "mobile"
        | "profilePhoto"
    >;
}

export interface CompanyAccess {
    _id: string;

    userId: User;
    companyId: CompanyAccessCompany;
    roleId: CompanyAccessRole;

    employeeCode?: string | null;
    designation: string;

    employmentType: EmploymentType;

    departmentId?: string | null;
    teamId?: string | null;

    reportingManagerId?: ReportingManagerAccess | null;

    joiningDate?: string | null;
    probationEndDate?: string | null;
    lastWorkingDate?: string | null;

    workLocationType: WorkLocationType;
    workLocationName: string;

    isPrimaryCompany: boolean;

    status: CompanyAccessStatus;

    notes: string;

    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;

    isDeleted: boolean;
    deletedAt?: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CreateCompanyAccessPayload {
    userId: string;
    roleId: string;

    employeeCode?: string | null;
    designation?: string;

    employmentType: EmploymentType;

    departmentId?: string | null;
    teamId?: string | null;
    reportingManagerId?: string | null;

    joiningDate?: string | null;
    probationEndDate?: string | null;
    lastWorkingDate?: string | null;

    workLocationType: WorkLocationType;
    workLocationName?: string;

    isPrimaryCompany: boolean;

    status: CompanyAccessStatus;

    notes?: string;
}

export interface CompanyAccessPagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface CompanyAccessListData {
    records: CompanyAccess[];
    pagination: CompanyAccessPagination;
}

export interface CompanyAccessListParams {
    page?: number;
    limit?: number;
    search?: string;

    roleId?: string;
    departmentId?: string;
    teamId?: string;
    reportingManagerId?: string;

    employmentType?: EmploymentType;
    workLocationType?: WorkLocationType;
    status?: CompanyAccessStatus;

    isPrimaryCompany?: boolean;

    joiningDateFrom?: string;
    joiningDateTo?: string;

    sortBy?:
    | "employeeCode"
    | "designation"
    | "employmentType"
    | "joiningDate"
    | "status"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}