"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { usePermissions } from "../hooks/use-permissions";
import { roleService } from "../services/role.service";
import {
  createRoleSchema,
  type CreateRoleFormValues,
} from "../validations/role.validation";
import { RolePermissionSelector } from "./role-permission-selector";
import type { Role } from "../types/role.types";
interface RoleFormProps {
  companyId: string;
  role?: Role;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const responseError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return (
      responseError.response?.data?.message ?? "Unable to create the role."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create the role.";
}

export function RoleForm({ companyId, role }: RoleFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(role);

  const defaultValues: CreateRoleFormValues = {
    name: role?.name ?? "",
    code: role?.code ?? "",
    description: role?.description ?? "",
    scopeType: "COMPANY",
    permissionIds:
      role?.permissionIds.map((permission) =>
        typeof permission === "string" ? permission : permission._id,
      ) ?? [],
    status: role?.status ?? "ACTIVE",
  };

  const {
    permissions,
    isLoading: isPermissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions,
  } = usePermissions();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues,
    mode: "onBlur",
  });
  const handleRoleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const roleName = event.target.value;

    setValue("name", roleName, {
      shouldDirty: true,
      shouldValidate: false,
    });

    const generatedCode = roleName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    setValue("code", generatedCode, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const onSubmit: SubmitHandler<CreateRoleFormValues> = async (values) => {
    if (!companyId) {
      toast.error("No active company was found.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (role) {
        await roleService.updateRole(companyId, role._id, {
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          description: values.description?.trim() || undefined,
          permissionIds: values.permissionIds,
          status: values.status,
        });

        toast.success("Role updated successfully.");
      } else {
        await roleService.createRole(companyId, {
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          description: values.description?.trim() || undefined,
          permissionIds: values.permissionIds,
          scopeType: "COMPANY",
          status: values.status,
        });

        toast.success("Role created successfully.");
      }

      router.push("/roles");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create role:", error);

      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/roles"
            aria-label="Back to roles"
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-slate-700" />

              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {isEditMode ? "Edit Role" : "Create Role"}
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Update role information and assigned permissions."
                : "Create a company role and assign the required permissions."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isPermissionsLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? "Update Role" : "Create Role"}
              </>
            )}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Role information</h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the role name, unique code and current status.
          </p>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="role-name"
              className="text-sm font-medium text-slate-700"
            >
              Role name <span className="text-red-600">*</span>
            </label>

            <input
              id="role-name"
              type="text"
              placeholder="Example: Human Resource Manager"
              disabled={isSubmitting}
              {...register("name")}
              onChange={handleRoleNameChange}
              className={[
                "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition",
                "placeholder:text-slate-400",
                "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300",
              ].join(" ")}
            />

            {errors.name ? (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="role-code"
              className="text-sm font-medium text-slate-700"
            >
              Role code <span className="text-red-600">*</span>
            </label>

            <input
              id="role-code"
              type="text"
              placeholder="Example: HR_MANAGER"
              disabled={isSubmitting}
              {...register("code", {
                onChange: (event) => {
                  event.target.value = event.target.value
                    .toUpperCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^A-Z0-9_]/g, "");
                },
              })}
              className={[
                "h-10 w-full rounded-lg border bg-white px-3 font-mono text-sm uppercase text-slate-950 outline-none transition",
                "placeholder:text-slate-400",
                "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                errors.code
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300",
              ].join(" ")}
            />

            {errors.code ? (
              <p className="text-sm text-red-600">{errors.code.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Generated from the role name. You may edit it.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="role-status"
              className="text-sm font-medium text-slate-700"
            >
              Status <span className="text-red-600">*</span>
            </label>

            <select
              id="role-status"
              disabled={isSubmitting}
              {...register("status")}
              className={[
                "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition",
                "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                errors.status ? "border-red-500" : "border-slate-300",
              ].join(" ")}
            >
              <option value="ACTIVE">Active</option>

              <option value="INACTIVE">Inactive</option>
            </select>

            {errors.status ? (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="role-scope"
              className="text-sm font-medium text-slate-700"
            >
              Scope
            </label>

            <input
              id="role-scope"
              type="text"
              value="Company"
              disabled
              className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
            />

            <input type="hidden" {...register("scopeType")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="role-description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="role-description"
              rows={4}
              placeholder="Describe the responsibilities and purpose of this role."
              disabled={isSubmitting}
              {...register("description")}
              className={[
                "w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-950 outline-none transition",
                "placeholder:text-slate-400",
                "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                errors.description
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300",
              ].join(" ")}
            />

            {errors.description ? (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Optional. Maximum 500 characters.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Controller
          name="permissionIds"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-3">
              <RolePermissionSelector
                permissions={permissions}
                value={field.value}
                onChange={field.onChange}
                isLoading={isPermissionsLoading}
                error={permissionsError}
                disabled={isSubmitting}
              />

              {fieldState.error ? (
                <p className="text-sm text-red-600">
                  {fieldState.error.message}
                </p>
              ) : null}

              {permissionsError ? (
                <button
                  type="button"
                  onClick={() => void refetchPermissions()}
                  disabled={isSubmitting}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retry loading permissions
                </button>
              ) : null}
            </div>
          )}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {isDirty
            ? "You have unsaved changes."
            : "Complete the role information and select permissions."}
        </p>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/roles"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isPermissionsLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? "Update Role" : "Create Role"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
