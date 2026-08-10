"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings2,
} from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyService } from "@/features/companies/services/company.service";
import type {
  CompanyStatus,
  CreateCompanyPayload,
} from "@/features/companies/types/company.types";

interface CompanyFormValues {
  name: string;
  legalName: string;
  code: string;

  logo: string;

  email: string;
  phone: string;
  website: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  timezone: string;
  currency: string;

  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

  timeFormat: "12_HOUR" | "24_HOUR";

  status: CompanyStatus;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName = inputClassName;

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

export function CreateCompanyForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    defaultValues: {
      name: "",
      legalName: "",
      code: "",

      logo: "",

      email: "",
      phone: "",
      website: "",

      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",

      timezone: "Asia/Kolkata",
      currency: "INR",

      dateFormat: "DD/MM/YYYY",

      timeFormat: "12_HOUR",

      status: "ACTIVE",
    },

    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<CompanyFormValues> = async (values) => {
    const payload: CreateCompanyPayload = {
      name: values.name.trim(),

      legalName: values.legalName.trim() || undefined,

      code: values.code.trim().toUpperCase(),

      logo: values.logo.trim() || undefined,

      email: values.email.trim() || undefined,

      phone: values.phone.trim() || undefined,

      website: values.website.trim() || undefined,

      address: {
        addressLine1: values.addressLine1.trim(),

        addressLine2: values.addressLine2.trim(),

        city: values.city.trim(),

        state: values.state.trim(),

        country: values.country.trim(),

        postalCode: values.postalCode.trim(),
      },

      timezone: values.timezone.trim(),

      currency: values.currency.trim().toUpperCase(),

      dateFormat: values.dateFormat,

      timeFormat: values.timeFormat,

      status: values.status,
    };

    try {
      const company = await companyService.createCompany(payload);

      toast.success("Company created successfully.");

      //   router.push(`/platform/companies/${company._id}`);
      router.push("/platform/companies");

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create company."));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link
            href="/platform/companies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to companies
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Create company
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Register a new company in the Employee Management System. The
            company administrator can be assigned after the company is created.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Platform setup
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            Step 1 · Company information
          </p>
        </div>
      </div>

      <Section
        icon={Building2}
        title="Company information"
        description="Enter the primary company identity and registration details."
      >
        <Field label="Company name" error={errors.name?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Digital Elite Services India"
            className={inputClassName}
            {...register("name", {
              required: "Company name is required.",

              minLength: {
                value: 2,
                message: "Company name must contain at least 2 characters.",
              },

              maxLength: {
                value: 150,
                message: "Company name cannot exceed 150 characters.",
              },
            })}
          />
        </Field>

        <Field
          label="Legal name"
          error={errors.legalName?.message}
          hint="Optional registered/legal entity name."
        >
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Digital Elite Services Private Limited"
            className={inputClassName}
            {...register("legalName", {
              maxLength: {
                value: 200,
                message: "Legal name cannot exceed 200 characters.",
              },
            })}
          />
        </Field>

        <Field
          label="Company code"
          error={errors.code?.message}
          hint="Unique short code such as DES, RRG or DHS."
        >
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="DES"
            className={inputClassName}
            {...register("code", {
              required: "Company code is required.",

              minLength: {
                value: 2,
                message: "Company code must contain at least 2 characters.",
              },

              maxLength: {
                value: 20,
                message: "Company code cannot exceed 20 characters.",
              },

              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,

                message:
                  "Company code may contain only letters, numbers, underscore and hyphen.",
              },
            })}
          />
        </Field>

        <Field label="Status" error={errors.status?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("status", {
              required: "Company status is required.",
            })}
          >
            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>

        <div className="sm:col-span-2 xl:col-span-2">
          <Field
            label="Logo URL"
            error={errors.logo?.message}
            hint="Optional. We can add file upload support later."
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="https://example.com/company-logo.png"
              className={inputClassName}
              {...register("logo", {
                maxLength: {
                  value: 500,
                  message: "Logo URL cannot exceed 500 characters.",
                },
              })}
            />
          </Field>
        </div>
      </Section>

      <Section
        icon={Mail}
        title="Contact information"
        description="Add the company's primary contact and website details."
      >
        <Field label="Company email" error={errors.email?.message}>
          <input
            type="email"
            disabled={isSubmitting}
            placeholder="info@example.com"
            className={inputClassName}
            {...register("email", {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                message: "Enter a valid email address.",
              },
            })}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              disabled={isSubmitting}
              placeholder="9876543210"
              className={`${inputClassName} pl-10`}
              {...register("phone", {
                maxLength: {
                  value: 20,
                  message: "Phone number cannot exceed 20 characters.",
                },
              })}
            />
          </div>
        </Field>

        <Field label="Website" error={errors.website?.message}>
          <div className="relative">
            <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="url"
              disabled={isSubmitting}
              placeholder="https://example.com"
              className={`${inputClassName} pl-10`}
              {...register("website", {
                validate: (value) => {
                  if (!value) {
                    return true;
                  }

                  try {
                    new URL(value);
                    return true;
                  } catch {
                    return "Enter a valid website URL.";
                  }
                },
              })}
            />
          </div>
        </Field>
      </Section>

      <Section
        icon={MapPin}
        title="Company address"
        description="Provide the main registered or operating address."
      >
        <Field label="Address line 1" error={errors.addressLine1?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Corporate Office"
            className={inputClassName}
            {...register("addressLine1", {
              maxLength: {
                value: 250,
                message: "Address line 1 cannot exceed 250 characters.",
              },
            })}
          />
        </Field>

        <Field label="Address line 2" error={errors.addressLine2?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Building, area or landmark"
            className={inputClassName}
            {...register("addressLine2", {
              maxLength: {
                value: 250,
                message: "Address line 2 cannot exceed 250 characters.",
              },
            })}
          />
        </Field>

        <Field label="City" error={errors.city?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Bengaluru"
            className={inputClassName}
            {...register("city", {
              maxLength: {
                value: 100,
                message: "City cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field label="State" error={errors.state?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Karnataka"
            className={inputClassName}
            {...register("state", {
              maxLength: {
                value: 100,
                message: "State cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field label="Country" error={errors.country?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="India"
            className={inputClassName}
            {...register("country", {
              maxLength: {
                value: 100,
                message: "Country cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field label="Postal code" error={errors.postalCode?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="560001"
            className={inputClassName}
            {...register("postalCode", {
              maxLength: {
                value: 20,
                message: "Postal code cannot exceed 20 characters.",
              },
            })}
          />
        </Field>
      </Section>

      <Section
        icon={Settings2}
        title="Regional settings"
        description="Configure default timezone, currency and date/time preferences."
      >
        <Field label="Timezone" error={errors.timezone?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Asia/Kolkata"
            className={inputClassName}
            {...register("timezone", {
              required: "Timezone is required.",
            })}
          />
        </Field>

        <Field label="Currency" error={errors.currency?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="INR"
            maxLength={3}
            className={inputClassName}
            {...register("currency", {
              required: "Currency is required.",

              minLength: {
                value: 3,
                message: "Currency must contain 3 characters.",
              },

              maxLength: {
                value: 3,
                message: "Currency must contain 3 characters.",
              },
            })}
          />
        </Field>

        <Field label="Date format" error={errors.dateFormat?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("dateFormat", {
              required: "Date format is required.",
            })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>

            <option value="MM/DD/YYYY">MM/DD/YYYY</option>

            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </Field>

        <Field label="Time format" error={errors.timeFormat?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("timeFormat", {
              required: "Time format is required.",
            })}
          >
            <option value="12_HOUR">12 Hour</option>

            <option value="24_HOUR">24 Hour</option>
          </select>
        </Field>
      </Section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              What happens next?
            </h2>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              After creating the company, we will configure its first company
              administrator and company access.
            </p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            The company slug will be generated automatically from the company
            name and code.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href="/platform/companies"
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
                Creating company...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create company
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
