"use client";

import { useRouter } from "next/navigation";
import { Loader2, Save, UserCog } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { companyAdministratorService } from "../services/company-administrator.service";

import {
  companyAdministratorEditSchema,
  type CompanyAdministratorEditFormInput,
  type CompanyAdministratorEditFormValues,
} from "../validations/company-administrator.schema";

import type {
  CompanyAdministrator,
  UpdateCompanyAdministratorPayload,
} from "../types/company-administrator.types";

interface CompanyAdministratorEditFormProps {
  companyId: string;
  administrator: CompanyAdministrator;
}

export function CompanyAdministratorEditForm({
  companyId,
  administrator,
}: CompanyAdministratorEditFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    CompanyAdministratorEditFormInput,
    unknown,
    CompanyAdministratorEditFormValues
  >({
    resolver: zodResolver(companyAdministratorEditSchema),

    defaultValues: {
      firstName: administrator.user.firstName ?? "",

      middleName: administrator.user.middleName ?? "",

      lastName: administrator.user.lastName ?? "",

      displayName: administrator.user.displayName ?? "",

      email: administrator.user.email ?? "",

      mobile: administrator.user.mobile ?? "",

      gender: administrator.user.gender ?? "PREFER_NOT_TO_SAY",

      dateOfBirth: administrator.user.dateOfBirth
        ? administrator.user.dateOfBirth.split("T")[0]
        : "",

      employeeCode: administrator.companyAccess.employeeCode ?? "",

      designation:
        administrator.companyAccess.designation ?? "Company Administrator",

      employmentType: administrator.companyAccess.employmentType ?? "FULL_TIME",

      joiningDate: administrator.companyAccess.joiningDate
        ? administrator.companyAccess.joiningDate.split("T")[0]
        : "",

      workLocationType:
        administrator.companyAccess.workLocationType ?? "HEAD_OFFICE",

      workLocationName: administrator.companyAccess.workLocationName ?? "",

      notes: administrator.companyAccess.notes ?? "",

      emailVerified: administrator.user.emailVerified ?? false,

      mobileVerified: administrator.user.mobileVerified ?? false,
    },
  });

  const onSubmit = async (values: CompanyAdministratorEditFormValues) => {
    const payload: UpdateCompanyAdministratorPayload = {
      firstName: values.firstName,

      middleName: values.middleName || "",

      lastName: values.lastName,

      displayName: values.displayName || "",

      email: values.email,

      mobile: values.mobile || "",

      gender: values.gender,

      dateOfBirth: values.dateOfBirth || null,

      employeeCode: values.employeeCode,

      designation: values.designation,

      employmentType: values.employmentType,

      joiningDate: values.joiningDate || null,

      workLocationType: values.workLocationType,

      workLocationName: values.workLocationName || "",

      emailVerified: values.emailVerified,

      mobileVerified: values.mobileVerified,

      notes: values.notes || "",
    };

    try {
      await companyAdministratorService.updateCompanyAdministrator(
        companyId,
        payload,
      );

      toast.success("Company administrator updated successfully.");

      router.replace(`/platform/companies/${companyId}`);

      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to update company administrator."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection
        icon={UserCog}
        title="Administrator information"
        description="Update the primary administrator's personal information."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FormField
            label="First name"
            required
            error={errors.firstName?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter first name"
              {...register("firstName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Middle name" error={errors.middleName?.message}>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter middle name"
              {...register("middleName")}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Last name"
            required
            error={errors.lastName?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter last name"
              {...register("lastName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Display name" error={errors.displayName?.message}>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Example: Shashi Reddy"
              {...register("displayName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Gender" error={errors.gender?.message}>
            <select
              disabled={isSubmitting}
              {...register("gender")}
              className={inputClass}
            >
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>

              <option value="MALE">Male</option>

              <option value="FEMALE">Female</option>

              <option value="OTHER">Other</option>
            </select>
          </FormField>

          <FormField label="Date of birth" error={errors.dateOfBirth?.message}>
            <input
              type="date"
              disabled={isSubmitting}
              {...register("dateOfBirth")}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Contact information"
        description="Update the administrator's email and mobile number. Password is managed separately."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Email address"
            required
            error={errors.email?.message}
          >
            <input
              type="email"
              disabled={isSubmitting}
              autoComplete="email"
              placeholder="admin@company.com"
              {...register("email")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Mobile number" error={errors.mobile?.message}>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter mobile number"
              {...register("mobile")}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">
            Password is not changed here
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            Use the separate Reset Password option when the administrator's
            login password needs to be changed.
          </p>
        </div>
      </FormSection>

      <FormSection
        title="Company access"
        description="Update the administrator's employment and company-specific information."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FormField
            label="Employee code"
            required
            error={errors.employeeCode?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Example: NBS-ADM-001"
              {...register("employeeCode")}
              className={`${inputClass} uppercase`}
            />
          </FormField>

          <FormField
            label="Designation"
            required
            error={errors.designation?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              {...register("designation")}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Employment type"
            error={errors.employmentType?.message}
          >
            <select
              disabled={isSubmitting}
              {...register("employmentType")}
              className={inputClass}
            >
              <option value="FULL_TIME">Full time</option>

              <option value="PART_TIME">Part time</option>

              <option value="CONTRACT">Contract</option>

              <option value="INTERN">Intern</option>

              <option value="CONSULTANT">Consultant</option>

              <option value="FREELANCER">Freelancer</option>
            </select>
          </FormField>

          <FormField
            label="Joining date"
            required
            error={errors.joiningDate?.message}
          >
            <input
              type="date"
              disabled={isSubmitting}
              {...register("joiningDate")}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Work location type"
            error={errors.workLocationType?.message}
          >
            <select
              disabled={isSubmitting}
              {...register("workLocationType")}
              className={inputClass}
            >
              <option value="HEAD_OFFICE">Head office</option>

              <option value="BRANCH">Branch</option>

              <option value="REMOTE">Remote</option>

              <option value="HYBRID">Hybrid</option>

              <option value="CLIENT_LOCATION">Client location</option>
            </select>
          </FormField>

          <FormField
            label="Work location"
            error={errors.workLocationName?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Example: Bengaluru"
              {...register("workLocationName")}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Verification settings"
        description="Manage the administrator's email and mobile verification state."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...register("emailVerified")}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="font-semibold text-slate-800">Email verified</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Mark the administrator's current email address as verified.
                </p>
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...register("mobileVerified")}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="font-semibold text-slate-800">Mobile verified</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Mark the administrator's current mobile number as verified.
                </p>
              </div>
            </label>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Administrative notes"
        description="Update internal notes related to this administrator assignment."
      >
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea
            rows={4}
            disabled={isSubmitting}
            placeholder="Enter optional notes"
            {...register("notes")}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </FormField>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.back()}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
