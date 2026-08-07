"use client";

import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  RefreshCcw,
  UserMinus,
  UserPlus,
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
} from "@/features/teams/types/team.types";

import { useAuthStore } from "@/store/auth.store";

interface ManageTeamMembersProps {
  teamId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to manage team members.",
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

function getTeamDepartmentId(team: Team) {
  if (typeof team.departmentId === "string") {
    return team.departmentId;
  }

  if (typeof team.departmentId === "object" && team.departmentId !== null) {
    return team.departmentId._id;
  }

  return "";
}

function getTeamDepartmentName(team: Team) {
  if (typeof team.departmentId === "object" && team.departmentId !== null) {
    return (team.departmentId as TeamDepartmentReference).name;
  }

  return "—";
}

function getCompanyAccessTeamId(access: CompanyAccess) {
  if (!access.teamId) {
    return null;
  }

  if (typeof access.teamId === "string") {
    return access.teamId;
  }

  return access.teamId._id;
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

function getEmployeeName(access: CompanyAccess) {
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

export function ManageTeamMembers({ teamId }: ManageTeamMembersProps) {
  const company = useAuthStore((state) => state.company);

  const [team, setTeam] = useState<Team | null>(null);

  const [companyAccessRecords, setCompanyAccessRecords] = useState<
    CompanyAccess[]
  >([]);

  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([]);

  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isAssigning, setIsAssigning] = useState(false);

  const [isRemoving, setIsRemoving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      setLoadError("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const [teamData, accessData] = await Promise.all([
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

      setCompanyAccessRecords(accessData.records);

      setSelectedAssignedIds([]);
      setSelectedAvailableIds([]);
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to load team members.");

      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, teamId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const assignedMembers = useMemo(() => {
    if (!team) {
      return [];
    }

    return companyAccessRecords.filter(
      (access) => getCompanyAccessTeamId(access) === team._id,
    );
  }, [companyAccessRecords, team]);

  const availableMembers = useMemo(() => {
    if (!team) {
      return [];
    }

    return companyAccessRecords.filter(
      (access) => getCompanyAccessTeamId(access) !== team._id,
    );
  }, [companyAccessRecords, team]);

  function toggleAssignedMember(accessId: string) {
    setSelectedAssignedIds((current) =>
      current.includes(accessId)
        ? current.filter((id) => id !== accessId)
        : [...current, accessId],
    );
  }

  function toggleAvailableMember(accessId: string) {
    setSelectedAvailableIds((current) =>
      current.includes(accessId)
        ? current.filter((id) => id !== accessId)
        : [...current, accessId],
    );
  }

  async function handleAssignMembers() {
    if (!company?._id || !team || selectedAvailableIds.length === 0) {
      return;
    }

    try {
      setIsAssigning(true);

      await teamService.assignTeamMembers(company._id, team._id, {
        memberIds: selectedAvailableIds,
      });

      toast.success(
        `${selectedAvailableIds.length} member${
          selectedAvailableIds.length === 1 ? "" : "s"
        } assigned successfully.`,
      );

      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to assign team members."));
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRemoveMembers() {
    if (!company?._id || !team || selectedAssignedIds.length === 0) {
      return;
    }

    try {
      setIsRemoving(true);

      await teamService.removeTeamMembers(company._id, team._id, {
        memberIds: selectedAssignedIds,
      });

      toast.success(
        `${selectedAssignedIds.length} member${
          selectedAssignedIds.length === 1 ? "" : "s"
        } removed successfully.`,
      );

      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to remove team members."));
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return <ManageTeamMembersSkeleton />;
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
            Unable to load team members
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

  const teamDepartmentId = getTeamDepartmentId(team);

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
              Manage team members
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assign employees to this team or remove existing members.
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
                Member assignments are stored in Company Access.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <InfoCard label="Team" value={team.name} />

          <InfoCard label="Department" value={getTeamDepartmentName(team)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UsersRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">Assigned members</h2>

              <p className="text-sm text-slate-500">
                Employees currently assigned to this team.
              </p>
            </div>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {assignedMembers.length} members
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {assignedMembers.length === 0 ? (
            <EmptyState
              title="No members assigned"
              description="This team currently has no assigned members."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {assignedMembers.map((access) => (
                <MemberCard
                  key={access._id}
                  access={access}
                  selected={selectedAssignedIds.includes(access._id)}
                  onClick={() => toggleAssignedMember(access._id)}
                  disabled={isRemoving || isAssigning}
                  mode="remove"
                />
              ))}
            </div>
          )}

          {assignedMembers.length > 0 && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void handleRemoveMembers()}
                disabled={
                  selectedAssignedIds.length === 0 || isRemoving || isAssigning
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Remove selected ({selectedAssignedIds.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Available employees
              </h2>

              <p className="text-sm text-slate-500">
                Select employees to assign to this team.
              </p>
            </div>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {selectedAvailableIds.length} selected
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {availableMembers.length === 0 ? (
            <EmptyState
              title="No available employees"
              description="Every active employee is currently assigned to this team."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableMembers.map((access) => (
                <div key={access._id} className="space-y-2">
                  <MemberCard
                    access={access}
                    selected={selectedAvailableIds.includes(access._id)}
                    onClick={() => toggleAvailableMember(access._id)}
                    disabled={isAssigning || isRemoving}
                    mode="assign"
                  />

                  {getCompanyAccessDepartmentId(access) !==
                    teamDepartmentId && (
                    <p className="px-2 text-xs text-amber-600">
                      Assigning this employee will move them to{" "}
                      {getTeamDepartmentName(team)}.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {availableMembers.length > 0 && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void handleAssignMembers()}
                disabled={
                  selectedAvailableIds.length === 0 || isAssigning || isRemoving
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Assign selected ({selectedAvailableIds.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Important assignment behaviour
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-700">
          Assigning an employee to this team updates both their department and
          team in Company Access. Removing an employee clears only the team;
          their department remains unchanged.
        </p>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/teams/${team._id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team
        </Link>
      </div>
    </div>
  );
}

function MemberCard({
  access,
  selected,
  onClick,
  disabled,
  mode,
}: {
  access: CompanyAccess;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  mode: "assign" | "remove";
}) {
  const name = getEmployeeName(access);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? mode === "remove"
            ? "border-red-300 bg-red-50 ring-2 ring-red-500/10"
            : "border-blue-300 bg-blue-50 ring-2 ring-blue-500/10"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
      }`}
    >
      {selected && (
        <div
          className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white ${
            mode === "remove" ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="flex items-start gap-3 pr-8">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            selected
              ? mode === "remove"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {name}
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <UsersRound className="mx-auto h-6 w-6 text-slate-400" />

      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ManageTeamMembersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-80 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
