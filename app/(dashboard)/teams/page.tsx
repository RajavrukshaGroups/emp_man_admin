"use client";

import axios from "axios";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Network,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { teamService } from "@/features/teams/services/team.service";
import type {
  Team,
  TeamDepartmentReference,
  TeamLeadReference,
  TeamListData,
  TeamStatus,
} from "@/features/teams/types/team.types";
import { useAuthStore } from "@/store/auth.store";
import { permission } from "process";

const PAGE_SIZE = 10;

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve teams.",
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

function isDepartmentReference(
  value: Team["departmentId"],
): value is TeamDepartmentReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getDepartmentName(team: Team) {
  if (!isDepartmentReference(team.departmentId)) {
    return "—";
  }

  return team.departmentId.name || "—";
}

function isTeamLeadReference(
  value: TeamLeadReference | string,
): value is TeamLeadReference {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getTeamLeadName(lead: TeamLeadReference | string) {
  if (!isTeamLeadReference(lead)) {
    return "—";
  }

  if (typeof lead.userId === "object" && lead.userId !== null) {
    return (
      lead.userId.displayName || lead.userId.email || lead.employeeCode || "—"
    );
  }

  return lead.employeeCode || lead.designation || "—";
}

function getTeamLeadNames(team: Team) {
  if (!Array.isArray(team.teamLeadIds) || team.teamLeadIds.length === 0) {
    return [];
  }

  return team.teamLeadIds
    .map((lead) => getTeamLeadName(lead as TeamLeadReference | string))
    .filter((name) => name !== "—");
}

const statusClassNames: Record<TeamStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",

  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function TeamsPage() {
  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canCreateTeam = permissions.includes("team.create");
  const canUpdateTeam = permissions.includes("team.update");
  const [result, setResult] = useState<TeamListData>({
    teams: [],

    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<TeamStatus | "">("");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      setErrorMessage("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const teamResult = await teamService.getTeams(company._id, {
        page,
        limit: PAGE_SIZE,

        search: search || undefined,

        status: status || undefined,

        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setResult(teamResult);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, page, search, status]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: TeamStatus | "") {
    setPage(1);
    setStatus(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Teams
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage teams, departments, team leads and employee assignments.
          </p>
        </div>

        {canCreateTeam && (
          <Link
            href="/teams/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add team
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={UsersRound}
          label="Total teams"
          value={result.pagination.total}
        />

        <SummaryCard
          icon={Network}
          label="Displayed teams"
          value={result.teams.length}
        />

        <SummaryCard
          icon={UsersRound}
          label="Current page"
          value={
            result.pagination.totalPages > 0
              ? `${result.pagination.page} of ${result.pagination.totalPages}`
              : "0"
          }
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search team name, code or description"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as TeamStatus | "")
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All statuses</option>

              <option value="ACTIVE">Active</option>

              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => void loadTeams()}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <TeamsTableSkeleton />
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load teams
            </h2>

            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadTeams()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : result.teams.length === 0 ? (
          <TeamEmptyState
            hasFilters={Boolean(search || status)}
            canCreateTeam={canCreateTeam}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <TableHeading>Team</TableHeading>

                    <TableHeading>Code</TableHeading>

                    <TableHeading>Department</TableHeading>

                    <TableHeading>Team leads</TableHeading>

                    <TableHeading>Status</TableHeading>

                    <TableHeading align="right">Actions</TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {result.teams.map((team) => {
                    const teamLeads = getTeamLeadNames(team);

                    return (
                      <tr
                        key={team._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <TableCell>
                          <div>
                            <Link
                              href={`/teams/${team._id}`}
                              className="font-semibold text-slate-950 hover:text-blue-600"
                            >
                              {team.name}
                            </Link>

                            <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {team.description || "No description"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium text-slate-700">
                            {team.code}
                          </span>
                        </TableCell>

                        <TableCell>{getDepartmentName(team)}</TableCell>

                        <TableCell>
                          {teamLeads.length > 0 ? (
                            <div className="flex max-w-xs flex-wrap gap-1.5">
                              {teamLeads.slice(0, 2).map((name, index) => (
                                <span
                                  key={`${name}-${index}`}
                                  className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                >
                                  {name}
                                </span>
                              ))}

                              {teamLeads.length > 2 && (
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  +{teamLeads.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              statusClassNames[team.status]
                            }`}
                          >
                            {team.status}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/teams/${team._id}`}
                              title="View team"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {canUpdateTeam && (
                              <Link
                                href={`/teams/${team._id}/edit`}
                                title="Edit team"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {result.teams.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {result.pagination.total}
                </span>{" "}
                teams
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!result.pagination.hasPreviousPage || isLoading}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="px-2 text-sm font-medium text-slate-600">
                  Page {result.pagination.page} of{" "}
                  {result.pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={!result.pagination.hasNextPage || isLoading}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TableHeadingProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableHeading({ children, align = "left" }: TableHeadingProps) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableCell({ children, align = "left" }: TableCellProps) {
  return (
    <td
      className={`px-5 py-4 text-sm text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function TeamsTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function TeamEmptyState({
  hasFilters,
  canCreateTeam,
}: {
  hasFilters: boolean;
  canCreateTeam: boolean;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <UsersRound className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters ? "No matching teams" : "No teams available"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No team matches the selected search or status filter."
          : "Create the first team and assign it to an active department."}
      </p>

      {!hasFilters && canCreateTeam && (
        <Link
          href="/teams/create"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add team
        </Link>
      )}
    </div>
  );
}
