"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CreateCompanyForm } from "@/features/companies/components/create-company-form";
import { companyService } from "@/features/companies/services/company.service";
import type { Company } from "@/features/companies/types/company.types";

interface EditCompanyViewProps {
  companyId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve company.",
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

export function EditCompanyView({ companyId }: EditCompanyViewProps) {
  const [company, setCompany] = useState<Company | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await companyService.getCompanyById(companyId);

      setCompany(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

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
      <div className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />

        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (errorMessage || !company) {
    return (
      <div className="space-y-6">
        <Link
          href="/platform/companies"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
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
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <CreateCompanyForm mode="edit" company={company} />;
}
