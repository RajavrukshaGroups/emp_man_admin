"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { companyService } from "@/features/companies/services/company.service";
import type { Company } from "@/features/companies/types/company.types";

import { getApiErrorMessage } from "@/lib/axios";

import { CompanyAdministratorForm } from "./company-administrator-form";

interface CompanyAdministratorCreateViewProps {
  companyId: string;
}

export function CompanyAdministratorCreateView({
  companyId,
}: CompanyAdministratorCreateViewProps) {
  const [company, setCompany] = useState<Company | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const companyData = await companyService.getCompanyById(companyId);

      setCompany(companyData);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to retrieve company details.",
      );

      setCompany(null);
      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading company...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !company) {
    return (
      <div className="space-y-6">
        <Link
          href="/platform/companies"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load company
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage ?? "Company information is unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadCompany()}
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
    <div className="space-y-6">
      {/* Back link and heading */}

      <div>
        <Link
          href={`/platform/companies/${company._id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to company details
        </Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Platform Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Create company administrator
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Create the primary administrator account that will manage employees,
            departments, teams, roles and other operations for this company.
          </p>
        </div>
      </div>

      {/* Selected company */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Administrator for
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {company.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {company.code}
                {" · "}
                {company.legalName || "No legal name"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
              company.status === "ACTIVE"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {company.status}
          </span>
        </div>
      </section>

      {/* Information banner */}

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

        <div>
          <p className="font-semibold text-blue-950">
            Primary Company Administrator
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            This user will receive the Company Administrator role for{" "}
            <strong>{company.name}</strong>. Only one primary administrator can
            currently be assigned to a company.
          </p>
        </div>
      </div>

      {/* Actual form */}

      <CompanyAdministratorForm companyId={companyId} />
    </div>
  );
}
