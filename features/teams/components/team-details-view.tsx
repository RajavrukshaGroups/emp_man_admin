"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  Network,
  Power,
  RefreshCcw,
  Trash2,
  UserRoundCog,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { teamService } from "@/features/teams/services/team.service";
import type {
  Team,
  TeamAuditUser,
  TeamDepartmentReference,
  TeamLeadReference,
} from "@/features/teams/types/team.types";
import { useAuthStore } from "@/store/auth.store";

interface TeamDetailsViewProps {
  teamId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve team details.",
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

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isObjectReference<T extends { _id: string }>(
  value: T | string | null | undefined,
): value is T {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getDepartment(
  value: Team["departmentId"],
): TeamDepartmentReference | null {
  return isObjectReference<TeamDepartmentReference>(value) ? value : null;
}

function getTeamLeads(team: Team): TeamLeadReference[] {
  if (!Array.isArray(team.teamLeadIds)) {
    return [];
  }

  return team.teamLeadIds.filter(
    (lead): lead is TeamLeadReference =>
      typeof lead === "object" && lead !== null && "_id" in lead,
  );
}

function getTeamLeadName(lead: TeamLeadReference) {
  if (typeof lead.userId === "object" && lead.userId !== null) {
    return (
      lead.userId.displayName || lead.userId.email || lead.employeeCode || "—"
    );
  }

  return lead.employeeCode || lead.designation || "—";
}

function getAuditUserName(value?: TeamAuditUser | string | null) {
  if (!isObjectReference<TeamAuditUser>(value)) {
    return "—";
  }

  return (
    value.displayName ||
    [value.firstName, value.lastName].filter(Boolean).join(" ") ||
    value.email ||
    "—"
  );
}

const statusClassNames = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
};

export function TeamDetailsView({ teamId }: TeamDetailsViewProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canUpdateTeam = permissions.includes("team.update");
  const canAssignTeamLead = permissions.includes("team.assign_lead");
  const canAssignTeamMember = permissions.includes("team.assign_member");
  const canDeleteTeam = permissions.includes("team.delete");

  const [team, setTeam] = useState<Team | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      setErrorMessage("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await teamService.getTeamById(company._id, teamId);

      setTeam(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setTeam(null);
      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, teamId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  async function handleStatusChange() {
    if (!company?._id || !team) {
      return;
    }

    const nextStatus = team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setIsUpdatingStatus(true);

      const updatedTeam = await teamService.updateTeamStatus(
        company._id,
        team._id,
        nextStatus,
      );

      setTeam(updatedTeam);

      toast.success(
        nextStatus === "ACTIVE"
          ? "Team activated successfully."
          : "Team inactivated successfully.",
      );

      setShowStatusConfirmation(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update team status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteTeam() {
    if (!company?._id || !team) {
      return;
    }

    try {
      setIsDeleting(true);

      await teamService.deleteTeam(company._id, team._id);

      toast.success("Team deleted successfully.");

      router.push("/teams");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete team."));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <TeamDetailsSkeleton />;
  }

  if (errorMessage || !team) {
    return (
      <div className="space-y-6">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load team
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage ?? "Team details are unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadTeam()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const department = getDepartment(team.departmentId);

  const teamLeads = getTeamLeads(team);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to teams
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Team details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View team structure, leadership and employee assignments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadTeam()}
            disabled={isUpdatingStatus || isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          {canUpdateTeam && (
            <Link
              href={`/teams/${team._id}/edit`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit team
            </Link>
          )}
          {canAssignTeamLead && (
            <Link
              href={`/teams/${team._id}/leads`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <UserRoundCheck className="h-4 w-4" />
              Manage leads
            </Link>
          )}

          {canAssignTeamMember && (
            <Link
              href={`/teams/${team._id}/members`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              <UsersRound className="h-4 w-4" />
              Manage members
            </Link>
          )}

          {canUpdateTeam && (
            <button
              type="button"
              onClick={() => setShowStatusConfirmation(true)}
              disabled={isUpdatingStatus || isDeleting}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                team.status === "ACTIVE"
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Power className="h-4 w-4" />
              {team.status === "ACTIVE" ? "Inactivate" : "Activate"}
            </button>
          )}

          {canDeleteTeam && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeleting || isUpdatingStatus}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <UsersRound className="h-9 w-9" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{team.name}</h2>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusClassNames[team.status]
                  }`}
                >
                  {team.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Team code: {team.code}
              </p>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {team.description || "No team description available."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          <SummaryItem label="Department" value={department?.name || "—"} />

          <SummaryItem
            label="Team leads"
            value={team.statistics?.teamLeadCount ?? teamLeads.length}
          />

          <SummaryItem
            label="Assigned members"
            value={team.statistics?.assignedMemberCount ?? 0}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailsSection
          icon={Network}
          title="Team structure"
          description="Department and team assignment information."
        >
          <DetailsGrid>
            <DetailItem label="Team name" value={team.name} />

            <DetailItem label="Team code" value={team.code} />

            <DetailItem label="Department" value={department?.name} />

            <DetailItem label="Department code" value={department?.code} />

            <DetailItem label="Team status" value={team.status} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UsersRound}
          title="Team statistics"
          description="Current team leadership and employee assignments."
        >
          <DetailsGrid>
            <DetailItem
              label="Team leads"
              value={team.statistics?.teamLeadCount ?? teamLeads.length}
            />

            <DetailItem
              label="Assigned members"
              value={team.statistics?.assignedMemberCount ?? 0}
            />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UserRoundCog}
          title="Team leads"
          description="Employees responsible for leading this team."
        >
          {teamLeads.length > 0 ? (
            <div className="space-y-3">
              {teamLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {getTeamLeadName(lead)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {lead.designation || "No designation"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <UserRoundCog className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Employee code"
                      value={lead.employeeCode}
                    />

                    <DetailItem
                      label="Employment type"
                      value={lead.employmentType}
                    />

                    <DetailItem label="Status" value={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyValue message="No team leads have been assigned." />
          )}
        </DetailsSection>

        <DetailsSection
          icon={Building2}
          title="Department information"
          description="Department owning this team."
        >
          {department ? (
            <DetailsGrid>
              <DetailItem label="Department" value={department.name} />

              <DetailItem label="Department code" value={department.code} />

              <DetailItem label="Department status" value={department.status} />

              <DetailItem
                label="Parent department"
                value={department.parentDepartmentId || "—"}
              />
            </DetailsGrid>
          ) : (
            <EmptyValue message="Department information is unavailable." />
          )}
        </DetailsSection>
      </div>

      <DetailsSection
        icon={CalendarDays}
        title="Record information"
        description="System-generated team audit details."
      >
        <DetailsGrid>
          <DetailItem label="Team ID" value={team._id} breakWords />

          <DetailItem label="Created at" value={formatDate(team.createdAt)} />

          <DetailItem label="Updated at" value={formatDate(team.updatedAt)} />

          <DetailItem
            label="Created by"
            value={getAuditUserName(team.createdBy)}
          />

          <DetailItem
            label="Updated by"
            value={getAuditUserName(team.updatedBy)}
          />
        </DetailsGrid>
      </DetailsSection>

      {canUpdateTeam && showStatusConfirmation && (
        <ConfirmationModal
          title={
            team.status === "ACTIVE" ? "Inactivate team?" : "Activate team?"
          }
          description={
            team.status === "ACTIVE"
              ? "The team will no longer be available for new assignments. Your backend may prevent this action while active employees are still assigned to the team."
              : "The team will become available again for employee assignments."
          }
          confirmLabel={
            team.status === "ACTIVE" ? "Inactivate team" : "Activate team"
          }
          variant={team.status === "ACTIVE" ? "warning" : "success"}
          isLoading={isUpdatingStatus}
          onCancel={() => setShowStatusConfirmation(false)}
          onConfirm={() => void handleStatusChange()}
        />
      )}

      {canDeleteTeam && showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete team?"
          description="This action soft-deletes the team. The backend will prevent deletion while active or onboarding employees are still assigned to this team."
          confirmLabel="Delete team"
          variant="danger"
          isLoading={isDeleting}
          onCancel={() => setShowDeleteConfirmation(false)}
          onConfirm={() => void handleDeleteTeam()}
        />
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailsSection({
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function DetailsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function DetailItem({
  label,
  value,
  breakWords = false,
}: {
  label: string;
  value?: string | number | null;
  breakWords?: boolean;
}) {
  const displayValue =
    value === undefined || value === null || value === "" ? "—" : String(value);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-medium text-slate-800 ${
          breakWords ? "break-all" : ""
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function EmptyValue({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function TeamDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-60 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel: string;

  variant: "danger" | "warning" | "success";

  isLoading: boolean;

  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  title,
  description,
  confirmLabel,
  variant,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmClassNames = {
    danger: "bg-red-600 hover:bg-red-700",

    warning: "bg-amber-600 hover:bg-amber-700",

    success: "bg-emerald-600 hover:bg-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmClassNames[variant]
            }`}
          >
            {isLoading && <RefreshCcw className="h-4 w-4 animate-spin" />}

            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
