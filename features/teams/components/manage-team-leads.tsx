"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  RefreshCcw,
  Save,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import { teamService } from "@/features/teams/services/team.service";
import type {
  Team,
  TeamDepartmentReference,
  TeamLeadReference,
} from "@/features/teams/types/team.types";

import { useAuthStore } from "@/store/auth.store";

interface ManageTeamLeadsProps {
  teamId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to manage team leads.",
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

function getDepartmentId(team: Team) {
  if (typeof team.departmentId === "string") {
    return team.departmentId;
  }

  if (typeof team.departmentId === "object" && team.departmentId !== null) {
    return team.departmentId._id;
  }

  return "";
}

function getDepartmentName(team: Team) {
  if (typeof team.departmentId === "object" && team.departmentId !== null) {
    const department = team.departmentId as TeamDepartmentReference;

    return department.name;
  }

  return "—";
}

function getExistingTeamLeadIds(team: Team) {
  if (!Array.isArray(team.teamLeadIds)) {
    return [];
  }

  return team.teamLeadIds
    .map((lead) => {
      if (typeof lead === "string") {
        return lead;
      }

      return (lead as TeamLeadReference)._id;
    })
    .filter(Boolean);
}

function getCompanyAccessDepartmentId(access: CompanyAccess) {
  if (!access.departmentId) {
    return null;
  }

  if (typeof access.departmentId === "string") {
    return access.departmentId;
  }

  return access.departmentId._id;
}

function getAccessUserName(access: CompanyAccess) {
  if (typeof access.userId === "object" && access.userId !== null) {
    return (
      access.userId.displayName ||
      access.userId.email ||
      access.employeeCode ||
      "Unnamed employee"
    );
  }

  return access.employeeCode || access.designation || "Employee";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ManageTeamLeads({ teamId }: ManageTeamLeadsProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canAssignTeamLead = permissions.includes("team.assign_lead");

  const [team, setTeam] = useState<Team | null>(null);

  const [companyAccessRecords, setCompanyAccessRecords] = useState<
    CompanyAccess[]
  >([]);

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!canAssignTeamLead) {
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

      const [teamData, accessResult] = await Promise.all([
        teamService.getTeamById(company._id, teamId),

        companyAccessService.getCompanyAccessList(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "createdAt",
          sortOrder: "asc",
        }),
      ]);

      setTeam(teamData);

      setCompanyAccessRecords(accessResult.records);

      setSelectedLeadIds(getExistingTeamLeadIds(teamData));
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Unable to load team lead information.",
      );

      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [canAssignTeamLead, company?._id, teamId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const eligibleTeamLeads = useMemo(() => {
    if (!team) {
      return [];
    }

    const departmentId = getDepartmentId(team);

    return companyAccessRecords.filter((access) => {
      return (
        access.status === "ACTIVE" &&
        getCompanyAccessDepartmentId(access) === departmentId
      );
    });
  }, [companyAccessRecords, team]);

  function toggleLead(accessId: string) {
    setSelectedLeadIds((currentIds) => {
      if (currentIds.includes(accessId)) {
        return currentIds.filter((id) => id !== accessId);
      }

      return [...currentIds, accessId];
    });
  }

  async function handleSave() {
    if (!canAssignTeamLead) {
      toast.error("You do not have permission to manage team leads.");
      return;
    }

    if (!company?._id || !team) {
      return;
    }

    try {
      setIsSaving(true);

      await teamService.assignTeamLeads(company._id, team._id, {
        teamLeadIds: selectedLeadIds,
      });

      toast.success("Team leads updated successfully.");

      router.push(`/teams/${team._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update team leads."));
    } finally {
      setIsSaving(false);
    }
  }

  if (!canAssignTeamLead) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
        <h1 className="text-xl font-bold text-red-950">Access denied</h1>

        <p className="mt-2 text-sm text-red-700">
          You do not have permission to manage team leads.
        </p>

        <Link
          href={`/teams/${teamId}`}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to team
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <ManageTeamLeadsSkeleton />;
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
            Unable to load team leads
          </h1>

          <p className="mt-2 text-sm text-red-700">{loadError}</p>

          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              Manage team leads
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assign one or more employees from the same department as this
              team.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Team
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {team.name}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">Team assignment</h2>

              <p className="text-sm text-slate-500">
                Team leads must belong to this department.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <InfoCard label="Team" value={team.name} />

          <InfoCard label="Department" value={getDepartmentName(team)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Eligible employees
              </h2>

              <p className="text-sm text-slate-500">
                Select the employees who should lead this team.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {selectedLeadIds.length} selected
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {eligibleTeamLeads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                <UsersRound className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-950">
                No eligible employees
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no active company-access records assigned to this
                team's department.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {eligibleTeamLeads.map((access) => {
                const employeeName = getAccessUserName(access);

                const isSelected = selectedLeadIds.includes(access._id);

                return (
                  <button
                    key={access._id}
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggleLead(access._id)}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div className="flex items-start gap-3 pr-8">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getInitials(employeeName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {employeeName}
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

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Multiple team leads are supported.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Saving with no employee selected removes all team leads from
                  this team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            {selectedLeadIds.length} team lead
            {selectedLeadIds.length === 1 ? "" : "s"} selected.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Only active employees from the selected department are displayed.
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
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving leads...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save team leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ManageTeamLeadsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
