export type RoleStatus = "ACTIVE" | "INACTIVE";

export type RoleScopeType =
    | "GLOBAL"
    | "COMPANY"
    | "DEPARTMENT"
    | "TEAM";

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

    /**
     * System roles cannot be deleted.
     */
    isSystemRole: boolean;

    /**
     * Controls whether structural role details
     * can be modified.
     */
    isEditable: boolean;

    /**
     * Controls whether the permission set
     * can be modified.
     *
     * COMPANY_ADMIN -> false
     * TEAM_LEAD     -> true
     * EMPLOYEE      -> true
     * Custom roles  -> true
     */
    isPermissionEditable: boolean;

    status: RoleStatus;

    createdAt: string;
    updatedAt: string;
}

export interface CreateRolePayload {
    name: string;
    code: string;
    description?: string;
    permissionIds: string[];
    scopeType: Exclude<RoleScopeType, "GLOBAL">;
    status: RoleStatus;
}

export interface UpdateRolePayload {
    name?: string;
    code?: string;
    description?: string;
    status?: RoleStatus;
}

export interface RolePagination {
    page: number;
    limit: number;
    totalRecords: number;
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
    scopeType?: Exclude<RoleScopeType, "GLOBAL">;
    isSystemRole?: boolean;
    sortBy?:
    | "name"
    | "code"
    | "status"
    | "scopeType"
    | "createdAt"
    | "updatedAt";
    sortOrder?: "asc" | "desc";
}