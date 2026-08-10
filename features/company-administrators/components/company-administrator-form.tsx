"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, UserCog } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { companyAdministratorService } from "../services/company-administrator.service";

import {
  companyAdministratorSchema,
  type CompanyAdministratorFormInput,
  type CompanyAdministratorFormValues,
} from "../validations/company-administrator.schema";

interface CompanyAdministratorFormProps {
  companyId: string;
}

export function CompanyAdministratorForm({
  companyId,
}: CompanyAdministratorFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    CompanyAdministratorFormInput,
    unknown,
    CompanyAdministratorFormValues
  >({
    resolver: zodResolver(companyAdministratorSchema),

    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      displayName: "",

      email: "",
      mobile: "",

      password: "",
      confirmPassword: "",

      gender: "PREFER_NOT_TO_SAY",
      dateOfBirth: "",

      employeeCode: "",

      designation: "Company Administrator",

      employmentType: "FULL_TIME",

      joiningDate: new Date().toISOString().split("T")[0],

      workLocationType: "HEAD_OFFICE",

      workLocationName: "",

      notes: "Primary administrator created by platform Super Admin.",

      emailVerified: true,
      mobileVerified: true,

      status: "ACTIVE",
    },
  });

  const onSubmit = async (values: CompanyAdministratorFormValues) => {
    try {
      await companyAdministratorService.createCompanyAdministrator(companyId, {
        firstName: values.firstName,
        middleName: values.middleName || "",
        lastName: values.lastName,
        displayName: values.displayName || "",

        email: values.email,
        mobile: values.mobile || undefined,

        password: values.password,

        gender: values.gender,
        dateOfBirth: values.dateOfBirth || undefined,

        employeeCode: values.employeeCode,
        designation: values.designation,

        employmentType: values.employmentType,

        joiningDate: values.joiningDate || undefined,

        workLocationType: values.workLocationType,

        workLocationName: values.workLocationName || "",

        emailVerified: values.emailVerified,

        mobileVerified: values.mobileVerified,

        notes: values.notes || "",
      });

      toast.success("Company administrator created successfully.");

      router.replace(`/platform/companies/${companyId}`);

      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to create company administrator."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Personal information */}

      <FormSection
        icon={UserCog}
        title="Administrator information"
        description="Enter the personal and login information for the company's primary administrator."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FormField
            label="First name"
            required
            error={errors.firstName?.message}
          >
            <input
              type="text"
              placeholder="Enter first name"
              {...register("firstName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Middle name" error={errors.middleName?.message}>
            <input
              type="text"
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
              placeholder="Enter last name"
              {...register("lastName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Display name" error={errors.displayName?.message}>
            <input
              type="text"
              placeholder="Example: Anup Admin"
              {...register("displayName")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Gender" error={errors.gender?.message}>
            <select {...register("gender")} className={inputClass}>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>

              <option value="MALE">Male</option>

              <option value="FEMALE">Female</option>

              <option value="OTHER">Other</option>
            </select>
          </FormField>

          <FormField label="Date of birth" error={errors.dateOfBirth?.message}>
            <input
              type="date"
              {...register("dateOfBirth")}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Contact and login */}

      <FormSection
        title="Contact & login credentials"
        description="These credentials will be used by the administrator to sign in to the Employee Management System."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Email address"
            required
            error={errors.email?.message}
          >
            <input
              type="email"
              autoComplete="email"
              placeholder="admin@company.com"
              {...register("email")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Mobile number" error={errors.mobile?.message}>
            <input
              type="text"
              placeholder="Enter mobile number"
              {...register("mobile")}
              className={inputClass}
            />
          </FormField>

          <FormField label="Password" required error={errors.password?.message}>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter password"
                {...register("password")}
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <FormField
            label="Confirm password"
            required
            error={errors.confirmPassword?.message}
          >
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                {...register("confirmPassword")}
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>
        </div>
      </FormSection>

      {/* Employment information */}

      <FormSection
        title="Company access"
        description="Configure the administrator's employment and company access information."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FormField
            label="Employee code"
            required
            error={errors.employeeCode?.message}
          >
            <input
              type="text"
              placeholder="Example: TTC-ADM-001"
              {...register("employeeCode")}
              className={`${inputClass} uppercase`}
            />
          </FormField>

          <FormField label="Designation" error={errors.designation?.message}>
            <input
              type="text"
              {...register("designation")}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Employment type"
            error={errors.employmentType?.message}
          >
            <select {...register("employmentType")} className={inputClass}>
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
              {...register("joiningDate")}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Work location type"
            error={errors.workLocationType?.message}
          >
            <select {...register("workLocationType")} className={inputClass}>
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
              placeholder="Example: Bengaluru"
              {...register("workLocationName")}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Account options */}

      <FormSection
        title="Account configuration"
        description="Configure the initial account status and verification settings."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                {...register("emailVerified")}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="font-semibold text-slate-800">Email verified</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Mark the administrator's email address as verified
                  immediately.
                </p>
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                {...register("mobileVerified")}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="font-semibold text-slate-800">Mobile verified</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Mark the administrator's mobile number as verified
                  immediately.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FormField label="Account status" error={errors.status?.message}>
            <select {...register("status")} className={inputClass}>
              <option value="ACTIVE">Active</option>

              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Notes */}

      <FormSection
        title="Administrative notes"
        description="Internal notes related to this administrator assignment."
      >
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea
            rows={4}
            placeholder="Enter optional notes"
            {...register("notes")}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </FormField>
      </FormSection>

      {/* Submit actions */}

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
              Creating administrator...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create administrator
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

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
