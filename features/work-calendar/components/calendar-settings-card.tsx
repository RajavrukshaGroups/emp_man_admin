"use client";

import { CalendarCog, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { workCalendarService } from "../services/work-calendar.service";
import type {
  UpdateWorkCalendarPayload,
  WorkCalendar,
} from "../types/work-calendar.types";

/* =========================================================
   TYPES
   ========================================================= */

interface CalendarSettingsCardProps {
  companyId: string;
  calendar: WorkCalendar;
  canManage: boolean;
  onUpdated: (calendar: WorkCalendar) => void;
}

interface CalendarFormState {
  name: string;
  code: string;
  description: string;
  weeklyOffDays: number[];
  effectiveFrom: string;
  effectiveTo: string;
  isDefault: boolean;
  status: "ACTIVE" | "INACTIVE";
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const WEEK_DAYS = [
  { value: 0, label: "Sunday", shortLabel: "Sun" },
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
];

/* =========================================================
   COMPONENT
   ========================================================= */

export function CalendarSettingsCard({
  companyId,
  calendar,
  canManage,
  onUpdated,
}: CalendarSettingsCardProps) {
  const [form, setForm] = useState<CalendarFormState>(() =>
    buildFormState(calendar),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     SYNC
     ========================================================= */

  useEffect(() => {
    setForm(buildFormState(calendar));
    setIsEditing(false);
  }, [calendar]);

  /* =========================================================
     WEEKLY OFF
     ========================================================= */

  const toggleWeeklyOff = (day: number) => {
    if (!canManage || !isEditing) {
      return;
    }

    setForm((current) => {
      const exists = current.weeklyOffDays.includes(day);

      return {
        ...current,
        weeklyOffDays: exists
          ? current.weeklyOffDays.filter((value) => value !== day)
          : [...current.weeklyOffDays, day].sort((a, b) => a - b),
      };
    });
  };

  /* =========================================================
     CANCEL
     ========================================================= */

  const handleCancel = () => {
    setForm(buildFormState(calendar));
    setIsEditing(false);
  };

  /* =========================================================
     SAVE
     ========================================================= */

  const handleSave = async () => {
    if (!canManage) {
      return;
    }

    if (!form.name.trim()) {
      toast.error("Calendar name is required.");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Calendar code is required.");
      return;
    }

    if (!form.effectiveFrom) {
      toast.error("Effective from date is required.");
      return;
    }

    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      toast.error("Effective to date cannot be before effective from date.");
      return;
    }

    const payload: UpdateWorkCalendarPayload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      weeklyOffDays: form.weeklyOffDays,
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo || null,
      isDefault: form.isDefault,
      status: form.status,
    };

    try {
      setIsSaving(true);

      const updated = await workCalendarService.update(
        companyId,
        calendar._id,
        payload,
      );

      onUpdated(updated);

      setForm(buildFormState(updated));
      setIsEditing(false);

      toast.success("Work calendar settings updated successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update work calendar."));
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarCog className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">Calendar Settings</h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Configure the calendar period and recurring weekly offs.
            </p>
          </div>
        </div>

        {canManage && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit Settings
          </button>
        )}
      </div>

      {/* FORM */}

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Calendar name">
            <input
              value={form.name}
              disabled={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label="Calendar code">
            <input
              value={form.code}
              disabled={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label="Effective from">
            <input
              type="date"
              value={form.effectiveFrom}
              disabled={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  effectiveFrom: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label="Effective to">
            <input
              type="date"
              value={form.effectiveTo}
              disabled={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  effectiveTo: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              disabled={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as "ACTIVE" | "INACTIVE",
                }))
              }
              className={inputClassName}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>

          <div className="flex items-end">
            <label
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 ${
                isEditing ? "cursor-pointer bg-white" : "bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={form.isDefault}
                disabled={!isEditing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm font-medium text-slate-700">
                Default company calendar
              </span>
            </label>
          </div>
        </div>

        {/* DESCRIPTION */}

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            disabled={!isEditing}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            className={`${inputClassName} h-auto min-h-24 py-3`}
          />
        </Field>

        {/* WEEKLY OFF */}

        <div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Off Days
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Selected weekdays are treated as recurring non-working days.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const selected = form.weeklyOffDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => toggleWeeklyOff(day.value)}
                  title={day.label}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600"
                  } ${
                    isEditing
                      ? "hover:border-blue-300"
                      : "cursor-default disabled:opacity-100"
                  }`}
                >
                  {day.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}

        {canManage && isEditing && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {!canManage && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            You have read-only access to the company work calendar.
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   FIELD
   ========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function buildFormState(calendar: WorkCalendar): CalendarFormState {
  return {
    name: calendar.name,
    code: calendar.code,
    description: calendar.description ?? "",
    weeklyOffDays: [...calendar.weeklyOffDays],
    effectiveFrom: toDateInputValue(calendar.effectiveFrom),
    effectiveTo: toDateInputValue(calendar.effectiveTo),
    isDefault: calendar.isDefault,
    status: calendar.status,
  };
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600";
