"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { platformAdminService } from "../services/platform-admin.service";

import type {
  PlatformAdminStatus,
  PlatformRole,
} from "../types/platform-admin.types";

interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;

  displayName: string;

  email: string;
  mobile: string;

  roleId: string;

  password: string;
  confirmPassword: string;

  status: PlatformAdminStatus;
}

const initialFormState: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",

  displayName: "",

  email: "",
  mobile: "",

  roleId: "",

  password: "",
  confirmPassword: "",

  status: "ACTIVE",
};

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to create platform administrator.",
) {
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

export function CreatePlatformAdminForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialFormState);

  const [roles, setRoles] = useState<PlatformRole[]>([]);

  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setIsLoadingRoles(true);

      const result = await platformAdminService.getPlatformRoles();

      const availableRoles = result.roles ?? [];

      setRoles(availableRoles);

      if (availableRoles.length === 1) {
        setForm((current) => ({
          ...current,
          roleId: availableRoles[0]._id,
        }));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to retrieve platform roles."));
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      toast.error("Last name is required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    if (!form.roleId) {
      toast.error("Platform role is required.");
      return;
    }

    if (!form.password) {
      toast.error("Password is required.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const createdAdmin = await platformAdminService.createPlatformAdmin({
        firstName: form.firstName.trim(),

        middleName: form.middleName.trim() || undefined,

        lastName: form.lastName.trim(),

        displayName: form.displayName.trim() || undefined,

        email: form.email.trim().toLowerCase(),

        mobile: form.mobile.trim() || undefined,

        password: form.password,

        roleId: form.roleId,

        status: form.status,

        emailVerified: true,
        mobileVerified: Boolean(form.mobile.trim()),
      });

      toast.success("Platform administrator created successfully.");

      router.push(`/platform/admins/${createdAdmin._id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/platform/admins"
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Platform Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Add platform administrator
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create a user and grant GLOBAL platform administration access.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          icon={UserRound}
          title="Administrator information"
          description="Enter the administrator's personal and account information."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="First name" required>
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                placeholder="Enter first name"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Middle name">
              <input
                value={form.middleName}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
                placeholder="Enter middle name"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Last name" required>
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                placeholder="Enter last name"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Display name">
              <input
                value={form.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                placeholder="Example: Rohit Sharma"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Email address" required>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="admin@example.com"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Mobile number">
              <input
                type="tel"
                value={form.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
                placeholder="Enter mobile number"
                className={inputClassName}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={ShieldCheck}
          title="Platform access"
          description="Assign GLOBAL platform access and account status."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Platform role" required>
              <select
                value={form.roleId}
                onChange={(event) => updateField("roleId", event.target.value)}
                disabled={isLoadingRoles}
                className={inputClassName}
              >
                <option value="">
                  {isLoadingRoles
                    ? "Loading platform roles..."
                    : "Select platform role"}
                </option>

                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name} ({role.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Access status" required>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as PlatformAdminStatus,
                  )
                }
                className={inputClassName}
              >
                <option value="ACTIVE">Active</option>

                <option value="INACTIVE">Inactive</option>

                <option value="SUSPENDED">Suspended</option>
              </select>
            </FormField>
          </div>

          {roles.length === 0 && !isLoadingRoles && (
            <p className="mt-4 text-sm font-medium text-red-600">
              No active GLOBAL platform roles are available.
            </p>
          )}
        </FormSection>

        <FormSection
          icon={KeyRound}
          title="Initial password"
          description="Create the administrator's initial login password."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="Enter password"
                  className={`${inputClassName} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm password" required>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  placeholder="Re-enter password"
                  className={`${inputClassName} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </FormField>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Password must contain at least 8 characters.
          </p>
        </FormSection>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/platform/admins"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingRoles || roles.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

            {isSubmitting ? "Creating..." : "Create administrator"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}
