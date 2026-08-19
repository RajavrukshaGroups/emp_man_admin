export type WorkCategoryStatus =
    | "ACTIVE"
    | "INACTIVE";

export interface WorkCategoryDepartmentReference {
    _id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
}

export interface WorkCategoryTeamReference {
    _id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
}

export interface WorkCategoryCompanyReference {
    _id: string;
    name: string;
    legalName?: string;
    code: string;
    slug?: string;
    logo?: string;
    status: string;
}

export interface WorkCategoryAuditUserReference {
    _id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface WorkCategory {
    _id: string;

    companyId:
    | string
    | WorkCategoryCompanyReference;

    departmentId:
    | string
    | WorkCategoryDepartmentReference;

    teamId:
    | string
    | WorkCategoryTeamReference;

    name: string;

    code: string;

    description?: string;

    unitLabel: string;

    workloadWeight: number;

    status: WorkCategoryStatus;

    createdBy:
    | string
    | WorkCategoryAuditUserReference
    | null;

    updatedBy:
    | string
    | WorkCategoryAuditUserReference
    | null;

    deletedBy:
    | string
    | WorkCategoryAuditUserReference
    | null;

    deletedAt: string | null;

    isDeleted: boolean;

    createdAt: string;

    updatedAt: string;
}

export interface WorkCategoryPagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface WorkCategoryListResult {
    records: WorkCategory[];
    pagination: WorkCategoryPagination;
}

export interface WorkCategoryListQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: WorkCategoryStatus;
    departmentId?: string;
    teamId?: string;
    sortBy?:
    | "name"
    | "code"
    | "unitLabel"
    | "workloadWeight"
    | "status"
    | "createdAt"
    | "updatedAt";
    sortOrder?: "asc" | "desc";
}

/**
 * ============================================================
 * WORK CATEGORY MUTATION REQUESTS
 * ============================================================
 */

export interface CreateWorkCategoryRequest {
    departmentId: string;
    teamId: string;
    name: string;
    code: string;
    description?: string;
    unitLabel: string;
    workloadWeight?: number;
}

export interface UpdateWorkCategoryRequest {
    departmentId?: string;
    teamId?: string;
    name?: string;
    code?: string;
    description?: string;
    unitLabel?: string;
    workloadWeight?: number;
}

export interface UpdateWorkCategoryStatusRequest {
    status: WorkCategoryStatus;
}