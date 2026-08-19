"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { departmentService } from "@/features/departments/services/department.service";
import { teamService } from "@/features/teams/services/team.service";
import { workCategoryService } from "@/features/work-categories/services/workCategory.service";

import type { Department } from "@/features/departments/types/department.types";
import type { Team } from "@/features/teams/types/team.types";

import type {
  CreateWorkCategoryRequest,
  UpdateWorkCategoryRequest,
  WorkCategory,
} from "@/features/work-categories/types/workCategory.types";

import { useAuthStore } from "@/store/auth.store";

interface WorkCategoryFormProps {
  mode: "create" | "edit";
  initialData?: WorkCategory | null;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to save work category."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save work category.";
}

function getReferenceId(
  value: WorkCategory["departmentId"] | WorkCategory["teamId"],
) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value._id;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

export function WorkCategoryForm({ mode, initialData }: WorkCategoryFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canCreate = permissions.includes("work_category.create");
  const canUpdate = permissions.includes("work_category.update");

  const canSubmit = mode === "create" ? canCreate : canUpdate;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [departmentId, setDepartmentId] = useState(
    initialData ? getReferenceId(initialData.departmentId) : "",
  );

  const [teamId, setTeamId] = useState(
    initialData ? getReferenceId(initialData.teamId) : "",
  );

  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [unitLabel, setUnitLabel] = useState(initialData?.unitLabel ?? "item");
  const [workloadWeight, setWorkloadWeight] = useState(
    initialData?.workloadWeight ?? 1,
  );

  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(
    mode === "edit",
  );

  const loadDepartments = useCallback(async () => {
    if (!company?._id) {
      setIsLoadingDepartments(false);
      return;
    }

    try {
      setIsLoadingDepartments(true);

      const result = await departmentService.getDepartments(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "name",
        sortOrder: "asc",
      });

      setDepartments(result.departments);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [company?._id]);

  const loadTeams = useCallback(async () => {
    if (!company?._id || !departmentId) {
      setTeams([]);
      return;
    }

    try {
      setIsLoadingTeams(true);

      const result = await teamService.getTeams(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        departmentId,
        sortBy: "name",
        sortOrder: "asc",
      });

      setTeams(result.teams);
    } catch (error: unknown) {
      setTeams([]);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingTeams(false);
    }
  }, [company?._id, departmentId]);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (!departmentId) {
      setTeams([]);
      setTeamId("");
      return;
    }

    void loadTeams();
  }, [departmentId, loadTeams]);

  useEffect(() => {
    if (mode === "create" && !isCodeManuallyEdited) {
      setCode(normalizeCode(name));
    }
  }, [name, mode, isCodeManuallyEdited]);

  const selectedDepartment = useMemo(() => {
    return departments.find((department) => department._id === departmentId);
  }, [departments, departmentId]);

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team._id === teamId);
  }, [teams, teamId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Active company context is unavailable.");
      return;
    }

    if (!canSubmit) {
      toast.error("You do not have permission to save work categories.");
      return;
    }

    if (!departmentId) {
      toast.error("Please select a department.");
      return;
    }

    if (!teamId) {
      toast.error("Please select a team.");
      return;
    }

    if (!name.trim()) {
      toast.error("Work category name is required.");
      return;
    }

    if (!code.trim()) {
      toast.error("Work category code is required.");
      return;
    }

    if (!unitLabel.trim()) {
      toast.error("Unit label is required.");
      return;
    }

    if (
      Number.isNaN(workloadWeight) ||
      workloadWeight < 0.1 ||
      workloadWeight > 100
    ) {
      toast.error("Workload weight must be between 0.1 and 100.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const payload: CreateWorkCategoryRequest = {
          departmentId,
          teamId,
          name: name.trim(),
          code: normalizeCode(code),
          description: description.trim(),
          unitLabel: unitLabel.trim().toLowerCase(),
          workloadWeight,
        };

        await workCategoryService.createWorkCategory(company._id, payload);

        toast.success("Work category created successfully.");
      } else {
        if (!initialData?._id) {
          toast.error("Work category context is unavailable.");
          return;
        }

        const payload: UpdateWorkCategoryRequest = {
          departmentId,
          teamId,
          name: name.trim(),
          code: normalizeCode(code),
          description: description.trim(),
          unitLabel: unitLabel.trim().toLowerCase(),
          workloadWeight,
        };

        await workCategoryService.updateWorkCategory(
          company._id,
          initialData._id,
          payload,
        );

        toast.success("Work category updated successfully.");
      }

      router.push("/work-categories");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canSubmit) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Tags className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission denied
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to {mode} work categories.
        </p>

        <Link
          href="/work-categories"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to work categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/work-categories"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to work categories
        </Link>

        <p className="text-sm font-semibold text-blue-600">Work management</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {mode === "create" ? "Create work category" : "Edit work category"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure a work type for a specific department and team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Tags className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">Category details</h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the organizational scope and define the work category.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="departmentId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Department
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="departmentId"
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setTeamId("");
                }}
                disabled={isLoadingDepartments}
                required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {isLoadingDepartments
                    ? "Loading departments..."
                    : "Select department"}
                </option>

                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                    {department.code ? ` (${department.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="teamId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Team
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="teamId"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                disabled={!departmentId || isLoadingTeams}
                required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {!departmentId
                    ? "Select department first"
                    : isLoadingTeams
                      ? "Loading teams..."
                      : teams.length === 0
                        ? "No active teams"
                        : "Select team"}
                </option>

                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                    {team.code ? ` (${team.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Category name
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Creative"
                maxLength={100}
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Code
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                id="code"
                type="text"
                value={code}
                onChange={(event) => {
                  setIsCodeManuallyEdited(true);
                  setCode(normalizeCode(event.target.value));
                }}
                placeholder="CREATIVE"
                maxLength={40}
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Used as a stable identifier for reporting and APIs.
              </p>
            </div>

            <div>
              <label
                htmlFor="unitLabel"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Unit label
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                id="unitLabel"
                type="text"
                value={unitLabel}
                onChange={(event) => setUnitLabel(event.target.value)}
                placeholder="creative"
                maxLength={50}
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Example: creative, reel, page, issue, lead.
              </p>
            </div>

            <div>
              <label
                htmlFor="workloadWeight"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Workload weight
              </label>

              <input
                id="workloadWeight"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={workloadWeight}
                onChange={(event) =>
                  setWorkloadWeight(Number(event.target.value))
                }
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Used for workload analysis, not as a direct performance score.
              </p>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the type of work covered by this category..."
                rows={5}
                maxLength={1000}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-1.5 flex justify-end">
                <span className="text-xs text-slate-400">
                  {description.length}/1000
                </span>
              </div>
            </div>
          </div>

          {selectedDepartment && selectedTeam && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Category scope
              </p>

              <p className="mt-2 text-sm text-slate-700">
                <strong>{selectedDepartment.name}</strong>
                {" → "}
                <strong>{selectedTeam.name}</strong>
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/work-categories"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingDepartments ||
              isLoadingTeams ||
              !departmentId ||
              !teamId ||
              !name.trim() ||
              !code.trim() ||
              !unitLabel.trim()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === "create" ? "Create category" : "Save changes"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
