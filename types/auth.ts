export type UserGender =
  | "MALE"
  | "FEMALE"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";

export type RecordStatus = "ACTIVE" | "INACTIVE";

export type RoleScope =
  | "SYSTEM"
  | "COMPANY"
  | "DEPARTMENT"
  | "TEAM";

export interface Permission {
  _id: string;
  name: string;
  code: string;
  module: string;
  action: string;
}

export interface Role {
  _id: string;
  name: string;
  code: string;
  scopeType: RoleScope;
  permissions: Permission[];
}

export interface AuthUser {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  email: string;
  mobile?: string;
  profilePhoto?: string;
  gender?: UserGender;
  dateOfBirth?: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  lastLoginAt?: string | null;
}

export interface AuthCompany {
  _id: string;
  name: string;
  slug: string;
  code: string;
  logo?: string;
  status: RecordStatus;
}

export interface CompanyAccess {
  _id: string;
  employeeCode?: string;
  designation?: string;
  employmentType?: string;
  departmentId?: string | null;
  teamId?: string | null;
  reportingManagerId?: string | null;
  joiningDate?: string | null;
  workLocationType?: string;
  workLocationName?: string;
  isPrimaryCompany?: boolean;
  status: RecordStatus;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  companyId?: string;
  rememberMe: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthSessionData {
  user: AuthUser;
  companyAccess: CompanyAccess;
  company: AuthCompany;
  role: Role;
}

export interface LoginResponseData extends AuthSessionData {
  accessToken: string;
}

export interface AuthenticatedUserResponseData
  extends AuthSessionData {
  accessToken: null;
}

export interface RefreshTokenResponseData
  extends AuthSessionData {
  accessToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  companyAccess: CompanyAccess | null;
  company: AuthCompany | null;
  role: Role | null;
  permissions: string[];

  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  isHydrated: boolean;
}