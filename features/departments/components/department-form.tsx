"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  Network,
  Save,
  UserRoundCog,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import { departmentService } from "@/features/departments/services/department.service";
import type {
  CreateDepartmentPayload,
  Department,
  DepartmentStatus,
} from "@/features/departments/types/department.types";

import { useAuthStore } from "@/store/auth.store";

interface DepartmentFormValues {
  name: string;
  code: string;
  description: string;

  departmentHeadId: string;
  parentDepartmentId: string;

  status: DepartmentStatus;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName = inputClassName;

const textAreaClassName =
  "min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

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

function getCompanyAccessDisplayName(companyAccess: CompanyAccess) {
  const user =
    typeof companyAccess.userId === "object" && companyAccess.userId !== null
      ? companyAccess.userId
      : null;

  const name = user?.displayName || user?.email || "Unnamed employee";

  const designation = companyAccess.designation || "No designation";

  const employeeCode = companyAccess.employeeCode || "No employee code";

  return `${name} — ${designation} (${employeeCode})`;
}

export function DepartmentForm() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [departmentHeadOptions, setDepartmentHeadOptions] = useState<
    CompanyAccess[]
  >([]);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    defaultValues: {
      name: "",
      code: "",
      description: "",

      departmentHeadId: "",
      parentDepartmentId: "",

      status: "ACTIVE",
    },

    mode: "onBlur",
  });

  const loadOptions = useCallback(async () => {
    if (!company?._id) {
      return;
    }

    try {
      setIsLoadingOptions(true);

      const [departmentResult, companyAccessResult] = await Promise.all([
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

      setDepartments(departmentResult.departments);

      setDepartmentHeadOptions(companyAccessResult.records);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to load department options."));
    } finally {
      setIsLoadingOptions(false);
    }
  }, [company?._id]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const onSubmit: SubmitHandler<DepartmentFormValues> = async (values) => {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    const payload: CreateDepartmentPayload = {
      name: values.name.trim(),

      code: values.code.trim().replace(/\s+/g, "_").toUpperCase(),

      description: values.description.trim(),

      departmentHeadId: values.departmentHeadId || null,

      parentDepartmentId: values.parentDepartmentId || null,

      status: values.status,
    };

    try {
      const createdDepartment = await departmentService.createDepartment(
        company._id,
        payload,
      );

      toast.success(
        `${createdDepartment.name} department created successfully.`,
      );

      router.push("/departments");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create department."));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/departments"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Create department
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a new department and configure its organisational
              structure.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Company
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {company?.name ?? "Active company"}
          </p>
        </div>
      </div>

      <Section
        icon={Building2}
        title="Department information"
        description="Enter the department name, code and description."
      >
        <Field label="Department name" required error={errors.name?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Human Resources"
            className={inputClassName}
            {...register("name", {
              required: "Department name is required.",

              minLength: {
                value: 2,
                message: "Department name must contain at least 2 characters.",
              },

              maxLength: {
                value: 100,
                message: "Department name cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field
          label="Department code"
          required
          error={errors.code?.message}
          hint="The code will be converted to uppercase automatically."
        >
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="HR"
            className={inputClassName}
            {...register("code", {
              required: "Department code is required.",

              minLength: {
                value: 2,
                message: "Department code must contain at least 2 characters.",
              },

              maxLength: {
                value: 20,
                message: "Department code cannot exceed 20 characters.",
              },
            })}
          />
        </Field>
      </Section>

      <Section
        icon={Network}
        title="Organisation structure"
        description="Configure the department head and hierarchy."
      >
        <Field
          label="Department head"
          hint="Optional. The department head must have active company access."
        >
          <select
            disabled={isSubmitting || isLoadingOptions}
            className={selectClassName}
            {...register("departmentHeadId")}
          >
            <option value="">
              {isLoadingOptions ? "Loading employees..." : "No department head"}
            </option>

            {departmentHeadOptions.map((companyAccess) => (
              <option key={companyAccess._id} value={companyAccess._id}>
                {getCompanyAccessDisplayName(companyAccess)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Parent department"
          hint="Optional. Use this when the department belongs under another department."
        >
          <select
            disabled={isSubmitting || isLoadingOptions}
            className={selectClassName}
            {...register("parentDepartmentId")}
          >
            <option value="">
              {isLoadingOptions
                ? "Loading departments..."
                : "No parent department"}
            </option>

            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" required error={errors.status?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("status", {
              required: "Department status is required.",
            })}
          >
            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </Section>

      <Section
        icon={FileText}
        title="Department description"
        description="Add information about the department's responsibilities."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="Description" error={errors.description?.message}>
            <textarea
              disabled={isSubmitting}
              placeholder="Describe the department's responsibilities, functions and purpose..."
              className={textAreaClassName}
              {...register("description", {
                maxLength: {
                  value: 1000,
                  message:
                    "Department description cannot exceed 1,000 characters.",
                },
              })}
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            Create this department for{" "}
            <span className="font-semibold">
              {company?.name ?? "the active company"}
            </span>
            .
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Department name and code must be unique within the company.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href="/departments"
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
                Creating department...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create department
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
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required = false, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className={labelClassName}>
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

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
