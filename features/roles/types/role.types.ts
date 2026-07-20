export type RoleStatus = "ACTIVE" | "INACTIVE";

export type RoleScopeType =
  | "PLATFORM"
  | "COMPANY";

export interface RolePermission {
  _id: string;
  name: string;
  code: string;
  module: string;
  action: string;
  description?: string;
  status: string;
}

export interface Role {
  _id: string;

  companyId?: string | null;

  name: string;
  code: string;
  description?: string;

  scopeType: RoleScopeType;

  permissionIds: Array<
    string | RolePermission
  >;

  isSystemRole: boolean;
  isEditable: boolean;

  status: RoleStatus;

  createdAt: string;
  updatedAt: string;
}

export interface RolePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RoleListData {
  roles: Role[];
  pagination: RolePagination;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RoleStatus;
  sortBy?:
    | "name"
    | "code"
    | "status"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
}