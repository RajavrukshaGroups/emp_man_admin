
export type AttendancePolicyStatus = "ACTIVE" | "INACTIVE";

export type AttendanceMissingCheckoutAction =
  | "FLAG_ONLY"
  | "AUTO_CLOSE"
  | "REQUIRE_REGULARIZATION";


export interface AttendancePhotoCaptureSettings {
  enabled: boolean;

  requireForCheckIn: boolean;
  requireForCheckOut: boolean;

  requireForFieldVisitStart: boolean;
  requireForFieldVisitEnd: boolean;

  requireForOffice: boolean;
  requireForField: boolean;
  requireForHybrid: boolean;
  requireForRemote: boolean;
}

export interface AttendancePolicy {
  _id: string;
  companyId: string;

  name: string;
  code: string;
  description?: string;

  // GPS and geofencing
  locationRequired: boolean;
  maximumAcceptedAccuracyMeters: number;

  enforceGeofenceForOffice: boolean;
  enforceGeofenceForHybrid: boolean;
  enforceGeofenceForField: boolean;
  enforceGeofenceForRemote: boolean;

  // Work sessions
  allowMultipleWorkSessions: boolean;
  allowReCheckInSameDay: boolean;
  preventOverlappingSessions: boolean;

  // Missing checkout
  missingCheckoutAction: AttendanceMissingCheckoutAction;
  autoCloseAfterMinutes: number;
  maximumOpenSessionMinutes: number;
  allowNextDayCheckInWithPendingPreviousDay: boolean;

  // Attendance regularization
  regularizationEnabled: boolean;
  regularizationWindowDays: number;
  requireRegularizationReason: boolean;

  allowCheckInCorrection: boolean;
  allowCheckOutCorrection: boolean;
  allowBreakCorrection: boolean;

  // Field visits
  fieldVisitEnabled: boolean;
  fieldVisitPurposeRequired: boolean;
  fieldVisitOutcomeRequired: boolean;

  // Attendance photo capture
  photoCapture?: AttendancePhotoCaptureSettings;

  // Policy validity
  effectiveFrom: string;
  effectiveTo?: string | null;

  isDefault: boolean;
  status: AttendancePolicyStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendancePolicyPayload {
  name: string;
  code: string;
  description?: string;

  locationRequired?: boolean;
  maximumAcceptedAccuracyMeters?: number;

  enforceGeofenceForOffice?: boolean;
  enforceGeofenceForHybrid?: boolean;
  enforceGeofenceForField?: boolean;
  enforceGeofenceForRemote?: boolean;

  allowMultipleWorkSessions?: boolean;
  allowReCheckInSameDay?: boolean;
  preventOverlappingSessions?: boolean;

  missingCheckoutAction?: AttendanceMissingCheckoutAction;
  autoCloseAfterMinutes?: number;
  maximumOpenSessionMinutes?: number;
  allowNextDayCheckInWithPendingPreviousDay?: boolean;

  regularizationEnabled?: boolean;
  regularizationWindowDays?: number;
  requireRegularizationReason?: boolean;

  allowCheckInCorrection?: boolean;
  allowCheckOutCorrection?: boolean;
  allowBreakCorrection?: boolean;

  fieldVisitEnabled?: boolean;
  fieldVisitPurposeRequired?: boolean;
  fieldVisitOutcomeRequired?: boolean;

  // Attendance photo capture
  photoCapture?: Partial<AttendancePhotoCaptureSettings>;

  effectiveFrom: string;
  effectiveTo?: string | null;

  isDefault?: boolean;
  status?: AttendancePolicyStatus;
}

export type UpdateAttendancePolicyPayload =
  Partial<CreateAttendancePolicyPayload>;

export interface AttendancePolicyListQuery {
  page?: number;
  limit?: number;

  status?: AttendancePolicyStatus;
  isDefault?: boolean;

  search?: string;
  effectiveOn?: string;
}

export interface AttendancePolicyPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AttendancePolicyListResponse {
  items: AttendancePolicy[];
  pagination: AttendancePolicyPagination;
}
