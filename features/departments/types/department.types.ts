import type { User } from "@/features/users/types/user.types";

export type DepartmentStatus = "ACTIVE" | "INACTIVE";

export interface DepartmentHeadReference {
    _id: string;

    userId?:
    | Pick<
        User,
        | "_id"
        | "firstName"
        | "middleName"
        | "lastName"
        | "displayName"
        | "email"
        | "mobile"
        | "profilePhoto"
    >
    | string;

    employeeCode?: string | null;
    designation?: string;
    employmentType?: string;
    status?: string;

    departmentId?: string | null;
    teamId?: string | null;
}

export interface ParentDepartmentReference {
    _id: string;
    name: string;
    code: string;
    status?: DepartmentStatus;
}

export interface DepartmentAuditUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface DepartmentStatistics {
    childDepartmentCount: number;
    assignedEmployeeCount: number;
}

export interface Department {
    _id: string;

    companyId: string;

    name: string;
    code: string;
    description?: string;

    departmentHeadId?:
    | DepartmentHeadReference
    | string
    | null;

    parentDepartmentId?:
    | ParentDepartmentReference
    | string
    | null;

    status: DepartmentStatus;

    createdBy?: DepartmentAuditUser | string | null;
    updatedBy?: DepartmentAuditUser | string | null;

    deletedBy?: string | null;
    deletedAt?: string | null;

    isDeleted: boolean;

    createdAt: string;
    updatedAt: string;

    statistics?: DepartmentStatistics;
}

export interface CreateDepartmentPayload {
    name: string;
    code: string;

    description?: string;

    departmentHeadId?: string | null;
    parentDepartmentId?: string | null;

    status?: DepartmentStatus;
}

export interface UpdateDepartmentPayload {
    name?: string;
    code?: string;

    description?: string;

    departmentHeadId?: string | null;
    parentDepartmentId?: string | null;
}

export interface DepartmentPagination {
    page: number;
    limit: number;

    total: number;
    totalPages: number;

    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface DepartmentListData {
    departments: Department[];
    pagination: DepartmentPagination;
}

export interface DepartmentListParams {
    page?: number;
    limit?: number;

    search?: string;

    status?: DepartmentStatus;

    departmentHeadId?: string;
    parentDepartmentId?: string;

    hasParent?: boolean;

    sortBy?:
    | "name"
    | "code"
    | "status"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}