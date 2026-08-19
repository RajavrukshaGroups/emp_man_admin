"use client";

import axios from "axios";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { clientService } from "@/features/clients/services/client.service";

import type {
  Client,
  ClientEngagementType,
  ClientStatus,
  ClientType,
} from "@/features/clients/types/client.types";

import { useAuthStore } from "@/store/auth.store";

/**
 * ============================================================
 * ERROR MESSAGE
 * ============================================================
 */

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to process clients."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process clients.";
}

/**
 * ============================================================
 * DISPLAY HELPERS
 * ============================================================
 */

function getClientTypeLabel(clientType: ClientType) {
  switch (clientType) {
    case "IN_HOUSE":
      return "In-house";

    case "EXTERNAL":
      return "External";

    default:
      return clientType;
  }
}

function getEngagementLabel(engagementType: ClientEngagementType) {
  switch (engagementType) {
    case "RETAINER":
      return "Retainer";

    case "PROJECT":
      return "Project";

    case "ONE_TIME":
      return "One-time";

    case "ONGOING":
      return "Ongoing";

    case "OTHER":
      return "Other";

    default:
      return engagementType;
  }
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function ClientsPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  /**
   * ==========================================================
   * PERMISSIONS
   * ==========================================================
   */

  const canCreate = permissions.includes("client.create");
  const canUpdate = permissions.includes("client.update");
  const canDelete = permissions.includes("client.delete");

  /**
   * ==========================================================
   * DATA
   * ==========================================================
   */

  const [records, setRecords] = useState<Client[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * ==========================================================
   * FILTERS
   * ==========================================================
   */

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<"" | ClientStatus>("");

  const [clientType, setClientType] = useState<"" | ClientType>("");

  const [engagementType, setEngagementType] = useState<
    "" | ClientEngagementType
  >("");

  const [industry, setIndustry] = useState("");

  /**
   * ==========================================================
   * PAGINATION
   * ==========================================================
   */

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  /**
   * ==========================================================
   * LOAD CLIENTS
   * ==========================================================
   */

  const loadClients = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await clientService.getClients(company._id, {
        page,
        limit: 10,

        search: search || undefined,

        status: status || undefined,

        clientType: clientType || undefined,

        engagementType: engagementType || undefined,

        industry: industry.trim() || undefined,

        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setRecords(result.records);

      setTotalPages(result.pagination.totalPages);

      setTotalRecords(result.pagination.totalRecords);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [
    company?._id,
    page,
    search,
    status,
    clientType,
    engagementType,
    industry,
  ]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  /**
   * ==========================================================
   * CURRENT PAGE COUNTS
   * ==========================================================
   */

  const activeOnPage = records.filter(
    (client) => client.status === "ACTIVE",
  ).length;

  const inactiveOnPage = records.filter(
    (client) => client.status === "INACTIVE",
  ).length;

  /**
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");

    setStatus("");
    setClientType("");
    setEngagementType("");
    setIndustry("");

    setPage(1);
  }

  /**
   * ==========================================================
   * STATUS UPDATE
   * ==========================================================
   */

  async function handleStatusChange(client: Client) {
    if (!company?._id || !canUpdate) {
      return;
    }

    const nextStatus: ClientStatus =
      client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setIsUpdatingStatus(client._id);

      await clientService.updateClientStatus(company._id, client._id, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === "ACTIVE"
          ? "Client activated successfully."
          : "Client deactivated successfully.",
      );

      await loadClients();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingStatus(null);
    }
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  async function handleDelete(client: Client) {
    if (!company?._id || !canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${client.name}"? This will soft-delete the client record.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(client._id);

      await clientService.deleteClient(company._id, client._id);

      toast.success("Client deleted successfully.");

      /**
       * If we delete the last item from a later page,
       * move back one page.
       */
      if (records.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadClients();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(null);
    }
  }

  /**
   * ==========================================================
   * NO COMPANY
   * ==========================================================
   */

  if (!company?._id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          No active company
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select or connect an active company to manage clients.
        </p>
      </div>
    );
  }

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Client management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Clients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage in-house and external clients used across task and work
            management.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/clients/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create client
          </Link>
        )}
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total clients" value={totalRecords} />

        <SummaryCard label="Active on page" value={activeOnPage} />

        <SummaryCard label="Inactive on page" value={inactiveOnPage} />
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_170px_190px_170px_180px_auto]"
        >
          {/* Search */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search client, code, contact..."
              maxLength={200}
              className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Client type */}

          <select
            value={clientType}
            onChange={(event) => {
              setClientType(event.target.value as "" | ClientType);

              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All client types</option>

            <option value="EXTERNAL">External</option>

            <option value="IN_HOUSE">In-house</option>
          </select>

          {/* Engagement */}

          <select
            value={engagementType}
            onChange={(event) => {
              setEngagementType(
                event.target.value as "" | ClientEngagementType,
              );

              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All engagements</option>

            <option value="RETAINER">Retainer</option>

            <option value="PROJECT">Project</option>

            <option value="ONE_TIME">One-time</option>

            <option value="ONGOING">Ongoing</option>

            <option value="OTHER">Other</option>
          </select>

          {/* Status */}

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | ClientStatus);

              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All statuses</option>

            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Industry */}

          <input
            type="text"
            value={industry}
            onChange={(event) => {
              setIndustry(event.target.value);

              setPage(1);
            }}
            placeholder="Industry..."
            maxLength={150}
            className="h-11 rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => void loadClients()}
              disabled={isLoading}
              title="Refresh"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {(search || status || clientType || engagementType || industry) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* ======================================================
          CLIENT TABLE
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Building2 className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-semibold text-slate-950">
              No clients found
            </h2>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Create a client or modify the current search and filter criteria.
            </p>

            {canCreate && (
              <Link
                href="/clients/new"
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create client
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Client</TableHeading>

                  <TableHeading>Type</TableHeading>

                  <TableHeading>Engagement</TableHeading>

                  <TableHeading>Contact</TableHeading>

                  <TableHeading>Industry</TableHeading>

                  <TableHeading>Status</TableHeading>

                  <TableHeading align="right">Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((client) => (
                  <tr
                    key={client._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Client */}

                    <td className="px-5 py-4">
                      <div className="min-w-52">
                        <p className="font-semibold text-slate-900">
                          {client.name}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {client.code}
                        </p>

                        {client.website && (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Type */}

                    <TableCell>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          client.clientType === "IN_HOUSE"
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {getClientTypeLabel(client.clientType)}
                      </span>
                    </TableCell>

                    {/* Engagement */}

                    <TableCell>
                      {getEngagementLabel(client.engagementType)}
                    </TableCell>

                    {/* Contact */}

                    <td className="px-5 py-4">
                      <div className="min-w-44">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 text-slate-400" />

                          <span className="text-sm font-medium text-slate-700">
                            {client.contactPerson || "—"}
                          </span>
                        </div>

                        {client.email && (
                          <p className="mt-1 text-xs text-slate-500">
                            {client.email}
                          </p>
                        )}

                        {client.mobile && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {client.mobile}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Industry */}

                    <TableCell>{client.industry || "—"}</TableCell>

                    {/* Status */}

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(client)}
                        disabled={!canUpdate || isUpdatingStatus === client._id}
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                          client.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isUpdatingStatus === client._id
                          ? "Updating..."
                          : client.status}
                      </button>
                    </TableCell>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Link
                            href={`/clients/${client._id}/edit`}
                            title="Edit client"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(client)}
                            disabled={isDeleting === client._id}
                            title="Delete client"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            {isDeleting === client._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!isLoading && records.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.max(totalPages, 1)} · {totalRecords} client
              {totalRecords === 1 ? "" : "s"}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * ============================================================
 * SUMMARY CARD
 * ============================================================
 */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

/**
 * ============================================================
 * TABLE HEADING
 * ============================================================
 */

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/**
 * ============================================================
 * TABLE CELL
 * ============================================================
 */

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4 text-sm text-slate-700">{children}</td>;
}
