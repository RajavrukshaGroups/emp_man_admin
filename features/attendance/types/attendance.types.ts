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
    | "ABSENT"
    | "HALF_DAY"
    | "WEEK_OFF"
    | "HOLIDAY"
    | "LEAVE"
    | "NOT_CALCULATED";

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

/**
 * Populated attendance location returned by backend.
 */
export interface AttendanceLocationReference {
    _id: string;

    name: string;

    code: string;

    locationType: string;

    latitude: number;

    longitude: number;

    geofenceRadiusMeters: number;

    status: string;
}


/**
 * GPS data sent FROM frontend TO backend.
 *
 * Do NOT send:
 * - withinGeofence
 * - distanceFromLocationMeters
 * - ipAddress
 * - userAgent
 *
 * Backend calculates/adds those values.
 */
export interface AttendanceLocationInput {
    latitude: number;

    longitude: number;

    accuracy?: number | null;

    capturedAt?: string;

    attendanceLocationId?: string | null;

    addressText?: string;
}


/**
 * Location evidence returned by backend
 * after validating GPS/geofence.
 */
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
// SHIFT SNAPSHOT
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
}


// ============================================================
// ATTENDANCE RECORD
// ============================================================

export interface AttendanceRecord {
    _id: string;

    attendanceDate: string;

    attendanceMode: AttendanceMode;

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

    payrollStatus: string;

    notes?: string;

    anomalies?: AttendanceAnomaly[];
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

/**
 * /me/today currently returns selected information
 * about an active field visit.
 */
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