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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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

interface CompanyAccessStepProps {
  user: User;
  onBack: () => void;
  onSuccess: (companyAccess: CompanyAccess) => void;
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

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

export function CompanyAccessStep({
  user,
  onBack,
  onSuccess,
}: CompanyAccessStepProps) {
  const company = useAuthStore((state) => state.company);

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const {
    register,
    handleSubmit,
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

        const companyRoles = data.records.filter(
          (role) => role.scopeType === "COMPANY" && role.status === "ACTIVE",
        );

        setRoles(companyRoles);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to load company roles."));
      } finally {
        setIsLoadingRoles(false);
      }
    }

    void loadRoles();
  }, [company?._id]);

  async function onSubmit(values: CreateCompanyAccessFormValues) {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");
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

          departmentId: values.departmentId,
          teamId: values.teamId,
          reportingManagerId: values.reportingManagerId,

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
              Assign employment, role and work-location information.
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

            {!isLoadingRoles && roles.length === 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                No active company roles are available.
              </p>
            )}
          </div>
        </div>
      </div>

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

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Department assignment is temporarily optional
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-700">
          Department, team and reporting manager fields will be added after
          their frontend service modules are connected.
        </p>
      </div>

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
