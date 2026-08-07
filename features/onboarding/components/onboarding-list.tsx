"use client";

import axios from "axios";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { onboardingService } from "@/features/onboarding/services/onboarding.service";
import type {
  OnboardingListData,
  OnboardingRecord,
} from "@/features/onboarding/types/onboarding.types";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to load onboarding records."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load onboarding records.";
}

function getInitials(name?: string) {
  if (!name) {
    return "NA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

function getStepMeta(record: OnboardingRecord) {
  if (record.nextStep === "COMPANY_ACCESS") {
    return {
      title: "Continue Step 2",
      description: "Company access pending",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      progress: "1 of 3 completed",
    };
  }

  if (record.nextStep === "EMPLOYEE_PROFILE") {
    return {
      title: "Continue Step 3",
      description: "Employee profile pending",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      progress: "2 of 3 completed",
    };
  }

  return {
    title: "Completed",
    description: "Onboarding completed",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    progress: "3 of 3 completed",
  };
}

export function OnboardingList() {
  const [result, setResult] = useState<OnboardingListData>({
    records: [],
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      totalRecords: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await onboardingService.getPendingOnboarding({
        page: 1,
        limit: PAGE_SIZE,
        search: search || undefined,
      });

      setResult(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSearch(searchInput.trim());
  }

  const step2Count = result.records.filter(
    (record) => record.nextStep === "COMPANY_ACCESS",
  ).length;

  const step3Count = result.records.filter(
    (record) => record.nextStep === "EMPLOYEE_PROFILE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Employee onboarding
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Continue incomplete employee onboarding processes or start a new
            employee.
          </p>
        </div>

        <Link
          href="/onboarding/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Start onboarding
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={UsersRound}
          label="Pending onboarding"
          value={result.pagination.totalRecords}
        />

        <SummaryCard
          icon={BriefcaseBusiness}
          label="Company access pending"
          value={step2Count}
        />

        <SummaryCard
          icon={UserRound}
          label="Employee profile pending"
          value={step3Count}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name, email or mobile"
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

            <button
              type="button"
              onClick={() => void loadRecords()}
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
          <OnboardingSkeleton />
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load onboarding
            </h2>

            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadRecords()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : result.records.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              No pending onboarding
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              All current employee onboarding records have been completed.
            </p>

            <Link
              href="/onboarding/new"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Start onboarding
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {result.records.map((record) => {
              const meta = getStepMeta(record);

              const user = record.user;

              return (
                <div
                  key={user._id}
                  className="flex flex-col gap-5 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {getInitials(user.displayName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-950">
                          {user.displayName}
                        </h3>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
                        >
                          {meta.progress}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {user.email}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{user.mobile || "No mobile"}</span>

                        <span>Started {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        Next step
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {meta.description}
                      </p>
                    </div>

                    <Link
                      href={`/onboarding/${user._id}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {meta.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
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

function OnboardingSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}
