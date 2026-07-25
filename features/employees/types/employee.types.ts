export type EmployeeGender =
    | "MALE"
    | "FEMALE"
    | "OTHER"
    | "PREFER_NOT_TO_SAY";

export type MaritalStatus =
    | "SINGLE"
    | "MARRIED"
    | "DIVORCED"
    | "WIDOWED"
    | "SEPARATED"
    | "OTHER";

export type BloodGroup =
    | "A_POSITIVE"
    | "A_NEGATIVE"
    | "B_POSITIVE"
    | "B_NEGATIVE"
    | "AB_POSITIVE"
    | "AB_NEGATIVE"
    | "O_POSITIVE"
    | "O_NEGATIVE"
    | "UNKNOWN";

export type BankAccountType =
    | "SAVINGS"
    | "CURRENT"
    | "SALARY"
    | "OTHER";

export type TaxRegime = "OLD" | "NEW";

export type EmployeeStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "ARCHIVED";

export interface EmployeeAddress {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface EmployeePersonalDetails {
    dateOfBirth?: string | null;
    gender?: EmployeeGender | null;
    maritalStatus?: MaritalStatus | null;
    bloodGroup?: BloodGroup | null;
    nationality?: string;
}

export interface EmployeeContactDetails {
    personalEmail?: string;
    alternateMobile?: string;
    currentAddress?: EmployeeAddress;
    permanentAddress?: EmployeeAddress;
    isPermanentAddressSame?: boolean;
}

export interface EmployeeEmergencyContact {
    name: string;
    relationship: string;
    mobile: string;
    alternateMobile?: string;
}

export interface EmployeeBankDetails {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountType?: BankAccountType | null;
}

export interface EmployeeStatutoryDetails {
    panNumber?: string;
    aadhaarNumber?: string;
    uanNumber?: string;
    esiNumber?: string;
    pfNumber?: string;
    taxRegime?: TaxRegime | null;
}

export interface EmployeeDocument {
    _id?: string;
    documentType: string;
    documentName?: string;
    documentNumber?: string;
    fileUrl?: string;
    expiryDate?: string | null;
    isVerified?: boolean;
    verifiedBy?: EmployeeAuditUser | string | null;
    verifiedAt?: string | null;
}

export interface CreateEmployeePayload {
    companyAccessId: string;

    personalDetails?: EmployeePersonalDetails;

    contactDetails?: EmployeeContactDetails;

    emergencyContacts?: EmployeeEmergencyContact[];

    bankDetails?: EmployeeBankDetails;

    statutoryDetails?: EmployeeStatutoryDetails;

    documents?: EmployeeDocument[];
}

export interface EmployeeUserReference {
    _id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    displayName: string;
    email: string;
    mobile?: string;
    profilePhoto?: string;
    status?: string;
}

export interface EmployeeCompanyReference {
    _id: string;
    name: string;
    legalName?: string;
    code: string;
    slug?: string;
    logo?: string;
    status?: string;
}

export interface EmployeeDepartmentReference {
    _id: string;
    name: string;
    code: string;
    status?: string;
}

export interface EmployeeTeamReference {
    _id: string;
    name: string;
    code: string;
    status?: string;
}

export interface EmployeeRoleReference {
    _id: string;
    name: string;
    code: string;
    scopeType?: string;
    status?: string;
}

export interface EmployeeReportingManagerReference {
    _id: string;
    employeeCode?: string;
    designation?: string;
    userId?: EmployeeUserReference | string;
    departmentId?: EmployeeDepartmentReference | string | null;
    teamId?: EmployeeTeamReference | string | null;
    status?: string;
}

export interface EmployeeCompanyAccessReference {
    _id: string;
    employeeCode: string;
    designation?: string;
    employmentType?: string;

    departmentId?: EmployeeDepartmentReference | string | null;
    teamId?: EmployeeTeamReference | string | null;
    roleId?: EmployeeRoleReference | string | null;

    reportingManagerId?:
    | EmployeeReportingManagerReference
    | string
    | null;

    joiningDate?: string | null;
    probationEndDate?: string | null;
    lastWorkingDate?: string | null;

    workLocationType?: string;
    workLocationName?: string;

    status?: string;
}

export interface EmployeeAuditUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
}

export interface Employee {
    _id: string;

    companyId: EmployeeCompanyReference | string;
    companyAccessId: EmployeeCompanyAccessReference | string;
    userId: EmployeeUserReference | string;

    personalDetails?: EmployeePersonalDetails;
    contactDetails?: EmployeeContactDetails;

    emergencyContacts?: EmployeeEmergencyContact[];

    bankDetails?: EmployeeBankDetails;
    statutoryDetails?: EmployeeStatutoryDetails;

    documents?: EmployeeDocument[];

    status: EmployeeStatus;

    createdBy?: EmployeeAuditUser | string | null;
    updatedBy?: EmployeeAuditUser | string | null;
    deletedBy?: EmployeeAuditUser | string | null;

    isDeleted: boolean;
    deletedAt?: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface EmployeePagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface EmployeeListResult {
    records: Employee[];
    pagination: EmployeePagination;
}

export interface EmployeeListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: EmployeeStatus | "";
    departmentId?: string;
    teamId?: string;
    roleId?: string;
    employmentType?: string;
    sortBy?: "createdAt" | "updatedAt" | "status";
    sortOrder?: "asc" | "desc";
}