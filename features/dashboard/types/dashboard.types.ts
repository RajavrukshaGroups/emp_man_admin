export interface DashboardCompanySummary {
    _id: string;
    name: string;
    code: string;
    status: string;
}

export interface EmployeeSummary {
    total: number;
    active: number;
    onboarding: number;
    inactive: number;
}

export interface DepartmentSummary {
    total: number;
    active: number;
    inactive: number;
}

export interface TeamSummary {
    total: number;
    active: number;
    inactive: number;
}

export interface RoleSummary {
    total: number;
}

export interface DashboardSummary {
    company: DashboardCompanySummary;
    employees: EmployeeSummary;
    departments: DepartmentSummary;
    teams: TeamSummary;
    roles: RoleSummary;
}