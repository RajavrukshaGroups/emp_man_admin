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
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import { departmentService } from "@/features/departments/services/department.service";
import type { Department } from "@/features/departments/types/department.types";

import { teamService } from "@/features/teams/services/team.service";
import type {
  CreateTeamPayload,
  TeamStatus,
} from "@/features/teams/types/team.types";

import { useAuthStore } from "@/store/auth.store";

interface CreateTeamFormValues {
  departmentId: string;

  name: string;
  code: string;

  description: string;

  teamLeadIds: string[];

  status: TeamStatus;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName = inputClassName;

const textAreaClassName =
  "min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to create team.",
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

function getCompanyAccessDisplayName(companyAccess: CompanyAccess) {
  const user =
    typeof companyAccess.userId === "object" && companyAccess.userId !== null
      ? companyAccess.userId
      : null;

  const displayName = user?.displayName || user?.email || "Unnamed employee";

  const designation = companyAccess.designation || "No designation";

  const employeeCode = companyAccess.employeeCode || "No employee code";

  return `${displayName} — ${designation} (${employeeCode})`;
}

function getCompanyAccessDepartmentId(companyAccess: CompanyAccess) {
  const department = companyAccess.departmentId;

  if (!department) {
    return null;
  }

  if (typeof department === "string") {
    return department;
  }

  return department._id;
}

export function CreateTeamForm() {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canCreateTeam = permissions.includes("team.create");

  const [departments, setDepartments] = useState<Department[]>([]);

  const [companyAccessRecords, setCompanyAccessRecords] = useState<
    CompanyAccess[]
  >([]);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamFormValues>({
    defaultValues: {
      departmentId: "",

      name: "",
      code: "",

      description: "",

      teamLeadIds: [],

      status: "ACTIVE",
    },

    mode: "onBlur",
  });

  const selectedDepartmentId = watch("departmentId");

  const selectedTeamLeadIds = watch("teamLeadIds") ?? [];

  const eligibleTeamLeads = useMemo(() => {
    if (!selectedDepartmentId) {
      return [];
    }

    return companyAccessRecords.filter((access) => {
      const departmentId = getCompanyAccessDepartmentId(access);

      return (
        access.status === "ACTIVE" && departmentId === selectedDepartmentId
      );
    });
  }, [companyAccessRecords, selectedDepartmentId]);

  const loadOptions = useCallback(async () => {
    if (!canCreateTeam) {
      setIsLoadingOptions(false);
      return;
    }

    if (!company?._id) {
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

      setDepartments(departmentResult.departments);

      setCompanyAccessRecords(companyAccessResult.records);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to load team creation options."),
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }, [canCreateTeam, company?._id]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    /*
     * Team leads must belong to the same
     * department as the team.
     *
     * When the department changes, remove
     * any selected leads that no longer belong
     * to the newly selected department.
     */
    if (!selectedDepartmentId) {
      setValue("teamLeadIds", []);
      return;
    }

    const validLeadIds = selectedTeamLeadIds.filter((leadId) =>
      eligibleTeamLeads.some((access) => access._id === leadId),
    );

    if (validLeadIds.length !== selectedTeamLeadIds.length) {
      setValue("teamLeadIds", validLeadIds);
    }
  }, [selectedDepartmentId, eligibleTeamLeads, selectedTeamLeadIds, setValue]);

  function handleTeamLeadToggle(accessId: string) {
    const currentIds = selectedTeamLeadIds ?? [];

    if (currentIds.includes(accessId)) {
      setValue(
        "teamLeadIds",
        currentIds.filter((id) => id !== accessId),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      return;
    }

    setValue("teamLeadIds", [...currentIds, accessId], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const onSubmit: SubmitHandler<CreateTeamFormValues> = async (values) => {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    const payload: CreateTeamPayload = {
      departmentId: values.departmentId,

      name: values.name.trim(),

      code: values.code.trim().replace(/\s+/g, "_").toUpperCase(),

      description: values.description.trim(),

      teamLeadIds: values.teamLeadIds,

      status: values.status,
    };

    try {
      const createdTeam = await teamService.createTeam(company._id, payload);

      toast.success("Team created successfully.");

      router.push(`/teams/${createdTeam._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create team."));
    }
  };

  if (!canCreateTeam) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
        <h1 className="text-xl font-bold text-red-950">Access denied</h1>

        <p className="mt-2 text-sm text-red-700">
          You do not have permission to create teams.
        </p>

        <Link
          href="/teams"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to teams
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/teams"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Create team
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a new team, assign it to a department and optionally choose
              multiple team leads.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            New team
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {company?.name || "Active company"}
          </p>
        </div>
      </div>

      <Section
        icon={UsersRound}
        title="Team information"
        description="Enter the team name and unique code."
      >
        <Field label="Team name" required error={errors.name?.message}>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="MERN Product Development Team"
            className={inputClassName}
            {...register("name", {
              required: "Team name is required.",

              minLength: {
                value: 2,
                message: "Team name must contain at least 2 characters.",
              },

              maxLength: {
                value: 100,
                message: "Team name cannot exceed 100 characters.",
              },
            })}
          />
        </Field>

        <Field
          label="Team code"
          required
          error={errors.code?.message}
          hint="The code will be converted to uppercase automatically."
        >
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="MERN_PRODUCT"
            className={inputClassName}
            {...register("code", {
              required: "Team code is required.",

              minLength: {
                value: 2,
                message: "Team code must contain at least 2 characters.",
              },

              maxLength: {
                value: 20,
                message: "Team code cannot exceed 20 characters.",
              },
            })}
          />
        </Field>

        <Field label="Status" required error={errors.status?.message}>
          <select
            disabled={isSubmitting}
            className={selectClassName}
            {...register("status", {
              required: "Team status is required.",
            })}
          >
            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </Section>

      <Section
        icon={Building2}
        title="Department assignment"
        description="Every team must belong to an active department."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field
            label="Department"
            required
            error={errors.departmentId?.message}
          >
            <select
              disabled={isSubmitting || isLoadingOptions}
              className={selectClassName}
              {...register("departmentId", {
                required: "Department is required.",
              })}
            >
              <option value="">
                {isLoadingOptions
                  ? "Loading departments..."
                  : "Select department"}
              </option>

              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section
        icon={UserRoundCheck}
        title="Team leads"
        description="Select one or more employees to lead this team."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          {!selectedDepartmentId ? (
            <EmptyState
              icon={Building2}
              title="Select a department first"
              description="Team leads are filtered by the department selected above."
            />
          ) : isLoadingOptions ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : eligibleTeamLeads.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No eligible team leads"
              description="There are no active company-access employees assigned to this department."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {eligibleTeamLeads.map((access) => {
                const isSelected = selectedTeamLeadIds.includes(access._id);

                return (
                  <button
                    key={access._id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTeamLeadToggle(access._id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {typeof access.userId === "object" &&
                        access.userId !== null
                          ? (access.userId.displayName || "NA")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")
                          : "NA"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {typeof access.userId === "object" &&
                          access.userId !== null
                            ? access.userId.displayName || access.userId.email
                            : access.employeeCode || "Employee"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {access.designation || "No designation"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-blue-600">
                          {access.employeeCode || "No employee code"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedDepartmentId && eligibleTeamLeads.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {selectedTeamLeadIds.length} team lead
              {selectedTeamLeadIds.length === 1 ? "" : "s"} selected.
            </p>
          )}
        </div>
      </Section>

      <Section
        icon={FileText}
        title="Team description"
        description="Describe the team's responsibilities and purpose."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="Description" error={errors.description?.message}>
            <textarea
              disabled={isSubmitting}
              placeholder="Responsible for product development, client projects and internal applications."
              className={textAreaClassName}
              {...register("description", {
                maxLength: {
                  value: 1000,

                  message: "Team description cannot exceed 1,000 characters.",
                },
              })}
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            Team leads are optional.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            The backend verifies that every selected team lead belongs to the
            same department.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href="/teams"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating team...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create team
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
