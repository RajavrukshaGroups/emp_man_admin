"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  CircleOff,
  Plus,
  RefreshCcw,
  UserCog,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { companyService } from "@/features/companies/services/company.service";
import { platformAdminService } from "@/features/platform-admins/services/platform-admin.service";
import type {
  Company,
  CompanyListData,
} from "@/features/companies/types/company.types";
export function PlatformDashboardView() {
  const [result, setResult] = useState<CompanyListData>({
    records: [],
    pagination: {
      page: 1,
      limit: 100,
      totalRecords: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [platformAdminCount, setPlatformAdminCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);

      const [companyResult, adminResult] = await Promise.all([
        companyService.getCompanies({
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),

        platformAdminService.getPlatformAdmins({
          page: 1,
          limit: 1,
        }),
      ]);

      setResult(companyResult);

      setPlatformAdminCount(adminResult.pagination.totalRecords ?? 0);
    } catch (error) {
      console.error("Failed to load platform dashboard:", error);

      toast.error("Unable to load platform dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const companies = result.records;

  const summary = useMemo(() => {
    const totalCompanies = result.pagination.totalRecords;

    const activeCompanies = companies.filter(
      (company) => company.status === "ACTIVE",
    ).length;

    const inactiveCompanies = companies.filter(
      (company) => company.status === "INACTIVE",
    ).length;

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
    };
  }, [companies, result.pagination.totalRecords]);

  const recentCompanies = useMemo(() => {
    return companies.slice(0, 5);
  }, [companies]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Platform Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Platform Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor companies and platform-level administration from one central
            dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Building2}
          label="Total companies"
          value={summary.totalCompanies}
          description="Registered companies"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Active companies"
          value={summary.activeCompanies}
          description="Currently active"
        />

        <SummaryCard
          icon={CircleOff}
          label="Inactive companies"
          value={summary.inactiveCompanies}
          description="Currently inactive"
        />

        <SummaryCard
          icon={UserCog}
          label="Platform admins"
          value={platformAdminCount}
          description="GLOBAL administrators"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Recent companies
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recently registered companies on the platform.
            </p>
          </div>

          <Link
            href="/platform/companies"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            View all companies
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : recentCompanies.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Building2 className="mx-auto h-8 w-8 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-900">
              No companies available
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create the first company to begin platform administration.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentCompanies.map((company) => (
              <div
                key={company._id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <Link
                      href={`/platform/companies/${company._id}`}
                      className="font-semibold text-slate-950 transition hover:text-blue-600"
                    >
                      {company.name}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {company.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      company.status === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {company.status}
                  </span>

                  <Link
                    href={`/platform/companies/${company._id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Quick actions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Frequently used platform administration actions.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            href="/platform/companies/create"
            icon={Plus}
            title="Add company"
            description="Register a new company."
          />

          <QuickAction
            href="/platform/companies"
            icon={Building2}
            title="Manage companies"
            description="View and manage registered companies."
          />

          <QuickAction
            href="/platform/admins"
            icon={UserCog}
            title="Platform admins"
            description="Manage platform-level administrators."
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
