// ============================================================
// ATTENDANCE LOCATION TYPES
// ============================================================

export type AttendanceLocationType =
    | "OFFICE"
    | "BRANCH"
    | "WAREHOUSE"
    | "PROJECT_SITE"
    | "CLIENT_SITE"
    | "OTHER";

export type AttendanceLocationStatus =
    | "ACTIVE"
    | "INACTIVE";


// ============================================================
// ADDRESS
// ============================================================

export interface AttendanceLocationAddress {
    addressLine1?: string;

    addressLine2?: string;

    city?: string;

    district?: string;

    state?: string;

    country?: string;

    postalCode?: string;
}


// ============================================================
// ATTENDANCE LOCATION
// ============================================================

export interface AttendanceLocation {
    _id: string;

    companyId: string;

    name: string;

    code: string;

    description?: string;

    locationType: AttendanceLocationType;

    clientId?: string | null;

    address?: AttendanceLocationAddress;

    latitude: number;

    longitude: number;

    geofenceRadiusMeters: number;

    allowCheckIn: boolean;

    allowCheckOut: boolean;

    allowFieldVisit: boolean;

    isDefault: boolean;

    effectiveFrom?: string | null;

    effectiveTo?: string | null;

    status: AttendanceLocationStatus;

    createdAt?: string;

    updatedAt?: string;
}


// ============================================================
// CREATE LOCATION
// ============================================================

export interface CreateAttendanceLocationPayload {
    name: string;

    code: string;

    description?: string;

    locationType: AttendanceLocationType;

    clientId?: string | null;

    address?: AttendanceLocationAddress;

    latitude: number;

    longitude: number;

    geofenceRadiusMeters: number;

    allowCheckIn?: boolean;

    allowCheckOut?: boolean;

    allowFieldVisit?: boolean;

    isDefault?: boolean;

    effectiveFrom?: string | null;

    effectiveTo?: string | null;

    status?: AttendanceLocationStatus;
}


// ============================================================
// UPDATE LOCATION
// ============================================================

export type UpdateAttendanceLocationPayload =
    Partial<CreateAttendanceLocationPayload>;


// ============================================================
// LOCATION LIST QUERY
// ============================================================

export interface AttendanceLocationListQuery {
    page?: number;

    limit?: number;

    status?: AttendanceLocationStatus;

    locationType?: AttendanceLocationType;

    clientId?: string;

    isDefault?: boolean;

    effectiveOn?: string;

    search?: string;
}


// ============================================================
// PAGINATION
// ============================================================

export interface AttendanceLocationPagination {
    page: number;

    limit: number;

    total: number;

    totalPages: number;

    hasNextPage: boolean;

    hasPreviousPage: boolean;
}


// ============================================================
// LOCATION LIST RESPONSE
// ============================================================

export interface AttendanceLocationListResponse {
    items: AttendanceLocation[];

    pagination: AttendanceLocationPagination;
}