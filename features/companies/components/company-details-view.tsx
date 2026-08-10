"use client";

import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  RefreshCcw,
  Settings2,
  UserCog,
  Pencil,
  KeyRound,
  Power,
  PowerOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { companyService } from "@/features/companies/services/company.service";
import type {
  Company,
  CompanyAdministrator,
} from "@/features/companies/types/company.types";
import { CompanyAdministratorResetPasswordDialog } from "@/features/company-administrators/components/company-administrator-reset-password-dialog";
import { CompanyAdministratorStatusDialog } from "@/features/company-administrators/components/company-administrator-status-dialog";

interface CompanyDetailsViewProps {
  companyId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve company details.",
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

function buildAddress(company: Company) {
  const address = company.address;

  if (!address) {
    return "—";
  }

  const values = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.country,
    address.postalCode,
  ].filter(Boolean);

  return values.length > 0 ? values.join(", ") : "—";
}

export function CompanyDetailsView({ companyId }: CompanyDetailsViewProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [administrator, setAdministrator] =
    useState<CompanyAdministrator | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [companyData, administratorData] = await Promise.all([
        companyService.getCompanyById(companyId),
        companyService.getCompanyAdministrator(companyId),
      ]);

      setCompany(companyData);

      setAdministrator(administratorData.administrator);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setCompany(null);
      setAdministrator(null);

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
    return <CompanyDetailsSkeleton />;
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
            {errorMessage ?? "Company details are unavailable."}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/platform/companies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to companies
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Company details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View company information, configuration and administrator setup.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCompany()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            href={`/platform/companies/${company._id}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Edit3 className="h-4 w-4" />
            Edit company
          </Link>

          {!administrator && (
            <Link
              href={`/platform/companies/${company._id}/administrator/create`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <UserCog className="h-4 w-4" />
              Add company administrator
            </Link>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Building2 className="h-9 w-9" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{company.name}</h2>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    company.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {company.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Company code: {company.code}
              </p>

              <p className="mt-3 text-sm text-slate-300">
                {company.legalName || "No legal name available."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          <SummaryItem label="Company code" value={company.code} />

          <SummaryItem label="Currency" value={company.currency} />

          <SummaryItem label="Timezone" value={company.timezone} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailsSection
          icon={Building2}
          title="Company information"
          description="Primary identity and registration information."
        >
          <DetailsGrid>
            <DetailItem label="Company name" value={company.name} />

            <DetailItem label="Legal name" value={company.legalName} />

            <DetailItem label="Company code" value={company.code} />

            <DetailItem label="Slug" value={company.slug} />

            <DetailItem label="Status" value={company.status} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={Mail}
          title="Contact information"
          description="Primary company contact details."
        >
          <DetailsGrid>
            <DetailItem label="Email" value={company.email} />

            <DetailItem label="Phone" value={company.phone} />

            <DetailItem label="Website" value={company.website} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={MapPin}
          title="Company address"
          description="Registered or primary operating location."
        >
          <DetailItem label="Address" value={buildAddress(company)} />
        </DetailsSection>

        <DetailsSection
          icon={Settings2}
          title="Regional settings"
          description="Company localization preferences."
        >
          <DetailsGrid>
            <DetailItem label="Timezone" value={company.timezone} />

            <DetailItem label="Currency" value={company.currency} />

            <DetailItem label="Date format" value={company.dateFormat} />

            <DetailItem label="Time format" value={company.timeFormat} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={CalendarDays}
          title="Record information"
          description="System-generated company metadata."
        >
          <DetailsGrid>
            <DetailItem label="Company ID" value={company._id} breakWords />

            <DetailItem
              label="Created at"
              value={formatDate(company.createdAt)}
            />

            <DetailItem
              label="Updated at"
              value={formatDate(company.updatedAt)}
            />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UserCog}
          title="Company administrator"
          description="Primary administrative access for this company."
        >
          {administrator ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-5">
                  {/* Administrator identity */}
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <UserCog className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-slate-950">
                          {administrator.user.displayName ||
                            `${administrator.user.firstName} ${administrator.user.lastName}`}
                        </p>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            administrator.companyAccess.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {administrator.companyAccess.status}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {administrator.user.email}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>
                          {administrator.companyAccess.employeeCode || "—"}
                        </span>

                        <span className="hidden text-slate-300 sm:inline">
                          •
                        </span>

                        <span>
                          {administrator.companyAccess.designation || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Administrator actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                    <Link
                      href={`/platform/companies/${company._id}/administrator/edit`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsResetPasswordOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset password
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsStatusDialogOpen(true)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                        administrator.companyAccess.status === "ACTIVE"
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {administrator.companyAccess.status === "ACTIVE" ? (
                        <>
                          <PowerOff className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <DetailsGrid>
                <DetailItem
                  label="Administrator name"
                  value={
                    administrator.user.displayName ||
                    `${administrator.user.firstName} ${administrator.user.lastName}`
                  }
                />

                <DetailItem
                  label="Employee code"
                  value={administrator.companyAccess.employeeCode}
                />

                <DetailItem
                  label="Email"
                  value={administrator.user.email}
                  breakWords
                />

                <DetailItem label="Mobile" value={administrator.user.mobile} />

                <DetailItem
                  label="Designation"
                  value={administrator.companyAccess.designation}
                />

                <DetailItem
                  label="Employment type"
                  value={administrator.companyAccess.employmentType}
                />

                <DetailItem
                  label="Joining date"
                  value={formatDate(administrator.companyAccess.joiningDate)}
                />

                <DetailItem
                  label="Work location"
                  value={administrator.companyAccess.workLocationName}
                />

                <DetailItem label="Role" value={administrator.role.name} />

                <DetailItem
                  label="Primary company"
                  value={
                    administrator.companyAccess.isPrimaryCompany ? "Yes" : "No"
                  }
                />
              </DetailsGrid>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <UserCog className="mx-auto h-8 w-8 text-slate-400" />

              <p className="mt-3 font-semibold text-slate-800">
                No company administrator assigned
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Create the primary Company Administrator who will manage
                employees, departments, teams and other company-level
                operations.
              </p>

              <Link
                href={`/platform/companies/${company._id}/administrator/create`}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create company administrator
              </Link>
            </div>
          )}
        </DetailsSection>
      </div>
      {administrator && (
        <CompanyAdministratorResetPasswordDialog
          companyId={company._id}
          administratorName={
            administrator.user.displayName ||
            `${administrator.user.firstName} ${administrator.user.lastName}`
          }
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
        />
      )}

      {administrator && (
        <CompanyAdministratorStatusDialog
          companyId={company._id}
          administratorName={
            administrator.user.displayName ||
            `${administrator.user.firstName} ${administrator.user.lastName}`
          }
          currentStatus={
            administrator.companyAccess.status as "ACTIVE" | "INACTIVE"
          }
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          onUpdated={loadCompany}
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

      <p className="mt-2 font-semibold text-slate-900">{value || "—"}</p>
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

function CompanyDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}
