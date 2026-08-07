import type { User } from "@/features/users/types/user.types";

export type TeamStatus = "ACTIVE" | "INACTIVE";

export interface TeamDepartmentReference {
    _id: string;

    name: string;
    code: string;

    description?: string;

    status?: string;

    parentDepartmentId?: string | null;
}

export interface TeamLeadReference {
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

export interface TeamAuditUser {
    _id: string;

    firstName?: string;
    lastName?: string;

    displayName?: string;
    email?: string;
}

export interface TeamStatistics {
    teamLeadCount: number;
    assignedMemberCount: number;
}

export interface Team {
    _id: string;

    companyId: string;

    departmentId:
    | TeamDepartmentReference
    | string;

    name: string;
    code: string;

    description?: string;

    teamLeadIds:
    | TeamLeadReference[]
    | string[];

    status: TeamStatus;

    createdBy?: TeamAuditUser | string | null;
    updatedBy?: TeamAuditUser | string | null;

    deletedBy?: string | null;
    deletedAt?: string | null;

    isDeleted: boolean;

    createdAt: string;
    updatedAt: string;

    statistics?: TeamStatistics;
}

export interface CreateTeamPayload {
    departmentId: string;

    name: string;
    code: string;

    description?: string;

    teamLeadIds?: string[];

    status?: TeamStatus;
}

export interface UpdateTeamPayload {
    departmentId?: string;

    name?: string;
    code?: string;

    description?: string;
}

export interface TeamPagination {
    page: number;
    limit: number;

    total: number;
    totalPages: number;

    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface TeamListData {
    teams: Team[];
    pagination: TeamPagination;
}

export interface TeamListParams {
    page?: number;
    limit?: number;

    search?: string;

    departmentId?: string;

    status?: TeamStatus;

    teamLeadId?: string;

    sortBy?:
    | "name"
    | "code"
    | "status"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

export interface AssignTeamLeadsPayload {
    teamLeadIds: string[];
}

export interface AssignTeamMembersPayload {
    memberIds: string[];
}

export interface AssignedTeamMember {
    _id: string;

    userId: unknown;

    employeeCode?: string | null;
    designation?: string;

    employmentType?: string;
    status?: string;

    departmentId?: unknown;
    teamId?: unknown;
}

export interface AssignTeamMembersResult {
    team: Team;
    members: AssignedTeamMember[];
}

export interface RemoveTeamMembersResult {
    teamId: string;
    removedMemberIds: string[];
    removedCount: number;
}