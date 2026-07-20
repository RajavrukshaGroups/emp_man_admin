import {
    Building2,
    LayoutDashboard,
    Network,
    ShieldCheck,
    UserCog,
    Users,
    UserRound,
    Settings,
    BriefcaseBusiness,
} from "lucide-react";

export interface DashboardNavigationItem {
    title: string;
    href: string;
    icon: React.ElementType;
    permission?: string;
    roles?: string[];
}

export const dashboardNavigation: DashboardNavigationItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Companies",
        href: "/companies",
        icon: Building2,
        permission: "company.read",
    },
    {
        title: "Company Access",
        href: "/company-access",
        icon: BriefcaseBusiness,
        permission: "company_access.read",
    },
    {
        title: "Departments",
        href: "/departments",
        icon: Network,
        permission: "department.read",
    },
    {
        title: "Teams",
        href: "/teams",
        icon: Users,
        permission: "team.read",
    },
    {
        title: "Employees",
        href: "/employees",
        icon: UserRound,
        permission: "employee.read",
    },
    {
        title: "Roles",
        href: "/roles",
        icon: UserCog,
        permission: "role.read",
    },
    {
        title: "Permissions",
        href: "/permissions",
        icon: ShieldCheck,
        permission: "permission.read",
    },
    {
        title: "Users",
        href: "/users",
        icon: Users,
        permission: "user.read",
    },
    {
        title: "Profile",
        href: "/profile",
        icon: UserRound,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];