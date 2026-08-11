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
  RefreshCcw,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import { departmentService } from "@/features/departments/services/department.service";
import type {
  Department,
  DepartmentStatus,
  UpdateDepartmentPayload,
} from "@/features/departments/types/department.types";

import { useAuthStore } from "@/store/auth.store";

interface EditDepartmentFormProps {
  departmentId: string;
}

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

function getReferenceId(
  value:
    | {
        _id: string;
      }
    | string
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

export function EditDepartmentForm({ departmentId }: EditDepartmentFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canUpdateDepartment = permissions.includes("department.update");

  const [department, setDepartment] = useState<Department | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [departmentHeadOptions, setDepartmentHeadOptions] = useState<
    CompanyAccess[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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

  const loadDepartment = useCallback(async () => {
    if (!canUpdateDepartment) {
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
      setLoadError(null);

      const data = await departmentService.getDepartmentById(
        company._id,
        departmentId,
      );

      setDepartment(data);

      reset({
        name: data.name ?? "",

        code: data.code ?? "",

        description: data.description ?? "",

        departmentHeadId: getReferenceId(data.departmentHeadId),

        parentDepartmentId: getReferenceId(data.parentDepartmentId),

        status: data.status ?? "ACTIVE",
      });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Unable to retrieve department information.",
      );

      setDepartment(null);
      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [canUpdateDepartment, company?._id, departmentId, reset]);

  const loadOptions = useCallback(async () => {
    if (!canUpdateDepartment) {
      setIsLoadingOptions(false);
      return;
    }

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

      /*
       * Do not allow the department to become
       * its own parent.
       */
      setDepartments(
        departmentResult.departments.filter(
          (item) => item._id !== departmentId,
        ),
      );

      setDepartmentHeadOptions(companyAccessResult.records);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to load department options."));
    } finally {
      setIsLoadingOptions(false);
    }
  }, [canUpdateDepartment, company?._id, departmentId]);

  useEffect(() => {
    void loadDepartment();
  }, [loadDepartment]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const onSubmit: SubmitHandler<DepartmentFormValues> = async (values) => {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    if (!department?._id) {
      toast.error("Department information is unavailable.");

      return;
    }

    const payload: UpdateDepartmentPayload = {
      name: values.name.trim(),

      code: values.code.trim().replace(/\s+/g, "_").toUpperCase(),

      description: values.description.trim(),

      departmentHeadId: values.departmentHeadId || null,

      parentDepartmentId: values.parentDepartmentId || null,
    };

    try {
      await departmentService.updateDepartment(
        company._id,
        department._id,
        payload,
      );

      /*
       * Status is handled by a separate backend
       * endpoint, so update it only when changed.
       */
      if (values.status !== department.status) {
        await departmentService.updateDepartmentStatus(
          company._id,
          department._id,
          values.status,
        );
      }

      toast.success("Department updated successfully.");

      router.push(`/departments/${department._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update department."));
    }
  };

  if (!canUpdateDepartment) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
        <h1 className="text-xl font-bold text-red-950">Access denied</h1>

        <p className="mt-2 text-sm text-red-700">
          You do not have permission to update departments.
        </p>

        <Link
          href="/departments"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to departments
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <DepartmentFormSkeleton />;
  }

  if (loadError || !department) {
    return (
      <div className="space-y-6">
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to departments
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load department
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {loadError ?? "Department information is unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadDepartment()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href={`/departments/${department._id}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Edit department
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update department information, hierarchy and leadership.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Editing department
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {department.name}
          </p>
        </div>
      </div>

      <Section
        icon={Building2}
        title="Department information"
        description="Update department name and code."
      >
        <Field label="Department name" required error={errors.name?.message}>
          <input
            type="text"
            disabled={isSubmitting}
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
        description="Update department leadership and hierarchy."
      >
        <Field
          label="Department head"
          hint="Optional. Select an active employee with company access."
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
          hint="Optional. A department cannot be its own parent."
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

            {departments.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Status"
          required
          error={errors.status?.message}
          hint="Changing status uses the department status API."
        >
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
        description="Update the department's responsibilities and purpose."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="Description" error={errors.description?.message}>
            <textarea
              disabled={isSubmitting}
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
            Department ID:{" "}
            <span className="font-semibold">{department._id}</span>
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Department hierarchy rules are validated by the backend.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/departments/${department._id}`}
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
                Saving department...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
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

function DepartmentFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}
