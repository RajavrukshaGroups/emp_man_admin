export type RoleStatus = "ACTIVE" | "INACTIVE";

export type RoleScopeType =
    | "PLATFORM"
    | "COMPANY";

export interface RolePermission {
    _id: string;
    name: string;
    code: string;
    module: string;
    action: string;
    description?: string;
    status: string;
}

/**
 * Permission returned by Permissions API
 */
export interface Permission {
    _id: string;
    code: string;
    name: string;
    module: string;
    action: string;
    description?: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface Role {
    _id: string;

    companyId?: string | null;

    name: string;
    code: string;
    description?: string;

    scopeType: RoleScopeType;

    permissionIds: Array<
        string | RolePermission
    >;

    isSystemRole: boolean;
    isEditable: boolean;

    status: RoleStatus;

    createdAt: string;
    updatedAt: string;
}

export interface CreateRolePayload {
    name: string;
    code: string;
    description?: string;
    permissionIds: string[];
    scopeType: "COMPANY";
    status: RoleStatus;
}

export interface RolePagination {
    page: number;
    limit: number;
    // total: number;
    totalRecords:number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface RoleListData {
  records: Role[];
  pagination: RolePagination;
}

export interface RoleListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: RoleStatus;
    sortBy?:
    | "name"
    | "code"
    | "status"
    | "createdAt"
    | "updatedAt";
    sortOrder?: "asc" | "desc";
}