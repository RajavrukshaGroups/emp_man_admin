export type PlatformAdminStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

export interface PlatformAdminUser {
    _id: string;

    firstName: string;
    middleName?: string;
    lastName: string;

    displayName: string;

    email: string;
    mobile?: string | null;

    profilePhoto?: string;

    gender?: string;
    dateOfBirth?: string | null;

    status: string;

    emailVerified: boolean;
    mobileVerified: boolean;

    lastLoginAt?: string | null;

    createdAt?: string;
    updatedAt?: string;
}

export interface PlatformAdminRole {
    _id: string;

    name: string;
    code: string;

    description?: string;

    scopeType: "GLOBAL";

    status: string;

    isSystemRole?: boolean;
    isEditable?: boolean;

    permissionIds?: Array<{
        _id: string;
        code: string;
        name: string;
        module: string;
        action: string;
        description?: string;
        status: string;
    }>;
}

export interface PlatformRole {
    _id: string;

    name: string;
    code: string;

    description?: string;

    scopeType: "GLOBAL";

    isEditable: boolean;
    isSystemRole: boolean;

    status: "ACTIVE" | "INACTIVE";
}

export interface PlatformRoleListData {
    roles: PlatformRole[];
}

export interface PlatformAdminAuditUser {
    _id: string;

    firstName?: string;
    lastName?: string;
    displayName?: string;

    email?: string;
}

export interface PlatformAdmin {
    _id: string;

    userId: PlatformAdminUser;

    roleId: PlatformAdminRole;

    status: PlatformAdminStatus;

    createdBy?: PlatformAdminAuditUser | string | null;
    updatedBy?: PlatformAdminAuditUser | string | null;

    deletedBy?: PlatformAdminAuditUser | string | null;

    deletedAt?: string | null;

    isDeleted?: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface PlatformAdminListRecord {
    _id: string;

    status: PlatformAdminStatus;

    createdAt: string;
    updatedAt: string;

    createdBy?: string | null;
    updatedBy?: string | null;

    user: PlatformAdminUser;

    role: PlatformAdminRole;
}

export interface PlatformAdminPagination {
    page: number;
    limit: number;

    totalRecords: number;
    totalPages: number;

    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PlatformAdminListData {
    records: PlatformAdminListRecord[];

    pagination: PlatformAdminPagination;
}

export interface PlatformAdminListParams {
    page?: number;
    limit?: number;

    search?: string;

    status?: PlatformAdminStatus;

    sortBy?:
    | "createdAt"
    | "updatedAt"
    | "status";

    sortOrder?: "asc" | "desc";
}

export interface CreatePlatformAdminPayload {
    firstName: string;
    middleName?: string;
    lastName: string;

    displayName?: string;

    email: string;
    mobile?: string;

    password: string;

    roleId: string;

    status?: PlatformAdminStatus;

    emailVerified?: boolean;
    mobileVerified?: boolean;
}

export interface UpdatePlatformAdminPayload {
    firstName?: string;
    middleName?: string;
    lastName?: string;

    displayName?: string;

    email?: string;
    mobile?: string;

    roleId?: string;

    emailVerified?: boolean;
    mobileVerified?: boolean;
}

export interface ResetPlatformAdminPasswordPayload {
    password: string;
    confirmPassword: string;
}

export interface ResetPlatformAdminPasswordResponse {
    platformAccessId: string;
    userId: string;
}