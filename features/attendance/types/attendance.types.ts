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

    /**
     * Schedule compensation evidence.
     *
     * These fields do NOT change attendanceStatus or totalWorkedMinutes.
     * They only indicate whether late arrival / early checkout was
     * compensated through qualifying work outside scheduled shift hours.
     */
    isLateCompensated: boolean;

    lateCompensatedMinutes: number;

    isEarlyCheckoutCompensated: boolean;

    earlyCheckoutCompensatedMinutes: number;

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
// FIELD VISITS
// ============================================================

export type FieldVisitType =
    | "CLIENT_VISIT"
    | "PROJECT_SITE"
    | "SALES_VISIT"
    | "VENDOR_VISIT"
    | "DELIVERY"
    | "COLLECTION"
    | "OFFICIAL_ERRAND"
    | "OTHER";

export type FieldVisitStatus =
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export interface FieldVisitLocationInput {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    capturedAt?: string;
    attendanceLocationId?: string | null;
    addressText?: string;
}

export interface FieldVisitLocationEvidence {
    latitude: number;

    longitude: number;

    accuracy?: number | null;

    capturedAt: string;

    attendanceLocationId?:
    | AttendanceLocationReference
    | string
    | null;

    distanceFromLocationMeters?: number | null;

    withinGeofence?: boolean | null;

    addressText?: string;

    ipAddress?: string;

    userAgent?: string;
}

export interface FieldVisitClient {
    _id: string;
    name: string;
    code?: string;
    clientType?: string;
    engagementType?: string;
    status?: string;
}

export interface FieldVisitEmployee {
    _id: string;

    companyAccessId?: string;

    userId?:
    | AttendanceEmployeeUserReference
    | string
    | null;

    status?: string;
}

export interface FieldVisitCompanyAccess {
    _id: string;

    userId?: string;

    employeeCode?: string;

    designation?: string;

    employmentType?: string;

    roleId?:
    | AttendanceRoleReference
    | string
    | null;

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

    attendanceMode?: AttendanceMode;

    shiftId?:
    | AttendanceShiftReference
    | string
    | null;

    status?: string;
}

export interface FieldVisitAttendanceReference {
    _id: string;

    attendanceDate: string;

    attendanceMode: AttendanceMode;

    firstCheckInAt?: string | null;

    lastCheckOutAt?: string | null;

    totalWorkedMinutes?: number;

    totalBreakMinutes?: number;

    attendanceStatus?: AttendanceStatus;

    calculationStatus?: string;

    payrollStatus?: string;
}

export interface FieldVisitCancelledByReference {
    _id: string;

    firstName?: string;

    middleName?: string;

    lastName?: string;

    displayName?: string;

    email?: string;

    status?: string;
}

export interface FieldVisit {
    _id: string;

    companyId: string;

    companyAccessId:
    | string
    | FieldVisitCompanyAccess;

    employeeId:
    | string
    | FieldVisitEmployee;

    attendanceId?:
    | FieldVisitAttendanceReference
    | string
    | null;

    attendanceDate: string;

    visitType: FieldVisitType;

    clientId?:
    | string
    | FieldVisitClient
    | null;

    siteName: string;

    purpose: string;

    startedAt: string;

    startLocation: FieldVisitLocationEvidence;

    endedAt?: string | null;

    endLocation?: FieldVisitLocationEvidence | null;

    durationMinutes: number;

    outcome: string;

    notes: string;

    status: FieldVisitStatus;

    cancelledBy?:
    | FieldVisitCancelledByReference
    | string
    | null;

    cancelledAt?: string | null;

    cancellationReason?: string;

    createdAt?: string;

    updatedAt?: string;
}

// ============================================================
// FIELD VISIT PAYLOADS
// ============================================================

export interface StartFieldVisitPayload {
    visitType?: FieldVisitType;

    clientId?: string | null;

    siteName?: string;

    purpose: string;

    location: FieldVisitLocationInput;

    notes?: string;
}

export interface EndFieldVisitPayload {
    location: FieldVisitLocationInput;

    outcome?: string;

    notes?: string;
}

export interface CancelFieldVisitPayload {
    reason: string;
}

// ============================================================
// FIELD VISIT QUERIES
// ============================================================

export interface MyFieldVisitHistoryQuery {
    page?: number;

    limit?: number;

    clientId?: string;

    visitType?: FieldVisitType;

    status?: FieldVisitStatus;

    date?: string;

    fromDate?: string;

    toDate?: string;
}

export interface FieldVisitManagementQuery
    extends MyFieldVisitHistoryQuery {
    employeeId?: string;

    companyAccessId?: string;

    departmentId?: string;

    teamId?: string;

    attendanceId?: string;
}

// ============================================================
// FIELD VISIT RESPONSES
// ============================================================

export interface FieldVisitPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface FieldVisitHistoryResponse {
    items: FieldVisit[];

    pagination: FieldVisitPagination;
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

    activeFieldVisit: FieldVisit | null;
}


// ============================================================
// GET MY TODAY ATTENDANCE RESPONSE
// ============================================================

export interface AttendanceCheckInWindow {
    opensAt: string;
    shiftStartsAt: string;
    shiftEndsAt: string;
    earlyCheckInWindowMinutes: number;
    lateGraceMinutes: number;
    timezone: string;
}

export interface MyTodayAttendanceResponse {
    attendanceDate: string;
    attendance: AttendanceRecord | null;

    checkInWindow: AttendanceCheckInWindow;

    workDay: {
        isWorkingDay: boolean;
        classification: string;
        source: string;
        name: string;
        holidayType: string | null;
    };

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

export type DailyAttendanceDisplayStatus =
    | DailyAttendanceStatus
    | "PARTIAL_LEAVE";
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

    displayStatus: DailyAttendanceDisplayStatus;

    approvedLeave: AttendanceCalendarApprovedLeave | null;

    approvedLeaves: AttendanceCalendarApprovedLeave[];

    totalLeaveDays: number;

    hasLeaveAttendanceConflict: boolean;

    attendance: AttendanceRecord | null;
}


export interface DailyAttendanceSummaryCounts {
    totalEmployees: number;

    notCheckedIn: number;

    pending: number;

    present: number;

    halfDay: number;

    absent: number;

    onLeave: number;

    holiday: number;

    weeklyOff: number;
}


export interface DailyAttendanceSummaryResponse {
    date: string;

    items: DailyAttendanceSummaryRow[];

    summary: DailyAttendanceSummaryCounts;

    pagination: AttendanceHistoryPagination;
}


// ============================================================
// MY MONTHLY ATTENDANCE CALENDAR
// ============================================================

export type AttendanceCalendarDisplayStatus =
    | "NO_ATTENDANCE_RECORDED"
    | "UPCOMING"
    | "PENDING"
    | "PRESENT"
    | "HALF_DAY"
    | "ABSENT"
    | "ON_LEAVE"
    | "PARTIAL_LEAVE"
    | "HOLIDAY"
    | "WEEKLY_OFF";

export interface AttendanceCalendarWorkDay {
    isWorkingDay: boolean;
    classification: string;
    source: string;
    name: string;
}

export interface AttendanceCalendarApprovedLeave {
    leaveRequestId: string;
    leaveTypeId: string;
    dayPortion: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
    leaveDays: number;
    paidDays: number;
    unpaidDays: number;
    allocationType: string;
}

export interface AttendanceCalendarAttendance {
    firstCheckInAt: string | null;
    lastCheckOutAt: string | null;
    totalWorkedMinutes: number;
    totalBreakMinutes: number;
    isLate: boolean;
    isEarlyCheckout: boolean;
    calculationStatus: string;
}

export interface AttendanceCalendarDay {
    date: string;
    displayStatus: AttendanceCalendarDisplayStatus;
    workDay: AttendanceCalendarWorkDay;
    attendanceId: string | null;
    attendanceStatus: AttendanceStatus | null;
    attendance: AttendanceCalendarAttendance | null;
    approvedLeaves: AttendanceCalendarApprovedLeave[];
    totalLeaveDays: number;
    hasLeaveAttendanceConflict: boolean;
}

export interface MyAttendanceCalendarResponse {
    month: string;
    fromDate: string;
    toDate: string;
    timezone: string;
    employeeId: string;
    companyAccessId: string;
    days: AttendanceCalendarDay[];
}


// ============================================================
// MONTHLY ATTENDANCE REPORT — MANAGEMENT
// ============================================================

export type MonthlyAttendanceDisplayStatus =
    | AttendanceCalendarDisplayStatus
    | "NOT_CHECKED_IN"
    | "NOT_EMPLOYED";

export interface MonthlyAttendanceReportQuery {
    month: string; // YYYY-MM
    page?: number;
    limit?: number;
    departmentId?: string;
    teamId?: string;
    search?: string;
}

export interface MonthlyAttendanceReportDay {
    date: string;
    displayStatus: MonthlyAttendanceDisplayStatus;
    isEmployed: boolean;
    attendanceId: string | null;
    attendanceStatus: AttendanceStatus | null;
    workDay: AttendanceCalendarWorkDay;
    attendance: AttendanceCalendarAttendance | null;
    approvedLeaves: AttendanceCalendarApprovedLeave[];
    totalLeaveDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    hasLeaveAttendanceOverlap: boolean;
}

export interface MonthlyAttendanceReportTotals {
    present: number;
    halfDay: number;
    absent: number;
    pending: number;
    onLeave: number;
    partialLeave: number;
    holiday: number;
    weeklyOff: number;
    notCheckedIn: number;
    missingAttendance: number;
    upcoming: number;
    notEmployed: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    totalWorkedMinutes: number;
    totalBreakMinutes: number;
    lateDays: number;
    earlyCheckoutDays: number;
    leaveAttendanceOverlaps: number;
}

export interface MonthlyAttendanceReportEmployee {
    companyAccessId: string;
    employeeId: string | null;
    employeeCode: string;
    employeeName: string;
    designation: string;
    employmentType: string;
    department: {
        _id: string;
        name: string;
        code: string;
    } | null;
    team: {
        _id: string;
        name: string;
        code: string;
    } | null;
    attendanceMode: AttendanceMode | null;
    joiningDate: string | null;
    lastWorkingDate: string | null;
    employmentStatus: string;
    days: MonthlyAttendanceReportDay[];
    totals: MonthlyAttendanceReportTotals;
}

export interface MonthlyAttendanceReportResponse {
    month: string;
    fromDate: string;
    toDate: string;
    timezone: string;
    dates: string[];
    items: MonthlyAttendanceReportEmployee[];
    pagination: AttendanceHistoryPagination;
}


// ============================================================
// ATTENDANCE PHOTO EVIDENCE
// ============================================================

export type AttendancePhotoAction =
  | "CHECK_IN"
  | "CHECK_OUT"
  | "FIELD_VISIT_START"
  | "FIELD_VISIT_END";

export interface UploadAttendancePhotoPayload {
  action: AttendancePhotoAction;
  photo: File;
  attendanceId?: string;
  fieldVisitId?: string;
}

export interface AttendancePhotoEvidenceResponse {
  evidenceId: string;
  action: AttendancePhotoAction;
  capturedAt: string;
  expiresAt: string;
}
