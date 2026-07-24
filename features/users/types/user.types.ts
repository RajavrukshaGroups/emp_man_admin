export type UserGender =
    | "MALE"
    | "FEMALE"
    | "OTHER"
    | "PREFER_NOT_TO_SAY";

export type UserStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

export interface User {
    _id: string;

    firstName: string;
    middleName?: string;
    lastName: string;

    displayName: string;

    email: string;
    mobile?: string;

    profilePhoto?: string;

    gender?: UserGender;
    dateOfBirth?: string;

    status: UserStatus;

    emailVerified: boolean;
    mobileVerified: boolean;

    lastLoginAt?: string | null;
    passwordChangedAt?: string | null;

    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;

    isDeleted: boolean;
    deletedAt?: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface UserPagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface UserListData {
    records: User[];
    pagination: UserPagination;
}

export interface UserListParams {
    page?: number;
    limit?: number;

    search?: string;

    status?: UserStatus;
    gender?: UserGender;

    emailVerified?: boolean;
    mobileVerified?: boolean;

    sortBy?:
    | "firstName"
    | "lastName"
    | "displayName"
    | "email"
    | "mobile"
    | "status"
    | "lastLoginAt"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

export interface CreateUserPayload {
    firstName: string;
    middleName?: string;
    lastName: string;

    displayName?: string;

    email: string;
    mobile?: string;

    password: string;

    profilePhoto?: string;

    gender?: UserGender;
    dateOfBirth?: string;

    status: UserStatus;
}

export interface UpdateUserPayload {
    firstName?: string;
    middleName?: string;
    lastName?: string;

    displayName?: string;

    email?: string;
    mobile?: string;

    profilePhoto?: string;

    gender?: UserGender;
    dateOfBirth?: string;
}

export interface UpdateUserStatusPayload {
    status: UserStatus;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface ResetPasswordPayload {
    newPassword: string;
}