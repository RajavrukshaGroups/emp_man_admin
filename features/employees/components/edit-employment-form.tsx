"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";

import type {
  CompanyAccess,
  EmploymentType,
  UpdateCompanyAccessPayload,
  WorkLocationType,
} from "@/features/company-access/types/company-access.types";

import { employeeService } from "@/features/employees/services/employee.service";

import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";

import { roleService } from "@/features/roles/services/role.service";

import type { Role } from "@/features/roles/types/role.types";

import { departmentService } from "@/features/departments/services/department.service";

import type { Department } from "@/features/departments/types/department.types";

import { teamService } from "@/features/teams/services/team.service";

import type { Team } from "@/features/teams/types/team.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface EditEmploymentFormProps {
  employeeId: string;
}

interface EmploymentFormValues {
  employeeCode: string;
  designation: string;

  roleId: string;
  departmentId: string;
  teamId: string;
  reportingManagerId: string;

  employmentType: EmploymentType;

  joiningDate: string;
  probationEndDate: string;

  workLocationType: WorkLocationType;
  workLocationName: string;

  isPrimaryCompany: boolean;

  notes: string;
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName = inputClassName;

const textAreaClassName =
  "min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

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

function formatDateForInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
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

  if (typeof value === "string") {
    return value;
  }

  return value._id;
}

function getEmployeeUser(employee: Employee) {
  if (typeof employee.userId === "object" && employee.userId !== null) {
    return employee.userId as EmployeeUserReference;
  }

  return null;
}

function getEmployeeCompanyAccessId(employee: Employee) {
  if (typeof employee.companyAccessId === "string") {
    return employee.companyAccessId;
  }

  if (
    typeof employee.companyAccessId === "object" &&
    employee.companyAccessId !== null
  ) {
    return (employee.companyAccessId as EmployeeCompanyAccessReference)._id;
  }

  return null;
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function EditEmploymentForm({ employeeId }: EditEmploymentFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canUpdateEmployee = permissions.includes("employee.update");

  /**
   * ==========================================================
   * PRIMARY RECORDS
   * ==========================================================
   */

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [companyAccess, setCompanyAccess] = useState<CompanyAccess | null>(
    null,
  );

  /**
   * ==========================================================
   * OPTION DATA
   * ==========================================================
   */

  const [roles, setRoles] = useState<Role[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [reportingManagers, setReportingManagers] = useState<CompanyAccess[]>(
    [],
  );

  /**
   * ==========================================================
   * LOADING / ERROR
   * ==========================================================
   */

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmploymentFormValues>({
    defaultValues: {
      employeeCode: "",
      designation: "",

      roleId: "",
      departmentId: "",
      teamId: "",
      reportingManagerId: "",

      employmentType: "FULL_TIME",

      joiningDate: "",
      probationEndDate: "",

      workLocationType: "HEAD_OFFICE",
      workLocationName: "",

      isPrimaryCompany: false,

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

  /**
   * ==========================================================
   * SELECTED ROLE
   * ==========================================================
   */

  const selectedRole =
    roles.find((role) => role._id === selectedRoleId) ?? null;

  const selectedRoleScope = selectedRole?.scopeType ?? null;

  /**
   * ==========================================================
   * LOAD TEAMS FOR A DEPARTMENT
   * ==========================================================
   *
   * Used when the user manually changes department.
   * ==========================================================
   */

  const loadTeamsForDepartment = useCallback(
    async (departmentId: string): Promise<Team[]> => {
      if (!company?._id || !departmentId) {
        setTeams([]);

        return [];
      }

      try {
        setIsLoadingTeams(true);

        const result = await teamService.getTeams(company._id, {
          page: 1,
          limit: 100,

          departmentId,

          status: "ACTIVE",

          sortBy: "name",

          sortOrder: "asc",
        });

        setTeams(result.teams);

        return result.teams;
      } catch (error: unknown) {
        setTeams([]);

        toast.error(
          getErrorMessage(
            error,
            "Unable to load teams for the selected department.",
          ),
        );

        return [];
      } finally {
        setIsLoadingTeams(false);
      }
    },
    [company?._id],
  );

  /**
   * ==========================================================
   * INITIAL PAGE LOAD
   * ==========================================================
   *
   * IMPORTANT:
   *
   * We deliberately load data in this order:
   *
   * 1. Employee
   * 2. Company Access
   * 3. Roles / Departments / Managers
   * 4. Teams belonging to SAVED department
   * 5. Populate option state
   * 6. Reset form values
   *
   * This avoids the previous race condition where teamId
   * existed before the team option existed.
   * ==========================================================
   */

  const loadPageData = useCallback(async () => {
    if (!canUpdateEmployee) {
      setIsLoading(false);

      return;
    }

    if (!company?._id) {
      setIsLoading(false);

      setLoadError("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);

      setIsLoadingOptions(true);

      setLoadError(null);

      /**
       * ----------------------------------------------------
       * 1. EMPLOYEE
       * ----------------------------------------------------
       */

      const employeeData = await employeeService.getEmployeeById(
        company._id,
        employeeId,
      );

      const companyAccessId = getEmployeeCompanyAccessId(employeeData);

      if (!companyAccessId) {
        throw new Error(
          "Company access information is unavailable for this employee.",
        );
      }

      /**
       * ----------------------------------------------------
       * 2. COMPANY ACCESS
       * ----------------------------------------------------
       */

      const accessData = await companyAccessService.getCompanyAccessById(
        company._id,
        companyAccessId,
      );

      /**
       * ----------------------------------------------------
       * 3. MASTER OPTIONS
       * ----------------------------------------------------
       */

      const [roleResult, departmentResult, companyAccessResult] =
        await Promise.all([
          roleService.getRoles(company._id, {
            page: 1,
            limit: 100,

            status: "ACTIVE",

            sortBy: "name",

            sortOrder: "asc",
          }),

          departmentService.getDepartments(company._id, {
            page: 1,
            limit: 100,

            status: "ACTIVE",

            sortBy: "name",

            sortOrder: "asc",
          }),

          companyAccessService.getCompanyAccessList(company._id, {
            page: 1,
            limit: 100,

            status: "ACTIVE",

            sortBy: "createdAt",

            sortOrder: "asc",
          }),
        ]);

      /**
       * ----------------------------------------------------
       * 4. SAVED IDs
       * ----------------------------------------------------
       */

      const savedRoleId = getReferenceId(accessData.roleId);

      const savedDepartmentId = getReferenceId(accessData.departmentId);

      const savedTeamId = getReferenceId(accessData.teamId);

      const savedReportingManagerId = getReferenceId(
        accessData.reportingManagerId,
      );

      /**
       * ----------------------------------------------------
       * 5. LOAD SAVED DEPARTMENT TEAMS
       * ----------------------------------------------------
       */

      let savedDepartmentTeams: Team[] = [];

      if (savedDepartmentId) {
        const teamResult = await teamService.getTeams(company._id, {
          page: 1,
          limit: 100,

          departmentId: savedDepartmentId,

          status: "ACTIVE",

          sortBy: "name",

          sortOrder: "asc",
        });

        savedDepartmentTeams = teamResult.teams;
      }

      /**
       * ----------------------------------------------------
       * VALIDATE SAVED TEAM
       * ----------------------------------------------------
       */

      const savedTeamExists =
        !savedTeamId ||
        savedDepartmentTeams.some((team) => team._id === savedTeamId);

      if (savedTeamId && !savedTeamExists) {
        console.warn("Saved team does not belong to the saved department.", {
          savedDepartmentId,
          savedTeamId,
        });
      }

      /**
       * ----------------------------------------------------
       * 6. SET STATE FIRST
       * ----------------------------------------------------
       */

      setEmployee(employeeData);

      setCompanyAccess(accessData);

      setRoles(roleResult.records.filter((role) => role.status === "ACTIVE"));

      setDepartments(departmentResult.departments);

      setTeams(savedDepartmentTeams);

      setReportingManagers(
        companyAccessResult.records.filter(
          (access) => access._id !== accessData._id,
        ),
      );

      /**
       * ----------------------------------------------------
       * 7. RESET FORM AFTER OPTIONS EXIST
       * ----------------------------------------------------
       */

      reset({
        employeeCode: accessData.employeeCode ?? "",

        designation: accessData.designation ?? "",

        roleId: savedRoleId,

        departmentId: savedDepartmentId,

        teamId: savedTeamExists ? savedTeamId : "",

        reportingManagerId: savedReportingManagerId,

        employmentType: accessData.employmentType ?? "FULL_TIME",

        joiningDate: formatDateForInput(accessData.joiningDate),

        probationEndDate: formatDateForInput(accessData.probationEndDate),

        workLocationType: accessData.workLocationType ?? "HEAD_OFFICE",

        workLocationName: accessData.workLocationName ?? "",

        isPrimaryCompany: accessData.isPrimaryCompany ?? false,

        notes: accessData.notes ?? "",
      });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Unable to retrieve employment information.",
      );

      setEmployee(null);

      setCompanyAccess(null);

      setRoles([]);

      setDepartments([]);

      setTeams([]);

      setReportingManagers([]);

      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);

      setIsLoadingOptions(false);
    }
  }, [canUpdateEmployee, company?._id, employeeId, reset]);

  /**
   * ==========================================================
   * INITIAL EFFECT
   * ==========================================================
   */

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  /**
   * ==========================================================
   * REPORTING MANAGERS
   * ==========================================================
   *
   * TEAM selected
   * → show managers from same team
   *
   * DEPARTMENT selected
   * → show managers from same department
   *
   * Nothing selected
   * → show company managers
   *
   * Current employee excluded.
   * ==========================================================
   */

  const availableReportingManagers = useMemo(() => {
    return reportingManagers.filter((manager) => {
      if (companyAccess?._id && manager._id === companyAccess._id) {
        return false;
      }

      const managerDepartmentId = getReferenceId(manager.departmentId);

      const managerTeamId = getReferenceId(manager.teamId);

      /**
       * Team has highest priority.
       */
      if (selectedTeamId) {
        return managerTeamId === selectedTeamId;
      }

      /**
       * Otherwise same department.
       */
      if (selectedDepartmentId) {
        return managerDepartmentId === selectedDepartmentId;
      }

      return true;
    });
  }, [
    reportingManagers,
    companyAccess?._id,
    selectedDepartmentId,
    selectedTeamId,
  ]);

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  const onSubmit: SubmitHandler<EmploymentFormValues> = async (values) => {
    if (!canUpdateEmployee) {
      toast.error("You do not have permission to update employee information.");

      return;
    }

    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    if (!companyAccess?._id) {
      toast.error("Company access information is unavailable.");

      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE ROLE
     * --------------------------------------------------------
     */

    const role = roles.find((currentRole) => currentRole._id === values.roleId);

    if (!role) {
      toast.error("Please select a valid role.");

      return;
    }

    /**
     * --------------------------------------------------------
     * DEPARTMENT REQUIRED
     * --------------------------------------------------------
     */

    if (
      (role.scopeType === "DEPARTMENT" || role.scopeType === "TEAM") &&
      !values.departmentId
    ) {
      toast.error("Department is required for this role.");

      return;
    }

    /**
     * --------------------------------------------------------
     * TEAM REQUIRED
     * --------------------------------------------------------
     */

    if (role.scopeType === "TEAM" && !values.teamId) {
      toast.error("Team is required for a team-scoped role.");

      return;
    }

    /**
     * --------------------------------------------------------
     * ENSURE TEAM BELONGS TO DEPARTMENT
     * --------------------------------------------------------
     */

    if (values.teamId && values.departmentId) {
      const validTeam = teams.some((team) => team._id === values.teamId);

      if (!validTeam) {
        toast.error(
          "The selected team does not belong to the selected department.",
        );

        return;
      }
    }

    /**
     * --------------------------------------------------------
     * PAYLOAD
     * --------------------------------------------------------
     */

    const payload: UpdateCompanyAccessPayload = {
      employeeCode: values.employeeCode.trim() || null,

      designation: values.designation.trim(),

      roleId: values.roleId,

      departmentId: values.departmentId || null,

      teamId: values.teamId || null,

      reportingManagerId: values.reportingManagerId || null,

      employmentType: values.employmentType,

      joiningDate: values.joiningDate || null,

      probationEndDate: values.probationEndDate || null,

      workLocationType: values.workLocationType,

      workLocationName: values.workLocationName.trim(),

      isPrimaryCompany: values.isPrimaryCompany,

      notes: values.notes.trim(),
    };

    try {
      await companyAccessService.updateCompanyAccess(
        company._id,
        companyAccess._id,
        payload,
      );

      toast.success("Employment information updated successfully.");

      router.push(`/employees/${employeeId}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to update employment information."),
      );
    }
  };

  /**
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
   */

  if (!canUpdateEmployee) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
        <h1 className="text-xl font-bold text-red-950">Access denied</h1>

        <p className="mt-2 text-sm text-red-700">
          You do not have permission to update employment information.
        </p>

        <Link
          href={`/employees/${employeeId}`}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Back to employee
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (isLoading) {
    return <EmploymentFormSkeleton />;
  }

  /**
   * ==========================================================
   * ERROR
   * ==========================================================
   */

  if (loadError || !employee || !companyAccess) {
    return (
      <div className="space-y-6">
        <Link
          href={`/employees/${employeeId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to employee
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load employment details
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {loadError ?? "Employment information is unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadPageData()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * DISPLAY NAME
   * ==========================================================
   */

  const employeeUser = getEmployeeUser(employee);

  const employeeName = employeeUser?.displayName || "Employee";

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
        <div className="flex items-start gap-3">
          <Link
            href={`/employees/${employeeId}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Edit employment information
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update company access, organisation assignment and work-location
              information.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Editing employment
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {employeeName}
          </p>
        </div>
      </div>

      {/* ======================================================
          EMPLOYMENT ASSIGNMENT
      ====================================================== */}

      <Section
        icon={BriefcaseBusiness}
        title="Employment assignment"
        description="Update the employee code, designation and employment type."
      >
        <Field label="Employee code" error={errors.employeeCode?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="APEX-HR-001"
            className={inputClassName}
            {...register("employeeCode", {
              maxLength: {
                value: 50,

                message: "Employee code cannot exceed 50 characters.",
              },
            })}
          />
        </Field>

        <Field label="Designation" error={errors.designation?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="HR Manager"
            className={inputClassName}
            {...register("designation", {
              required: "Designation is required.",

              maxLength: {
                value: 100,

                message: "Designation cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field label="Employment type" error={errors.employmentType?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("employmentType", {
              required: "Employment type is required.",
            })}
          >
            <option value="FULL_TIME">Full time</option>

            <option value="PART_TIME">Part time</option>

            <option value="CONTRACT">Contract</option>

            <option value="INTERN">Intern</option>

            <option value="CONSULTANT">Consultant</option>

            <option value="FREELANCER">Freelancer</option>
          </select>
        </Field>
      </Section>

      {/* ======================================================
          ORGANISATION ASSIGNMENT
      ====================================================== */}

      <Section
        icon={Building2}
        title="Organisation assignment"
        description="Assign the employee's role, department, team and reporting manager."
      >
        {/* ROLE */}

        <Field
          label="Role *"
          error={errors.roleId?.message}
          hint={
            selectedRole
              ? `Scope: ${
                  selectedRole.scopeType === "COMPANY"
                    ? "Company"
                    : selectedRole.scopeType === "DEPARTMENT"
                      ? "Department"
                      : selectedRole.scopeType === "TEAM"
                        ? "Team"
                        : selectedRole.scopeType
                }`
              : undefined
          }
        >
          <select
            disabled={isSubmitting || isLoadingOptions}
            className={selectClassName}
            {...register("roleId", {
              required: "Role is required.",
            })}
          >
            <option value="">
              {isLoadingOptions ? "Loading roles..." : "Select role"}
            </option>

            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>

          {!isLoadingOptions && roles.length === 0 && (
            <p className="mt-1.5 text-xs font-medium text-amber-600">
              No active company roles are available.
            </p>
          )}
        </Field>

        {/* DEPARTMENT */}

        <Field
          label={
            selectedRoleScope === "DEPARTMENT" || selectedRoleScope === "TEAM"
              ? "Department *"
              : "Department"
          }
          hint={
            selectedRoleScope === "DEPARTMENT"
              ? "This role operates within the selected department."
              : selectedRoleScope === "TEAM"
                ? "Department is required before selecting the team."
                : undefined
          }
        >
          <select
            disabled={isSubmitting || isLoadingOptions}
            className={selectClassName}
            {...register("departmentId", {
              onChange: async (event) => {
                const departmentId = event.target.value;

                /**
                 * User manually changed
                 * department.
                 *
                 * Previous team and manager
                 * may now be invalid.
                 */
                setValue("teamId", "", {
                  shouldDirty: true,
                });

                setValue("reportingManagerId", "", {
                  shouldDirty: true,
                });

                if (!departmentId) {
                  setTeams([]);

                  return;
                }

                await loadTeamsForDepartment(departmentId);
              },
            })}
          >
            <option value="">
              {isLoadingOptions ? "Loading departments..." : "No department"}
            </option>

            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </Field>

        {/* TEAM */}

        <Field
          label={selectedRoleScope === "TEAM" ? "Team *" : "Team"}
          hint={
            !selectedDepartmentId
              ? "Select a department first."
              : selectedRoleScope === "TEAM"
                ? "This role operates within the selected team."
                : undefined
          }
        >
          <select
            disabled={isSubmitting || !selectedDepartmentId || isLoadingTeams}
            className={selectClassName}
            {...register("teamId", {
              onChange: () => {
                /**
                 * User manually changed team.
                 *
                 * Previous reporting manager
                 * may belong to another team.
                 */
                setValue("reportingManagerId", "", {
                  shouldDirty: true,
                });
              },
            })}
          >
            <option value="">
              {!selectedDepartmentId
                ? "Select department first"
                : isLoadingTeams
                  ? "Loading teams..."
                  : "No team"}
            </option>

            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name} ({team.code})
              </option>
            ))}
          </select>

          {selectedDepartmentId && !isLoadingTeams && teams.length === 0 && (
            <p className="mt-1.5 text-xs font-medium text-amber-600">
              No active teams are available for this department.
            </p>
          )}
        </Field>

        {/* REPORTING MANAGER */}

        <Field
          label="Reporting manager"
          hint={
            selectedTeamId
              ? "Showing employees assigned to the selected team."
              : selectedDepartmentId
                ? "Showing employees assigned to the selected department."
                : "Select a department or team to narrow the manager list."
          }
        >
          <select
            disabled={isSubmitting || isLoadingOptions}
            className={selectClassName}
            {...register("reportingManagerId")}
          >
            <option value="">No reporting manager</option>

            {availableReportingManagers.map((manager) => {
              const managerUser =
                typeof manager.userId === "object" && manager.userId !== null
                  ? manager.userId
                  : null;

              const managerName =
                managerUser?.displayName ||
                managerUser?.email ||
                "Unnamed employee";

              const designation = manager.designation || "No designation";

              const employeeCode = manager.employeeCode || "No employee code";

              return (
                <option key={manager._id} value={manager._id}>
                  {managerName} — {designation} ({employeeCode})
                </option>
              );
            })}
          </select>

          {!isLoadingOptions && availableReportingManagers.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              No suitable reporting managers are currently available.
            </p>
          )}
        </Field>
      </Section>

      {/* ======================================================
          EMPLOYMENT DATES
      ====================================================== */}

      <Section
        icon={CalendarDays}
        title="Employment dates"
        description="Update joining and probation information."
      >
        <Field label="Joining date" error={errors.joiningDate?.message}>
          <input
            type="date"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("joiningDate")}
          />
        </Field>

        <Field
          label="Probation end date"
          error={errors.probationEndDate?.message}
        >
          <input
            type="date"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("probationEndDate", {
              validate: (probationEndDate, formValues) => {
                if (!probationEndDate || !formValues.joiningDate) {
                  return true;
                }

                return (
                  probationEndDate >= formValues.joiningDate ||
                  "Probation end date cannot be before the joining date."
                );
              },
            })}
          />
        </Field>
      </Section>

      {/* ======================================================
          WORK LOCATION
      ====================================================== */}

      <Section
        icon={MapPin}
        title="Work location"
        description="Update the employee's working arrangement and assigned location."
      >
        <Field
          label="Work location type"
          error={errors.workLocationType?.message}
        >
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("workLocationType", {
              required: "Work location type is required.",
            })}
          >
            <option value="HEAD_OFFICE">Head office</option>

            <option value="BRANCH">Branch</option>

            <option value="REMOTE">Remote</option>

            <option value="HYBRID">Hybrid</option>

            <option value="CLIENT_LOCATION">Client location</option>
          </select>
        </Field>

        <Field
          label="Work location name"
          error={errors.workLocationName?.message}
        >
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Bengaluru Corporate Office"
            className={inputClassName}
            {...register("workLocationName", {
              maxLength: {
                value: 150,

                message: "Work location name cannot exceed 150 characters.",
              },
            })}
          />
        </Field>
      </Section>

      {/* ======================================================
          ACCESS SETTINGS
      ====================================================== */}

      <Section
        icon={ShieldCheck}
        title="Access settings"
        description="Manage primary-company assignment and internal notes."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("isPrimaryCompany")}
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Primary company
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Set this as the employee&apos;s primary company assignment.
                Existing primary assignments may be cleared automatically.
              </span>
            </span>
          </label>
        </div>

        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="Internal notes" error={errors.notes?.message}>
            <textarea
              disabled={isSubmitting}
              placeholder="Add internal employment notes..."
              className={textAreaClassName}
              {...register("notes", {
                maxLength: {
                  value: 1000,

                  message: "Notes cannot exceed 1,000 characters.",
                },
              })}
            />
          </Field>
        </div>
      </Section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            Company access status:{" "}
            <span className="font-semibold">{companyAccess.status}</span>
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Status is managed separately and will not be changed by this form.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/employees/${employeeId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions || isLoadingTeams}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving employment...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save employment
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * ============================================================
 * FIELD
 * ============================================================
 */

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>

      {children}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}

      {error && <p className={errorClassName}>{error}</p>}
    </div>
  );
}

/**
 * ============================================================
 * SECTION
 * ============================================================
 */

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">{title}</h2>

            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

/**
 * ============================================================
 * SKELETON
 * ============================================================
 */

function EmploymentFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}
