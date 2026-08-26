"use client";

import axios from "axios";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { departmentService } from "@/features/departments/services/department.service";
import { teamService } from "@/features/teams/services/team.service";
import { employeeService } from "@/features/employees/services/employee.service";

import type { Department } from "@/features/departments/types/department.types";
import type { Team } from "@/features/teams/types/team.types";
import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import {
  createCompanyAccessSchema,
  type CreateCompanyAccessFormInput,
  type CreateCompanyAccessFormValues,
} from "@/features/company-access/validations/create-company-access.schema";

import { roleService } from "@/features/roles/services/role.service";
import type { Role } from "@/features/roles/types/role.types";

import type { User } from "@/features/users/types/user.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function isPopulatedEmployeeUser(
  value: Employee["userId"],
): value is EmployeeUserReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function isPopulatedCompanyAccess(
  value: Employee["companyAccessId"],
): value is EmployeeCompanyAccessReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getReferenceId(
  value:
    | string
    | {
        _id: string;
      }
    | null
    | undefined,
) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value._id;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface CompanyAccessStepProps {
  user: User;
  onBack: () => void;
  onSuccess: (companyAccess: CompanyAccess) => void;
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function CompanyAccessStep({
  user,
  onBack,
  onSuccess,
}: CompanyAccessStepProps) {
  const company = useAuthStore((state) => state.company);

  /**
   * ==========================================================
   * MASTER DATA
   * ==========================================================
   */

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  /**
   * ==========================================================
   * LOADING STATES
   * ==========================================================
   */

  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<
    CreateCompanyAccessFormInput,
    unknown,
    CreateCompanyAccessFormValues
  >({
    resolver: zodResolver(createCompanyAccessSchema),

    defaultValues: {
      roleId: "",
      employeeCode: "",
      designation: "",
      employmentType: "FULL_TIME",

      departmentId: "",
      teamId: "",
      reportingManagerId: "",

      joiningDate: "",
      probationEndDate: "",

      workLocationType: "HEAD_OFFICE",
      workLocationName: "",

      isPrimaryCompany: true,
      status: "ONBOARDING",

      notes: "",
    },

    mode: "onBlur",
  });

  /**
   * ==========================================================
   * WATCHED VALUES
   * ==========================================================
   */

  const selectedRoleId = watch("roleId");
  const selectedDepartmentId = watch("departmentId");
  const selectedTeamId = watch("teamId");

  const selectedRole =
    roles.find((role) => role._id === selectedRoleId) ?? null;

  const selectedRoleScope = selectedRole?.scopeType ?? null;

  /**
   * ==========================================================
   * LOAD ROLES
   * ==========================================================
   */

  useEffect(() => {
    async function loadRoles() {
      if (!company?._id) {
        setIsLoadingRoles(false);
        return;
      }

      try {
        setIsLoadingRoles(true);

        const data = await roleService.getRoles(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "name",
          sortOrder: "asc",
        });

        const activeRoles = data.records.filter(
          (role) => role.status === "ACTIVE",
        );

        setRoles(activeRoles);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to load company roles."));
      } finally {
        setIsLoadingRoles(false);
      }
    }

    void loadRoles();
  }, [company?._id]);

  /**
   * ==========================================================
   * LOAD DEPARTMENTS
   * ==========================================================
   */

  useEffect(() => {
    async function loadDepartments() {
      if (!company?._id) {
        setIsLoadingDepartments(false);
        return;
      }

      try {
        setIsLoadingDepartments(true);

        const data = await departmentService.getDepartments(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "name",
          sortOrder: "asc",
        });

        setDepartments(data.departments);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to load departments."));

        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    }

    void loadDepartments();
  }, [company?._id]);

  /**
   * ==========================================================
   * LOAD TEAMS BY DEPARTMENT
   * ==========================================================
   */

  useEffect(() => {
    async function loadTeams() {
      if (!company?._id || !selectedDepartmentId) {
        setTeams([]);

        setValue("teamId", "", {
          shouldValidate: false,
        });

        setValue("reportingManagerId", "", {
          shouldValidate: false,
        });

        return;
      }

      try {
        setIsLoadingTeams(true);

        const data = await teamService.getTeams(company._id, {
          page: 1,
          limit: 100,
          departmentId: selectedDepartmentId,
          status: "ACTIVE",
          sortBy: "name",
          sortOrder: "asc",
        });

        setTeams(data.teams);

        /**
         * Reset dependent selections
         * whenever department changes.
         */
        setValue("teamId", "", {
          shouldValidate: false,
        });

        setValue("reportingManagerId", "", {
          shouldValidate: false,
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to load teams."));

        setTeams([]);
      } finally {
        setIsLoadingTeams(false);
      }
    }

    void loadTeams();
  }, [company?._id, selectedDepartmentId, setValue]);

  /**
   * ==========================================================
   * LOAD EXISTING EMPLOYEES
   *
   * Used for reporting manager selection.
   * ==========================================================
   */

  useEffect(() => {
    async function loadEmployees() {
      if (!company?._id) {
        return;
      }

      try {
        setIsLoadingEmployees(true);

        const result = await employeeService.getEmployees(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "createdAt",
          sortOrder: "asc",
        });

        setEmployees(result.records);
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, "Unable to load reporting managers."),
        );

        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    void loadEmployees();
  }, [company?._id]);

  /**
   * ==========================================================
   * AVAILABLE REPORTING MANAGERS
   * ==========================================================
   *
   * Team selected:
   * → same-team employees
   *
   * Department selected:
   * → same-department employees
   *
   * Neither selected:
   * → all company employees returned by backend
   * ==========================================================
   */

  const availableReportingManagers = useMemo(() => {
    return employees.filter((employee) => {
      const access = isPopulatedCompanyAccess(employee.companyAccessId)
        ? employee.companyAccessId
        : null;

      if (!access) {
        return false;
      }

      if (selectedTeamId) {
        return getReferenceId(access.teamId) === selectedTeamId;
      }

      if (selectedDepartmentId) {
        return getReferenceId(access.departmentId) === selectedDepartmentId;
      }

      return true;
    });
  }, [employees, selectedDepartmentId, selectedTeamId]);

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function onSubmit(values: CreateCompanyAccessFormValues) {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    /**
     * Validate selected role.
     */
    const role = roles.find((currentRole) => currentRole._id === values.roleId);

    if (!role) {
      toast.error("Please select a valid role.");

      return;
    }

    /**
     * Department scope requires
     * department assignment.
     */
    if (
      ["DEPARTMENT", "TEAM"].includes(role.scopeType) &&
      !values.departmentId
    ) {
      toast.error("Department is required for this role.");

      return;
    }

    /**
     * Team scope requires
     * team assignment.
     */
    if (role.scopeType === "TEAM" && !values.teamId) {
      toast.error("Team is required for a team-scoped role.");

      return;
    }

    try {
      const createdCompanyAccess =
        await companyAccessService.createCompanyAccess(company._id, {
          userId: user._id,

          roleId: values.roleId,

          employeeCode: values.employeeCode,

          designation: values.designation,

          employmentType: values.employmentType,

          departmentId: values.departmentId || undefined,

          teamId: values.teamId || undefined,

          reportingManagerId: values.reportingManagerId || undefined,

          joiningDate: values.joiningDate,

          probationEndDate: values.probationEndDate,

          workLocationType: values.workLocationType,

          workLocationName: values.workLocationName,

          isPrimaryCompany: values.isPrimaryCompany,

          status: values.status,

          notes: values.notes,
        });

      toast.success(`Company access assigned to ${user.displayName}.`);

      onSuccess(createdCompanyAccess);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to assign company access."));
    }
  }

  /**
   * ==========================================================
   * NO COMPANY
   * ==========================================================
   */

  if (!company?._id) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-slate-950">
          Company context unavailable
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Please log in again with an active company assignment.
        </p>
      </div>
    );
  }

  /**
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Back to user account"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Company access
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Assign employment, organization, role and work-location
              information.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            User created
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-emerald-950">
            {user.displayName}
          </p>

          <p className="mt-0.5 truncate text-xs text-emerald-700">
            {user.email}
          </p>
        </div>
      </div>

      {/* ======================================================
          COMPANY + ROLE
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Company assignment
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Assign the user to the current company and role.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label className={labelClassName}>Company</label>

            <input
              type="text"
              value={`${company.name} (${company.code})`}
              disabled
              className={inputClassName}
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Company is selected from your active login context.
            </p>
          </div>

          <div>
            <label htmlFor="roleId" className={labelClassName}>
              Role <span className="text-red-500">*</span>
            </label>

            <select
              id="roleId"
              disabled={isSubmitting || isLoadingRoles}
              className={selectClassName}
              {...register("roleId")}
            >
              <option value="">
                {isLoadingRoles ? "Loading roles..." : "Select role"}
              </option>

              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>

            {errors.roleId && (
              <p className={errorClassName}>{errors.roleId.message}</p>
            )}

            {selectedRole && (
              <p className="mt-1.5 text-xs text-blue-600">
                Scope:{" "}
                {selectedRole.scopeType === "COMPANY"
                  ? "Company"
                  : selectedRole.scopeType === "DEPARTMENT"
                    ? "Department"
                    : selectedRole.scopeType === "TEAM"
                      ? "Team"
                      : selectedRole.scopeType}
              </p>
            )}

            {!isLoadingRoles && roles.length === 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                No active company roles are available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          EMPLOYMENT INFORMATION
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Employment information
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Add employee code, designation and employment type.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <div>
            <label htmlFor="employeeCode" className={labelClassName}>
              Employee code
            </label>

            <input
              id="employeeCode"
              type="text"
              placeholder="Example: EMP-001"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("employeeCode")}
            />

            {errors.employeeCode && (
              <p className={errorClassName}>{errors.employeeCode.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="designation" className={labelClassName}>
              Designation
            </label>

            <input
              id="designation"
              type="text"
              placeholder="Example: Software Engineer"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("designation")}
            />

            {errors.designation && (
              <p className={errorClassName}>{errors.designation.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="employmentType" className={labelClassName}>
              Employment type <span className="text-red-500">*</span>
            </label>

            <select
              id="employmentType"
              disabled={isSubmitting}
              className={selectClassName}
              {...register("employmentType")}
            >
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
              <option value="CONSULTANT">Consultant</option>
              <option value="FREELANCER">Freelancer</option>
            </select>

            {errors.employmentType && (
              <p className={errorClassName}>{errors.employmentType.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          ORGANIZATION ASSIGNMENT
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Organization assignment
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Assign the employee to a department, team and reporting manager.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {/* Department */}

          <div>
            <label htmlFor="departmentId" className={labelClassName}>
              Department
              {selectedRoleScope !== "COMPANY" && (
                <span className="text-red-500"> *</span>
              )}
            </label>

            <select
              id="departmentId"
              disabled={isSubmitting || isLoadingDepartments}
              className={selectClassName}
              {...register("departmentId")}
            >
              <option value="">
                {isLoadingDepartments
                  ? "Loading departments..."
                  : "Select department"}
              </option>

              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>

            {errors.departmentId && (
              <p className={errorClassName}>{errors.departmentId.message}</p>
            )}

            {selectedRoleScope === "DEPARTMENT" && (
              <p className="mt-1.5 text-xs text-blue-600">
                This role operates within the selected department.
              </p>
            )}
          </div>

          {/* Team */}

          <div>
            <label htmlFor="teamId" className={labelClassName}>
              Team
              {selectedRoleScope === "TEAM" && (
                <span className="text-red-500"> *</span>
              )}
            </label>

            <select
              id="teamId"
              disabled={isSubmitting || !selectedDepartmentId || isLoadingTeams}
              className={selectClassName}
              {...register("teamId")}
            >
              <option value="">
                {!selectedDepartmentId
                  ? "Select department first"
                  : isLoadingTeams
                    ? "Loading teams..."
                    : "Select team"}
              </option>

              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.code})
                </option>
              ))}
            </select>

            {errors.teamId && (
              <p className={errorClassName}>{errors.teamId.message}</p>
            )}

            {selectedRoleScope === "TEAM" && (
              <p className="mt-1.5 text-xs text-violet-600">
                This role operates within the selected team.
              </p>
            )}
          </div>

          {/* Reporting Manager */}

          <div>
            <label htmlFor="reportingManagerId" className={labelClassName}>
              Reporting manager
            </label>

            <select
              id="reportingManagerId"
              disabled={isSubmitting || isLoadingEmployees}
              className={selectClassName}
              {...register("reportingManagerId")}
            >
              <option value="">
                {isLoadingEmployees
                  ? "Loading employees..."
                  : "No reporting manager"}
              </option>

              {availableReportingManagers.map((employee) => {
                const employeeUser = isPopulatedEmployeeUser(employee.userId)
                  ? employee.userId
                  : null;

                const access = isPopulatedCompanyAccess(
                  employee.companyAccessId,
                )
                  ? employee.companyAccessId
                  : null;

                if (!access) {
                  return null;
                }

                return (
                  <option key={access._id} value={access._id}>
                    {employeeUser?.displayName ?? "Unnamed employee"}
                    {access.designation ? ` - ${access.designation}` : ""}
                  </option>
                );
              })}
            </select>

            {errors.reportingManagerId && (
              <p className={errorClassName}>
                {errors.reportingManagerId.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          EMPLOYMENT DATES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Employment dates
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Enter joining and probation completion dates.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="joiningDate" className={labelClassName}>
              Joining date
            </label>

            <input
              id="joiningDate"
              type="date"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("joiningDate")}
            />

            {errors.joiningDate && (
              <p className={errorClassName}>{errors.joiningDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="probationEndDate" className={labelClassName}>
              Probation end date
            </label>

            <input
              id="probationEndDate"
              type="date"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("probationEndDate")}
            />

            {errors.probationEndDate && (
              <p className={errorClassName}>
                {errors.probationEndDate.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          WORK LOCATION
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Work location
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Select how and where this employee works.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="workLocationType" className={labelClassName}>
              Work location type <span className="text-red-500">*</span>
            </label>

            <select
              id="workLocationType"
              disabled={isSubmitting}
              className={selectClassName}
              {...register("workLocationType")}
            >
              <option value="HEAD_OFFICE">Head office</option>
              <option value="BRANCH">Branch</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="CLIENT_LOCATION">Client location</option>
            </select>

            {errors.workLocationType && (
              <p className={errorClassName}>
                {errors.workLocationType.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="workLocationName" className={labelClassName}>
              Work location name
            </label>

            <input
              id="workLocationName"
              type="text"
              placeholder="Example: Bengaluru Head Office"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("workLocationName")}
            />

            {errors.workLocationName && (
              <p className={errorClassName}>
                {errors.workLocationName.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          ACCESS SETTINGS
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Access settings
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Configure primary company and onboarding status.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="status" className={labelClassName}>
              Access status <span className="text-red-500">*</span>
            </label>

            <select
              id="status"
              disabled={isSubmitting}
              className={selectClassName}
              {...register("status")}
            >
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {errors.status && (
              <p className={errorClassName}>{errors.status.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register("isPrimaryCompany")}
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Primary company
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Mark this as the employee&apos;s primary company assignment.
                </span>
              </span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClassName}>
              Notes
            </label>

            <textarea
              id="notes"
              rows={4}
              placeholder="Add optional onboarding or employment notes"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              {...register("notes")}
            />

            {errors.notes && (
              <p className={errorClassName}>{errors.notes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <p className="mb-3 text-xs leading-5 text-slate-500 sm:mb-0 sm:max-w-lg">
          This step creates the employee&apos;s company access. The employee HR
          profile will be completed next.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingRoles || roles.length === 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning access...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save and continue
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
