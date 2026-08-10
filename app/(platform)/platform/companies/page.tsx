"use client";

import axios from "axios";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { companyService } from "@/features/companies/services/company.service";
import type {
  Company,
  CompanyStatus,
} from "@/features/companies/types/company.types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
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

function getCompanyLocation(company: Company) {
  const parts = [
    company.address?.city,
    company.address?.state,
    company.address?.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "—";
}

const statusClassNames: Record<CompanyStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<CompanyStatus | "">("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await companyService.getCompanies({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setCompanies(result.records);
      setPagination(result.pagination);
    } catch (error: unknown) {
      setCompanies([]);

      toast.error(getErrorMessage(error, "Unable to retrieve companies."));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: CompanyStatus | "") {
    setPage(1);
    setStatus(value);
  }

  const activeCompanyCount = companies.filter(
    (company) => company.status === "ACTIVE",
  ).length;

  const inactiveCompanyCount = companies.filter(
    (company) => company.status === "INACTIVE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Platform Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Companies
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage all companies registered in the Employee Management System.
          </p>
        </div>

        <Link
          href="/platform/companies/create"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add company
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard
          label="Total companies"
          value={pagination.totalRecords}
          icon={Building2}
        />

        <SummaryCard
          label="Active on page"
          value={activeCompanyCount}
          icon={Building2}
        />

        <SummaryCard
          label="Inactive on page"
          value={inactiveCompanyCount}
          icon={Building2}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search company name, code, email or phone"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as CompanyStatus | "")
                }
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => void loadCompanies()}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left">
                <TableHeading>Company</TableHeading>
                <TableHeading>Code</TableHeading>
                <TableHeading>Contact</TableHeading>
                <TableHeading>Location</TableHeading>
                <TableHeading>Status</TableHeading>
                <TableHeading>Created</TableHeading>
                <TableHeading>Actions</TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <CompaniesLoadingRows />
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Building2 className="h-6 w-6" />
                    </div>

                    <p className="mt-4 font-semibold text-slate-800">
                      No companies found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing the search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">
                            {company.name}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {company.legalName || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {company.code}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {company.email || "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {company.phone || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {getCompanyLocation(company)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusClassNames[company.status]
                        }`}
                      >
                        {company.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(company.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/platform/companies/${company._id}`}
                          aria-label={`View ${company.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/platform/companies/${company._id}/edit`}
                          aria-label={`Edit ${company.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {companies.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {pagination.totalRecords}
            </span>{" "}
            companies
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm font-medium text-slate-600">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function CompaniesLoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 7 }).map((_, columnIndex) => (
            <td key={columnIndex} className="px-6 py-5">
              <div className="h-5 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
