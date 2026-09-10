// ============================================================
// ATTENDANCE ENUM / UNION TYPES
// ============================================================

export type AttendanceMode =
    | "OFFICE"
    | "FIELD"
    | "HYBRID"
    | "REMOTE";

export type AttendanceStatus =
    | "PENDING"
    | "PRESENT"
    | "HALF_DAY"
    | "ABSENT"
    | "ON_LEAVE"
    | "HOLIDAY"
    | "WEEKLY_OFF";

export type WorkSessionStatus =
    | "OPEN"
    | "CLOSED";

export type BreakStatus =
    | "ACTIVE"
    | "COMPLETED";

export type BreakType =
    | "LUNCH"
    | "TEA"
    | "PERSONAL"
    | "OTHER";


// ============================================================
// ATTENDANCE LOCATION
// ============================================================

export interface AttendanceLocationReference {
    _id: string;

    name: string;

    code: string;

    locationType: string;

    latitude: number;

    longitude: number;

    geofenceRadiusMeters: number;

    allowCheckIn?: boolean;

    allowCheckOut?: boolean;

    status: string;
}


export interface AttendanceLocationInput {
    latitude: number;

    longitude: number;

    accuracy?: number | null;

    capturedAt?: string;

    attendanceLocationId?: string | null;

    addressText?: string;
}


export interface LocationEvidence {
    latitude: number;

    longitude: number;

    accuracy?: number | null;

    capturedAt?: string | null;

    attendanceLocationId?:
    | AttendanceLocationReference
    | string
    | null;

    distanceFromLocationMeters?: number | null;

    withinGeofence?: boolean | null;

    ipAddress?: string;

    userAgent?: string;
}


// ============================================================
// WORK SESSION
// ============================================================

export interface WorkSession {
    _id: string;

    checkInAt: string;

    checkOutAt: string | null;

    checkInLocation: LocationEvidence | null;

    checkOutLocation: LocationEvidence | null;

    checkInSource:
    | "EMPLOYEE"
    | "ADMIN_CORRECTION";

    checkOutSource:
    | "EMPLOYEE"
    | "SYSTEM_AUTO_CLOSE"
    | "ADMIN_CORRECTION"
    | null;

    workedMinutes: number;

    status: WorkSessionStatus;
}


// ============================================================
// BREAK
// ============================================================

export interface AttendanceBreak {
    _id: string;

    startedAt: string;

    endedAt: string | null;

    durationMinutes: number;

    type: BreakType;

    notes?: string;

    endNotes?: string;

    status: BreakStatus;
}


// ============================================================
// SHIFT
// ============================================================

export interface ShiftSnapshot {
    name: string;

    code: string;

    startTime: string;

    endTime: string;

    isOvernight: boolean;

    fullDayMinutes: number;

    halfDayMinutes: number;

    lateGraceMinutes: number;

    earlyCheckoutGraceMinutes: number;

    standardBreakMinutes: number;

    maxBreakMinutes: number;

    allowMultipleBreaks: boolean;
}


/**
 * Populated Shift document.
 *
 * Important:
 * companyAccessId.shiftId = employee's CURRENT assigned shift.
 * AttendanceRecord.shiftId / shiftSnapshot = shift used for that
 * historical attendance record.
 */
export interface AttendanceShiftReference extends ShiftSnapshot {
    _id: string;

    status?: string;

    workingHours?: number;

    id?: string;
}


// ============================================================
// ATTENDANCE ANOMALY
// ============================================================

export interface AttendanceAnomaly {
    _id: string;

    type:
    | "MISSING_CHECK_IN"
    | "MISSING_CHECK_OUT"
    | "LATE_ARRIVAL"
    | "EARLY_CHECKOUT"
    | "EXCESSIVE_BREAK"
    | "OUTSIDE_GEOFENCE"
    | "LOW_LOCATION_ACCURACY"
    | "OVERLAPPING_SESSION"
    | "OTHER";

    status:
    | "OPEN"
    | "RESOLVED"
    | "IGNORED";

    description: string;

    detectedAt: string;

    resolvedAt?: string | null;

    resolvedBy?: string | null;

    resolutionNote?: string;
}


// ============================================================
// ATTENDANCE ADJUSTMENT
// ============================================================

export interface AttendanceAdjustment {
    _id: string;

    type: string;

    minutes: number;

    reason: string;

    approvedBy?: string | null;

    approvedAt?: string | null;

    createdAt?: string;

    updatedAt?: string;
}


// ============================================================
// MANAGEMENT POPULATED REFERENCES
// ============================================================

export interface AttendanceRoleReference {
    _id: string;

    code: string;

    name: string;

    scopeType:
    | "GLOBAL"
    | "COMPANY"
    | "DEPARTMENT"
    | "TEAM";

    status: string;
}


export interface AttendanceDepartmentReference {
    _id: string;

    name: string;

    code: string;

    status: string;
}


export interface AttendanceTeamReference {
    _id: string;

    name: string;

    code: string;

    status: string;
}


export interface AttendanceEmployeeUserReference {
    _id: string;

    firstName: string;

    middleName?: string;

    lastName: string;

    displayName?: string;

    email?: string;

    mobile?: string;

    profilePhoto?: string;

    status?: string;
}


export interface AttendanceEmployeeReference {
    _id: string;

    companyAccessId?: string;

    userId: AttendanceEmployeeUserReference;

    status?: string;
}


export interface AttendanceCompanyAccessReference {
    _id: string;

    userId?: string;

    roleId?: AttendanceRoleReference | string | null;

    employeeCode?: string;

    designation?: string;

    employmentType?: string;

    departmentId?:
    | AttendanceDepartmentReference
    | string
    | null;

    teamId?:
    | AttendanceTeamReference
    | string
    | null;

    reportingManagerId?: string | null;

    workLocationType?: string;

    workLocationName?: string;

    status?: string;

    attendanceLocationId?:
    | AttendanceLocationReference
    | string
    | null;

    attendanceMode?: AttendanceMode;

    shiftId?:
    | AttendanceShiftReference
    | string
    | null;
}


// ============================================================
// ATTENDANCE RECORD
// ============================================================

export interface AttendanceRecord {
    _id: string;

    companyId?: string;

    /**
     * Populated for management attendance APIs.
     */
    companyAccessId?:
    | AttendanceCompanyAccessReference
    | string
    | null;

    /**
     * Populated for management attendance APIs.
     */
    employeeId?:
    | AttendanceEmployeeReference
    | string
    | null;

    attendanceDate: string;

    attendanceMode: AttendanceMode;

    /**
     * Historical shift document attached to this attendance.
     */
    shiftId?:
    | AttendanceShiftReference
    | string
    | null;

    /**
     * Historical snapshot captured when attendance was created.
     */
    shiftSnapshot?: ShiftSnapshot;

    workSessions: WorkSession[];

    breaks: AttendanceBreak[];

    firstCheckInAt: string | null;

    lastCheckOutAt: string | null;

    totalWorkedMinutes: number;

    totalBreakMinutes: number;

    lateMinutes: number;

    earlyCheckoutMinutes: number;

    isLate: boolean;

    isEarlyCheckout: boolean;

    attendanceStatus: AttendanceStatus;

    calculationStatus: string;

    calculatedAt?: string | null;

    payrollStatus: string;

    payrollPeriod?: string | null;

    notes?: string;

    anomalies?: AttendanceAnomaly[];

    adjustments?: AttendanceAdjustment[];

    createdAt?: string;

    updatedAt?: string;
}


// ============================================================
// CHECK-IN REQUEST
// ============================================================

export interface CheckInPayload {
    location?: AttendanceLocationInput | null;

    attendanceLocationId?: string | null;

    notes?: string;
}


// ============================================================
// CHECK-OUT REQUEST
// ============================================================

export interface CheckOutPayload {
    location?: AttendanceLocationInput | null;

    attendanceLocationId?: string | null;

    notes?: string;
}


// ============================================================
// START BREAK REQUEST
// ============================================================

export interface StartBreakPayload {
    type?: BreakType;

    notes?: string;
}


// ============================================================
// END BREAK REQUEST
// ============================================================

export interface EndBreakPayload {
    notes?: string;
}


// ============================================================
// ACTIVE FIELD VISIT
// ============================================================

export interface ActiveFieldVisit {
    _id: string;

    visitType?: string;

    siteName?: string;

    purpose?: string;

    startedAt?: string;
}


// ============================================================
// TODAY ATTENDANCE STATE
// ============================================================

export interface AttendanceTodayState {
    checkedIn: boolean;

    onBreak: boolean;

    onFieldVisit: boolean;

    canCheckIn: boolean;

    canStartBreak: boolean;

    canEndBreak: boolean;

    canStartFieldVisit: boolean;

    canCheckOut: boolean;

    activeFieldVisit: ActiveFieldVisit | null;
}


// ============================================================
// GET MY TODAY ATTENDANCE RESPONSE
// ============================================================

export interface MyTodayAttendanceResponse {
    attendanceDate: string;

    attendance: AttendanceRecord | null;

    state: AttendanceTodayState;
}


// ============================================================
// PAGINATION
// ============================================================

export interface AttendanceHistoryPagination {
    page: number;

    limit: number;

    total: number;

    totalPages: number;

    hasNextPage: boolean;

    hasPreviousPage: boolean;
}


// ============================================================
// MY ATTENDANCE HISTORY
// ============================================================

export interface MyAttendanceHistoryQuery {
    page?: number;

    limit?: number;

    fromDate?: string;

    toDate?: string;

    attendanceStatus?: AttendanceStatus;
}


export interface MyAttendanceHistoryResponse {
    items: AttendanceRecord[];

    pagination: AttendanceHistoryPagination;
}


// ============================================================
// MANAGEMENT ATTENDANCE LIST
// ============================================================

/**
 * Query parameters already verified against the management
 * attendance API.
 *
 * We can extend this later with department/team/companyAccess
 * filters only after confirming the backend supports them.
 */
export interface AttendanceManagementQuery {
    page?: number;

    limit?: number;

    date?: string;

    fromDate?: string;

    toDate?: string;

    attendanceStatus?: AttendanceStatus;

    isLate?: boolean;
}


export interface AttendanceManagementResponse {
    items: AttendanceRecord[];

    pagination: AttendanceHistoryPagination;
}


// ============================================================
// DAILY ATTENDANCE SUMMARY
// ============================================================

export type DailyAttendanceStatus =
    | "NOT_CHECKED_IN"
    | "PENDING"
    | "PRESENT"
    | "HALF_DAY"
    | "ABSENT"
    | "ON_LEAVE"
    | "HOLIDAY"
    | "WEEKLY_OFF";


export interface DailyAttendanceSummaryQuery {
    page?: number;

    limit?: number;

    date: string;

    departmentId?: string;

    teamId?: string;

    shiftId?: string;

    attendanceStatus?: DailyAttendanceStatus;

    search?: string;
}


export interface DailyAttendanceSummaryRow {
    companyAccessId: string;

    employeeId: string;

    employeeCode: string;

    employeeName: string;

    designation: string;

    departmentId:
    | AttendanceDepartmentReference
    | null;

    teamId:
    | AttendanceTeamReference
    | null;

    shiftId:
    | AttendanceShiftReference
    | null;

    attendanceMode: AttendanceMode;

    attendanceLocationId:
    | AttendanceLocationReference
    | null;

    attendanceDate: string;

    attendanceId: string | null;

    attendanceStatus: DailyAttendanceStatus;

    attendance: AttendanceRecord | null;
}


export interface DailyAttendanceSummaryCounts {
    totalEmployees: number;

    notCheckedIn: number;

    pending: number;

    present: number;

    halfDay: number;

    absent: number;
}


export interface DailyAttendanceSummaryResponse {
    date: string;

    items: DailyAttendanceSummaryRow[];

    summary: DailyAttendanceSummaryCounts;

    pagination: AttendanceHistoryPagination;
}