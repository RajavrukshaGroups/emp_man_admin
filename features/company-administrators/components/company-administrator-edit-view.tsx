"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { companyAdministratorService } from "../services/company-administrator.service";

import { CompanyAdministratorEditForm } from "./company-administrator-edit-form";

import type { CompanyAdministrator } from "../types/company-administrator.types";

interface CompanyAdministratorEditViewProps {
  companyId: string;
}

export function CompanyAdministratorEditView({
  companyId,
}: CompanyAdministratorEditViewProps) {
  const [administrator, setAdministrator] =
    useState<CompanyAdministrator | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAdministrator = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data =
        await companyAdministratorService.getCompanyAdministrator(companyId);

      if (!data.administrator) {
        setAdministrator(null);

        setErrorMessage(
          "No company administrator is assigned to this company.",
        );

        return;
      }

      setAdministrator(data.administrator);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to retrieve company administrator.",
      );

      setAdministrator(null);

      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadAdministrator();
  }, [loadAdministrator]);

  if (isLoading) {
    return <CompanyAdministratorEditSkeleton />;
  }

  if (errorMessage || !administrator) {
    return (
      <div className="space-y-6">
        <Link
          href={`/platform/companies/${companyId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to company
        </Link>

        <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to edit administrator
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
            {errorMessage ??
              "Company administrator information is unavailable."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadAdministrator()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>

            <Link
              href={`/platform/companies/${companyId}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to company
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/platform/companies/${companyId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to company
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Edit company administrator
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Update personal information, company access details and verification
          settings for the company's primary administrator.
        </p>
      </div>

      <CompanyAdministratorEditForm
        companyId={companyId}
        administrator={administrator}
      />
    </div>
  );
}

function CompanyAdministratorEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-slate-200" />

        <div className="h-10 w-80 animate-pulse rounded-xl bg-slate-200" />

        <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-slate-200" />
      </div>

      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}
