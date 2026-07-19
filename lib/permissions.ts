export const hasPermission = (
    userPermissions: string[],
    requiredPermission: string,
): boolean => {
    return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
    userPermissions: string[],
    requiredPermissions: string[],
): boolean => {
    return requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
    );
};

export const hasAllPermissions = (
    userPermissions: string[],
    requiredPermissions: string[],
): boolean => {
    return requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
    );
};

export const PERMISSIONS = {
    COMPANY_CREATE: "company.create",
    COMPANY_READ: "company.read",
    COMPANY_UPDATE: "company.update",
    COMPANY_DELETE: "company.delete",

    DEPARTMENT_CREATE: "department.create",
    DEPARTMENT_READ: "department.read",
    DEPARTMENT_UPDATE: "department.update",
    DEPARTMENT_DELETE: "department.delete",

    TEAM_CREATE: "team.create",
    TEAM_READ: "team.read",
    TEAM_UPDATE: "team.update",
    TEAM_DELETE: "team.delete",
    TEAM_ASSIGN_MEMBER: "team.assign_member",
    TEAM_ASSIGN_LEAD: "team.assign_lead",

    EMPLOYEE_CREATE: "employee.create",
    EMPLOYEE_READ: "employee.read",
    EMPLOYEE_UPDATE: "employee.update",
    EMPLOYEE_DEACTIVATE: "employee.deactivate",
} as const;

export type PermissionCode =
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS];