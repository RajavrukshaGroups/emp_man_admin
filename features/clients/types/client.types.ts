export type ClientStatus = "ACTIVE" | "INACTIVE";

export type ClientType = "EXTERNAL" | "IN_HOUSE";

export type ClientEngagementType =
    | "RETAINER"
    | "PROJECT"
    | "ONE_TIME"
    | "ONGOING"
    | "OTHER"

export interface ClientCompanyReference {
    _id: string;
    name: string;
    legalName?: string;
    code: string;
    slug?: string;
    logo?: string;
    status: string;
}

export interface ClientAuditUserReference {
    _id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface ClientAddress {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface Client {
    _id: string;

    companyId:
    | string
    | ClientCompanyReference;

    name: string;

    code: string;

    clientType: ClientType;

    engagementType: ClientEngagementType;

    contactPerson?: string;

    email?: string;

    mobile?: string;

    alternateMobile?: string;

    website?: string;

    address?: ClientAddress;

    industry?: string;

    notes?: string;

    status: ClientStatus;

    createdBy:
    | string
    | ClientAuditUserReference
    | null;

    updatedBy:
    | string
    | ClientAuditUserReference
    | null;

    deletedBy:
    | string
    | ClientAuditUserReference
    | null;

    deletedAt: string | null;

    isDeleted: boolean;

    createdAt: string;

    updatedAt: string;
}

export interface ClientPagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ClientListResult {
    records: Client[];
    pagination: ClientPagination;
}

export interface ClientListQuery {
    page?: number;
    limit?: number;

    search?: string;

    status?: ClientStatus;
    clientType?: ClientType;
    engagementType?: ClientEngagementType;

    industry?: string;

    sortBy?:
    | "name"
    | "code"
    | "clientType"
    | "engagementType"
    | "industry"
    | "status"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

export interface CreateClientRequest {
    name: string;
    code: string;

    clientType?: ClientType;
    engagementType?: ClientEngagementType;

    contactPerson?: string;
    email?: string;
    mobile?: string;
    alternateMobile?: string;
    website?: string;

    address?: ClientAddress;

    industry?: string;
    notes?: string;

    status?: ClientStatus;
}

export interface UpdateClientRequest {
    name?: string;
    code?: string;

    clientType?: ClientType;
    engagementType?: ClientEngagementType;

    contactPerson?: string;
    email?: string;
    mobile?: string;
    alternateMobile?: string;
    website?: string;

    address?: ClientAddress;

    industry?: string;
    notes?: string;
}

export interface UpdateClientStatusRequest {
    status: ClientStatus;
}