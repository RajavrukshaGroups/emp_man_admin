export interface Permission {
    _id: string;

    name: string;

    code: string;

    module: string;

    action: string;

    description?: string;

    status?: string;

    createdAt?: string;

    updatedAt?: string;
}

export interface PermissionGroup {
    module: string;

    permissions: Permission[];
}