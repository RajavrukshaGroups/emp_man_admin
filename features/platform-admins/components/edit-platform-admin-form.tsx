"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { platformAdminService } from "../services/platform-admin.service";

import type {
  PlatformAdminStatus,
  PlatformRole,
} from "../types/platform-admin.types";

interface EditPlatformAdminFormProps {
  platformAccessId: string;
}

interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  email: string;
  mobile: string;
  roleId: string;
}

const initialFormState: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  email: "",
  mobile: "",
  roleId: "",
};

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to update platform administrator.",
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

export function EditPlatformAdminForm({
  platformAccessId,
}: EditPlatformAdminFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialFormState);

  const [roles, setRoles] = useState<PlatformRole[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [admin, roleResult] = await Promise.all([
        platformAdminService.getPlatformAdminById(platformAccessId),

        platformAdminService.getPlatformRoles(),
      ]);

      setRoles(roleResult.roles ?? []);

      setForm({
        firstName: admin.userId.firstName ?? "",

        middleName: admin.userId.middleName ?? "",

        lastName: admin.userId.lastName ?? "",

        displayName: admin.userId.displayName ?? "",

        email: admin.userId.email ?? "",

        mobile: admin.userId.mobile ?? "",

        roleId: admin.roleId._id,
      });
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to load platform administrator."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [platformAccessId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
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

    try {
      setIsSubmitting(true);

      await platformAdminService.updatePlatformAdmin(platformAccessId, {
        firstName: form.firstName.trim(),

        middleName: form.middleName.trim(),

        lastName: form.lastName.trim(),

        displayName: form.displayName.trim(),

        email: form.email.trim().toLowerCase(),

        mobile: form.mobile.trim(),

        roleId: form.roleId,
      });

      toast.success("Platform administrator updated successfully.");

      router.push(`/platform/admins/${platformAccessId}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href={`/platform/admins/${platformAccessId}`}
          className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Platform Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Edit platform administrator
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update administrator identity and GLOBAL platform access.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          icon={UserRound}
          title="Administrator information"
          description="Update personal and account information."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="First name" required>
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Middle name">
              <input
                value={form.middleName}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Last name" required>
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Display name">
              <input
                value={form.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Email address" required>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClassName}
              />
            </FormField>

            <FormField label="Mobile number">
              <input
                value={form.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
                className={inputClassName}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={ShieldCheck}
          title="Platform access"
          description="Assign an active GLOBAL role."
        >
          <div className="max-w-xl">
            <FormField label="Platform role" required>
              <select
                value={form.roleId}
                onChange={(event) => updateField("roleId", event.target.value)}
                className={inputClassName}
              >
                <option value="">Select platform role</option>

                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name} ({role.code})
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link
            href={`/platform/admins/${platformAccessId}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

            {isSubmitting ? "Updating..." : "Update administrator"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
