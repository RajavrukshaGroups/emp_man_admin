"use client";

import axios from "axios";
// import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  ContactRound,
  FileBadge,
  HeartHandshake,
  Loader2,
  MapPinHouse,
  Save,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";
import {
  createEmployeeSchema,
  type CreateEmployeeFormInput,
  type CreateEmployeeFormValues,
} from "@/features/employees/validations/create-employee.schema";
import type { User } from "@/features/users/types/user.types";
import { useAuthStore } from "@/store/auth.store";

interface EmployeeProfileStepProps {
  user: User;
  companyAccessId: string;
  onBack: () => void;
  onSuccess: (employeeId: string) => void;
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

const selectClassName = inputClassName;

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

function hasValues(object: Record<string, unknown>) {
  return Object.values(object).some(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

export function EmployeeProfileStep({
  user,
  companyAccessId,
  onBack,
  onSuccess,
}: EmployeeProfileStepProps) {
  // const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormInput, unknown, CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),

    defaultValues: {
      dateOfBirth: user.dateOfBirth ?? "",
      gender: user.gender ?? "",

      maritalStatus: "",
      bloodGroup: "",
      nationality: "Indian",

      personalEmail: "",
      alternateMobile: "",

      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      postalCode: "",

      permanentAddressLine1: "",
      permanentAddressLine2: "",
      permanentCity: "",
      permanentDistrict: "",
      permanentState: "",
      permanentCountry: "India",
      permanentPostalCode: "",

      isPermanentAddressSame: true,

      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactMobile: "",
      emergencyContactAlternateMobile: "",

      accountHolderName: user.displayName,
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      accountType: "",

      panNumber: "",
      aadhaarNumber: "",
      uanNumber: "",
      esiNumber: "",
      pfNumber: "",
      taxRegime: "",
    },

    mode: "onBlur",
  });

  const isPermanentAddressSame = watch("isPermanentAddressSame");

  async function onSubmit(values: CreateEmployeeFormValues) {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");
      return;
    }

    const personalDetails = {
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      maritalStatus: values.maritalStatus,
      bloodGroup: values.bloodGroup,
      nationality: values.nationality,
    };

    const currentAddress = {
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      district: values.district,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode,
    };

    const permanentAddress = isPermanentAddressSame
      ? currentAddress
      : {
          addressLine1: values.permanentAddressLine1,
          addressLine2: values.permanentAddressLine2,
          city: values.permanentCity,
          district: values.permanentDistrict,
          state: values.permanentState,
          country: values.permanentCountry,
          postalCode: values.permanentPostalCode,
        };

    const contactDetails = {
      personalEmail: values.personalEmail,
      alternateMobile: values.alternateMobile,
      currentAddress,
      permanentAddress,
      isPermanentAddressSame: values.isPermanentAddressSame,
    };

    const bankDetails = {
      accountHolderName: values.accountHolderName,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode,
      branchName: values.branchName,
      accountType: values.accountType,
    };

    const statutoryDetails = {
      panNumber: values.panNumber,
      aadhaarNumber: values.aadhaarNumber,
      uanNumber: values.uanNumber,
      esiNumber: values.esiNumber,
      pfNumber: values.pfNumber,
      taxRegime: values.taxRegime,
    };

    const hasEmergencyContact = Boolean(
      values.emergencyContactName ||
      values.emergencyContactRelationship ||
      values.emergencyContactMobile ||
      values.emergencyContactAlternateMobile,
    );

    try {
      const createdEmployee = await employeeService.createEmployee(
        company._id,
        {
          companyAccessId,

          personalDetails: hasValues(personalDetails)
            ? personalDetails
            : undefined,

          contactDetails: hasValues(contactDetails)
            ? contactDetails
            : undefined,

          emergencyContacts: hasEmergencyContact
            ? [
                {
                  name: values.emergencyContactName!,
                  relationship: values.emergencyContactRelationship!,
                  mobile: values.emergencyContactMobile!,
                  alternateMobile: values.emergencyContactAlternateMobile,
                },
              ]
            : undefined,

          bankDetails: hasValues(bankDetails) ? bankDetails : undefined,

          statutoryDetails: hasValues(statutoryDetails)
            ? statutoryDetails
            : undefined,
        },
      );

      toast.success(
        `${user.displayName}'s employee profile was created successfully.`,
      );

      onSuccess(createdEmployee._id);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to create the employee profile."),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Employee profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete personal, contact, bank and statutory information.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Company access created
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {user.displayName}
          </p>
        </div>
      </div>

      <Section
        icon={UserRound}
        title="Personal information"
        description="Enter personal and identity information."
      >
        <Field label="Date of birth" error={errors.dateOfBirth?.message}>
          <input
            type="date"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("dateOfBirth")}
          />
        </Field>

        <Field label="Gender" error={errors.gender?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("gender")}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </Field>

        <Field label="Marital status" error={errors.maritalStatus?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("maritalStatus")}
          >
            <option value="">Select marital status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
            <option value="SEPARATED">Separated</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>

        <Field label="Blood group" error={errors.bloodGroup?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("bloodGroup")}
          >
            <option value="">Select blood group</option>
            <option value="A_POSITIVE">A+</option>
            <option value="A_NEGATIVE">A-</option>
            <option value="B_POSITIVE">B+</option>
            <option value="B_NEGATIVE">B-</option>
            <option value="AB_POSITIVE">AB+</option>
            <option value="AB_NEGATIVE">AB-</option>
            <option value="O_POSITIVE">O+</option>
            <option value="O_NEGATIVE">O-</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </Field>

        <Field label="Nationality" error={errors.nationality?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("nationality")}
          />
        </Field>
      </Section>

      <Section
        icon={ContactRound}
        title="Contact information"
        description="Add personal contact information."
      >
        <Field label="Personal email" error={errors.personalEmail?.message}>
          <input
            type="email"
            placeholder="personal@example.com"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("personalEmail")}
          />
        </Field>

        <Field label="Alternate mobile" error={errors.alternateMobile?.message}>
          <input
            type="tel"
            disabled={isSubmitting}
            className={inputClassName}
            {...register("alternateMobile")}
          />
        </Field>
      </Section>

      <Section
        icon={MapPinHouse}
        title="Current address"
        description="Enter the employee's current residential address."
      >
        <Field label="Address line 1">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("addressLine1")}
          />
        </Field>

        <Field label="Address line 2">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("addressLine2")}
          />
        </Field>

        <Field label="City">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("city")}
          />
        </Field>

        <Field label="District">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("district")}
          />
        </Field>

        <Field label="State">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("state")}
          />
        </Field>

        <Field label="Country">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("country")}
          />
        </Field>

        <Field label="Postal code">
          <input
            className={inputClassName}
            disabled={isSubmitting}
            {...register("postalCode")}
          />
        </Field>

        <div className="flex items-center">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input type="checkbox" {...register("isPermanentAddressSame")} />

            <span className="text-sm font-semibold text-slate-700">
              Permanent address is the same
            </span>
          </label>
        </div>
      </Section>

      {!isPermanentAddressSame && (
        <Section
          icon={MapPinHouse}
          title="Permanent address"
          description="Enter the permanent residential address."
        >
          <Field label="Address line 1">
            <input
              className={inputClassName}
              {...register("permanentAddressLine1")}
            />
          </Field>

          <Field label="Address line 2">
            <input
              className={inputClassName}
              {...register("permanentAddressLine2")}
            />
          </Field>

          <Field label="City">
            <input className={inputClassName} {...register("permanentCity")} />
          </Field>

          <Field label="District">
            <input
              className={inputClassName}
              {...register("permanentDistrict")}
            />
          </Field>

          <Field label="State">
            <input className={inputClassName} {...register("permanentState")} />
          </Field>

          <Field label="Country">
            <input
              className={inputClassName}
              {...register("permanentCountry")}
            />
          </Field>

          <Field label="Postal code">
            <input
              className={inputClassName}
              {...register("permanentPostalCode")}
            />
          </Field>
        </Section>
      )}

      <Section
        icon={HeartHandshake}
        title="Emergency contact"
        description="Provide one emergency contact."
      >
        <Field
          label="Contact name"
          error={errors.emergencyContactName?.message}
        >
          <input
            className={inputClassName}
            {...register("emergencyContactName")}
          />
        </Field>

        <Field
          label="Relationship"
          error={errors.emergencyContactRelationship?.message}
        >
          <input
            className={inputClassName}
            {...register("emergencyContactRelationship")}
          />
        </Field>

        <Field label="Mobile" error={errors.emergencyContactMobile?.message}>
          <input
            className={inputClassName}
            {...register("emergencyContactMobile")}
          />
        </Field>

        <Field label="Alternate mobile">
          <input
            className={inputClassName}
            {...register("emergencyContactAlternateMobile")}
          />
        </Field>
      </Section>

      <Section
        icon={Banknote}
        title="Bank information"
        description="Enter salary account information."
      >
        <Field label="Account holder name">
          <input
            className={inputClassName}
            {...register("accountHolderName")}
          />
        </Field>

        <Field label="Bank name">
          <input className={inputClassName} {...register("bankName")} />
        </Field>

        <Field label="Account number">
          <input className={inputClassName} {...register("accountNumber")} />
        </Field>

        <Field label="IFSC code">
          <input className={inputClassName} {...register("ifscCode")} />
        </Field>

        <Field label="Branch name">
          <input className={inputClassName} {...register("branchName")} />
        </Field>

        <Field label="Account type">
          <select className={selectClassName} {...register("accountType")}>
            <option value="">Select account type</option>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
            <option value="SALARY">Salary</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </Section>

      <Section
        icon={FileBadge}
        title="Statutory information"
        description="Enter government and payroll identifiers."
      >
        <Field label="PAN number">
          <input className={inputClassName} {...register("panNumber")} />
        </Field>

        <Field label="Aadhaar number">
          <input className={inputClassName} {...register("aadhaarNumber")} />
        </Field>

        <Field label="UAN number">
          <input className={inputClassName} {...register("uanNumber")} />
        </Field>

        <Field label="ESI number">
          <input className={inputClassName} {...register("esiNumber")} />
        </Field>

        <Field label="PF number">
          <input className={inputClassName} {...register("pfNumber")} />
        </Field>

        <Field label="Tax regime">
          <select className={selectClassName} {...register("taxRegime")}>
            <option value="">Select tax regime</option>
            <option value="OLD">Old regime</option>
            <option value="NEW">New regime</option>
          </select>
        </Field>
      </Section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <p className="mb-3 text-xs text-slate-500 sm:mb-0">
          Completing this step creates the final employee profile.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating employee...
              </>
            ) : (
              <>
                <BadgeCheck className="h-4 w-4" />
                Complete onboarding
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
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>

      {children}

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
            <h3 className="font-semibold text-slate-950">{title}</h3>

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
