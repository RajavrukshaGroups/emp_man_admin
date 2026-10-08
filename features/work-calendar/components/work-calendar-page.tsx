"use client";

import { CalendarDays, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CalendarDaysSection } from "./calendar-days-section";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import { workCalendarService } from "../services/work-calendar.service";
import { CalendarSettingsCard } from "./calendar-settings-card";
import type { WorkCalendar } from "../types/work-calendar.types";

/* =========================================================
   PAGE
   ========================================================= */

export function WorkCalendarPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("calendar.read");
  const canManage = permissions.includes("calendar.manage");

  const [calendars, setCalendars] = useState<WorkCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  /* =========================================================
     LOAD CALENDARS
     ========================================================= */

  const loadCalendars = useCallback(async () => {
    if (!company?._id || !canRead) {
      setCalendars([]);
      setSelectedCalendarId("");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await workCalendarService.list(company._id, {
        status: "ACTIVE",
      });

      const items = result.items ?? [];

      setCalendars(items);

      setSelectedCalendarId((current) => {
        if (current && items.some((calendar) => calendar._id === current)) {
          return current;
        }

        const defaultCalendar = items.find(
          (calendar) => calendar.isDefault === true,
        );

        return defaultCalendar?._id ?? items[0]?._id ?? "";
      });
    } catch (error) {
      setCalendars([]);
      setSelectedCalendarId("");

      toast.error(
        getApiErrorMessage(error, "Unable to load company work calendars."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, canRead]);

  useEffect(() => {
    void loadCalendars();
  }, [loadCalendars]);

  /* =========================================================
     SELECTED CALENDAR
     ========================================================= */

  const selectedCalendar = useMemo(
    () =>
      calendars.find((calendar) => calendar._id === selectedCalendarId) ?? null,
    [calendars, selectedCalendarId],
  );

  const handleCalendarUpdated = (updatedCalendar: WorkCalendar) => {
    setCalendars((current) =>
      current.map((calendar) =>
        calendar._id === updatedCalendar._id
          ? updatedCalendar
          : updatedCalendar.isDefault
            ? { ...calendar, isDefault: false }
            : calendar,
      ),
    );
  };

  /* =========================================================
     PERMISSION
     ========================================================= */

  if (!canRead) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Work calendar unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            You do not have permission to view the company work calendar.
          </p>
        </section>
      </div>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />

        <button
          type="button"
          onClick={() => void loadCalendars()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* LOADING */}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />

          <p className="mt-3 text-sm text-slate-500">
            Loading work calendar...
          </p>
        </section>
      ) : calendars.length === 0 ? (
        <EmptyCalendarState canManage={canManage} />
      ) : (
        <>
          {/* CALENDAR SELECTOR */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-bold text-slate-950">
                  Company Work Calendar
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Weekly offs, holidays and working-day overrides are resolved
                  from this calendar.
                </p>
              </div>

              {calendars.length > 1 && (
                <div className="w-full lg:w-72">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Calendar
                  </label>

                  <select
                    value={selectedCalendarId}
                    onChange={(event) =>
                      setSelectedCalendarId(event.target.value)
                    }
                    className={inputClassName}
                  >
                    {calendars.map((calendar) => (
                      <option key={calendar._id} value={calendar._id}>
                        {calendar.name}
                        {calendar.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {selectedCalendar && (
            <>
              {/* TEMPORARY SUMMARY.
                  We replace this with CalendarSettingsCard next. */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">
                      {selectedCalendar.name}
                    </h2>

                    {selectedCalendar.isDefault && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Default
                      </span>
                    )}

                    <StatusBadge status={selectedCalendar.status} />
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedCalendar.description ||
                      "Company working-day configuration."}
                  </p>
                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label="Code" value={selectedCalendar.code} />

                  <InfoCard
                    label="Weekly off"
                    value={formatWeeklyOffDays(selectedCalendar.weeklyOffDays)}
                  />

                  <InfoCard
                    label="Effective from"
                    value={formatDate(selectedCalendar.effectiveFrom)}
                  />

                  <InfoCard
                    label="Access"
                    value={canManage ? "Manage" : "Read only"}
                  />
                </div>
              </section>
              <CalendarSettingsCard
                companyId={company!._id}
                calendar={selectedCalendar}
                canManage={canManage}
                onUpdated={handleCalendarUpdated}
              />
              <CalendarDaysSection
                companyId={company!._id}
                calendar={selectedCalendar}
                canManage={canManage}
              />
              {/* We intentionally add the actual settings/day-management
                  components in the next steps after this compiles. */}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function PageHeader() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <CalendarDays className="h-5 w-5" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Work Calendar
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure company working days, weekly offs and holidays.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyCalendarState({ canManage }: { canManage: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

      <h2 className="mt-4 text-lg font-bold text-slate-950">
        No active work calendar
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {canManage
          ? "No active work calendar is currently configured for this company."
          : "No active work calendar is currently available for this company."}
      </p>
    </section>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: WorkCalendar["status"] }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function formatWeeklyOffDays(days: number[]) {
  if (!days.length) {
    return "None";
  }

  return days.map((day) => DAY_NAMES[day] ?? `Day ${day}`).join(", ");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
