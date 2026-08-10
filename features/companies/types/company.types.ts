export type CompanyStatus = "ACTIVE" | "INACTIVE";

export interface CompanyAddress {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}

export interface Company {
    _id: string;

    name: string;
    legalName: string;

    code: string;
    slug: string;

    logo: string;

    email: string;
    phone: string;
    website: string;

    address: CompanyAddress;

    timezone: string;
    currency: string;

    dateFormat:
    | "DD/MM/YYYY"
    | "MM/DD/YYYY"
    | "YYYY-MM-DD";

    timeFormat:
    | "12_HOUR"
    | "24_HOUR";

    status: CompanyStatus;

    createdBy?: string | null;
    updatedBy?: string | null;

    deletedBy?: string | null;
    deletedAt?: string | null;

    isDeleted: boolean;

    createdAt: string;
    updatedAt: string;
}

/**
 * Company Administrator
 */
export interface CompanyAdministratorUser {
    _id: string;

    firstName: string;
    middleName?: string;
    lastName: string;

    displayName: string;

    email: string;
    mobile?: string;

    profilePhoto?: string;

    gender?: string;
    dateOfBirth?: string | null;

    status: string;

    emailVerified: boolean;
    mobileVerified: boolean;

    onboardingStatus?: string;
    onboardingCompletedAt?: string | null;

    createdAt?: string;
    updatedAt?: string;
}

export interface CompanyAdministratorAccess {
    _id: string;

    employeeCode?: string | null;
    designation?: string;

    employmentType?: string;

    joiningDate?: string | null;

    workLocationType?: string;
    workLocationName?: string;

    isPrimaryCompany: boolean;

    status: string;

    notes?: string;

    createdAt?: string;
    updatedAt?: string;
}

export interface CompanyAdministratorRole {
    _id: string;

    name: string;
    code: string;

    scopeType: string;

    description?: string;

    status: string;
}

export interface CompanyAdministrator {
    user: CompanyAdministratorUser;

    companyAccess: CompanyAdministratorAccess;

    role: CompanyAdministratorRole;
}

export interface CompanyAdministratorResponse {
    administrator: CompanyAdministrator | null;
}

export interface CompanyPagination {
    page: number;
    limit: number;

    totalRecords: number;
    totalPages: number;

    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface CompanyListData {
    records: Company[];
    pagination: CompanyPagination;
}

export interface CompanyListParams {
    page?: number;
    limit?: number;

    search?: string;

    status?: CompanyStatus;

    sortBy?:
    | "name"
    | "code"
    | "createdAt"
    | "updatedAt"
    | "status";

    sortOrder?: "asc" | "desc";
}

export interface CreateCompanyPayload {
    name: string;
    legalName?: string;

    code: string;

    logo?: string;

    email?: string;
    phone?: string;
    website?: string;

    address?: Partial<CompanyAddress>;

    timezone?: string;
    currency?: string;

    dateFormat?:
    | "DD/MM/YYYY"
    | "MM/DD/YYYY"
    | "YYYY-MM-DD";

    timeFormat?:
    | "12_HOUR"
    | "24_HOUR";

    status?: CompanyStatus;
}

export interface UpdateCompanyPayload
    extends Partial<CreateCompanyPayload> { }