"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  RefreshCcw,
  Save,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { departmentService } from "@/features/departments/services/department.service";
import type { Department } from "@/features/departments/types/department.types";

import { teamService } from "@/features/teams/services/team.service";
import type {
  Team,
  UpdateTeamPayload,
} from "@/features/teams/types/team.types";

import { useAuthStore } from "@/store/auth.store";

interface EditTeamFormProps {
  teamId: string;
}

interface EditTeamFormValues {
  name: string;
  code: string;
  departmentId: string;
  description: string;
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
  fallbackMessage = "Unable to load team.",
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

function getDepartmentId(value: Team["departmentId"]) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    return value._id;
  }

  return "";
}

export function EditTeamForm({ teamId }: EditTeamFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const [team, setTeam] = useState<Team | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTeamFormValues>({
    defaultValues: {
      name: "",
      code: "",
      departmentId: "",
      description: "",
    },

    mode: "onBlur",
  });

  const loadTeamInformation = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      setLoadError("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const [teamData, departmentResult] = await Promise.all([
        teamService.getTeamById(company._id, teamId),

        departmentService.getDepartments(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "name",
          sortOrder: "asc",
        }),
      ]);

      setTeam(teamData);

      setDepartments(departmentResult.departments);

      reset({
        name: teamData.name ?? "",
        code: teamData.code ?? "",

        departmentId: getDepartmentId(teamData.departmentId),

        description: teamData.description ?? "",
      });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Unable to retrieve team information.",
      );

      setTeam(null);

      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, teamId, reset]);

  useEffect(() => {
    void loadTeamInformation();
  }, [loadTeamInformation]);

  const onSubmit: SubmitHandler<EditTeamFormValues> = async (values) => {
    if (!company?._id) {
      toast.error("Active company context is unavailable.");

      return;
    }

    if (!team?._id) {
      toast.error("Team information is unavailable.");

      return;
    }

    const payload: UpdateTeamPayload = {
      name: values.name.trim(),

      code: values.code.trim().replace(/\s+/g, "_").toUpperCase(),

      departmentId: values.departmentId,

      description: values.description.trim(),
    };

    try {
      await teamService.updateTeam(company._id, team._id, payload);

      toast.success("Team updated successfully.");

      router.push(`/teams/${team._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update team."));
    }
  };

  if (isLoading) {
    return <EditTeamSkeleton />;
  }

  if (loadError || !team) {
    return (
      <div className="space-y-6">
        <Link
          href={`/teams/${teamId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load team
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {loadError ?? "Team information is unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadTeamInformation()}
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
            href={`/teams/${team._id}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Edit team
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update the team name, code, department and description.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Editing team
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {team.name}
          </p>
        </div>
      </div>

      <Section
        icon={UsersRound}
        title="Team information"
        description="Update the team's basic information."
      >
        <Field label="Team name" required error={errors.name?.message}>
          <input
            type="text"
            disabled={isSubmitting}
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
          hint="The code is converted to uppercase when saved."
        >
          <input
            type="text"
            disabled={isSubmitting}
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
      </Section>

      <Section
        icon={Building2}
        title="Department assignment"
        description="Assign the team to an active department."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field
            label="Department"
            required
            error={errors.departmentId?.message}
          >
            <select
              disabled={isSubmitting}
              className={selectClassName}
              {...register("departmentId", {
                required: "Department is required.",
              })}
            >
              <option value="">Select department</option>

              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="sm:col-span-2 xl:col-span-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">
              Department changes may be restricted.
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              The backend prevents changing the department while employees or
              team leads are assigned to this team.
            </p>
          </div>
        </div>
      </Section>

      <Section
        icon={FileText}
        title="Description"
        description="Update the team's responsibilities and purpose."
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="Team description" error={errors.description?.message}>
            <textarea
              disabled={isSubmitting}
              className={textAreaClassName}
              placeholder="Describe the responsibilities of this team..."
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
            Team status: <span className="font-semibold">{team.status}</span>
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Team leads, members and status are managed separately.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/teams/${team._id}`}
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
                Saving team...
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

function EditTeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-slate-200" />

      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="h-60 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}
