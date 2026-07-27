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
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type {
  CompanyAccess,
  CompanyAccessDepartment,
  CompanyAccessRole,
  CompanyAccessTeam,
  EmploymentType,
  ReportingManagerAccess,
  UpdateCompanyAccessPayload,
  WorkLocationType,
} from "@/features/company-access/types/company-access.types";
import { employeeService } from "@/features/employees/services/employee.service";
import type {
  Employee,
  EmployeeCompanyAccessReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";
import { useAuthStore } from "@/store/auth.store";

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

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName = inputClassName;

const textAreaClassName =
  "min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

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

function getReferenceId(value: { _id: string } | string | null | undefined) {
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

function getRoleName(value: CompanyAccess["roleId"]) {
  if (typeof value === "object" && value !== null) {
    return (value as CompanyAccessRole).name;
  }

  return "";
}

function getDepartmentName(value: CompanyAccess["departmentId"]) {
  if (typeof value === "object" && value !== null) {
    return (value as CompanyAccessDepartment).name;
  }

  return "";
}

function getTeamName(value: CompanyAccess["teamId"]) {
  if (typeof value === "object" && value !== null) {
    return (value as CompanyAccessTeam).name;
  }

  return "";
}

function getReportingManagerName(value: CompanyAccess["reportingManagerId"]) {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  const manager = value as ReportingManagerAccess;

  if (typeof manager.userId === "object" && manager.userId !== null) {
    return (
      manager.userId.displayName ||
      manager.userId.email ||
      manager.employeeCode ||
      ""
    );
  }

  return manager.employeeCode || manager.designation || "";
}

export function EditEmploymentForm({ employeeId }: EditEmploymentFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [companyAccess, setCompanyAccess] = useState<CompanyAccess | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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

  const loadEmploymentInformation = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      setLoadError("Active company context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

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

      const accessData = await companyAccessService.getCompanyAccessById(
        company._id,
        companyAccessId,
      );

      setEmployee(employeeData);
      setCompanyAccess(accessData);

      reset({
        employeeCode: accessData.employeeCode ?? "",

        designation: accessData.designation ?? "",

        roleId: getReferenceId(accessData.roleId),

        departmentId: getReferenceId(accessData.departmentId),

        teamId: getReferenceId(accessData.teamId),

        reportingManagerId: getReferenceId(accessData.reportingManagerId),

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
      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, employeeId, reset]);

  useEffect(() => {
    void loadEmploymentInformation();
  }, [loadEmploymentInformation]);

  const onSubmit: SubmitHandler<EmploymentFormValues> = async (values) => {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");
      return;
    }

    if (!companyAccess?._id) {
      toast.error("Company access information is unavailable.");
      return;
    }

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

  if (isLoading) {
    return <EmploymentFormSkeleton />;
  }

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
            onClick={() => void loadEmploymentInformation()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const employeeUser = getEmployeeUser(employee);

  const employeeName = employeeUser?.displayName || "Employee";

  const roleName = getRoleName(companyAccess.roleId);

  const departmentName = getDepartmentName(companyAccess.departmentId);

  const teamName = getTeamName(companyAccess.teamId);

  const reportingManagerName = getReportingManagerName(
    companyAccess.reportingManagerId,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
              Update company access, assignment and work-location information.
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

      <Section
        icon={BriefcaseBusiness}
        title="Employment assignment"
        description="Update the employee code, designation and employment type."
      >
        <Field label="Employee code" error={errors.employeeCode?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="DES-EMP-001"
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
            placeholder="Senior Software Developer"
            className={inputClassName}
            {...register("designation", {
              required: "Designation is required.",
              maxLength: {
                value: 120,
                message: "Designation cannot exceed 120 characters.",
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

      <Section
        icon={Building2}
        title="Organisation assignment"
        description="Update role, department, team and reporting manager IDs."
      >
        <Field
          label="Role ID"
          error={errors.roleId?.message}
          hint={roleName ? `Current role: ${roleName}` : undefined}
        >
          <input
            type="text"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("roleId", {
              required: "Role ID is required.",
            })}
          />
        </Field>

        <Field
          label="Department ID"
          hint={
            departmentName
              ? `Current department: ${departmentName}`
              : "Leave empty to remove the department."
          }
        >
          <input
            type="text"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("departmentId")}
          />
        </Field>

        <Field
          label="Team ID"
          hint={
            teamName
              ? `Current team: ${teamName}`
              : "Leave empty to remove the team."
          }
        >
          <input
            type="text"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("teamId")}
          />
        </Field>

        <Field
          label="Reporting manager access ID"
          hint={
            reportingManagerName
              ? `Current manager: ${reportingManagerName}`
              : "Leave empty if no reporting manager is assigned."
          }
        >
          <input
            type="text"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("reportingManagerId")}
          />
        </Field>
      </Section>

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
                Set this as the employee's primary company assignment. Existing
                primary assignments may be cleared automatically.
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
                  value: 2000,
                  message: "Notes cannot exceed 2,000 characters.",
                },
              })}
            />
          </Field>
        </div>
      </Section>

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
            disabled={isSubmitting}
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
