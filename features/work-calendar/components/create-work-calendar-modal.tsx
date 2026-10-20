"use client";

import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";
import { workCalendarService } from "../services/work-calendar.service";

import type {
  CreateWorkCalendarPayload,
  WorkCalendar,
} from "../types/work-calendar.types";

interface CreateWorkCalendarModalProps {
  companyId: string;
  onClose: () => void;
  onCreated: (calendar: WorkCalendar) => void;
}

const WEEKDAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export function CreateWorkCalendarModal({
  companyId,
  onClose,
  onCreated,
}: CreateWorkCalendarModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<CreateWorkCalendarPayload>({
    name: "",
    code: "",
    description: "",
    weeklyOffDays: [0],
    effectiveFrom: "2026-10-15",
    effectiveTo: null,
    isDefault: true,
    status: "ACTIVE",
  });

  const updateField = <K extends keyof CreateWorkCalendarPayload>(
    field: K,
    value: CreateWorkCalendarPayload[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleWeeklyOff = (day: number) => {
    setForm((current) => ({
      ...current,
      weeklyOffDays: current.weeklyOffDays.includes(day)
        ? current.weeklyOffDays.filter((value) => value !== day)
        : [...current.weeklyOffDays, day].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      toast.error("Effective-to cannot be earlier than effective-from.");
      return;
    }

    try {
      setIsSubmitting(true);

      const created = await workCalendarService.create(companyId, {
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description?.trim() ?? "",
        effectiveTo: form.effectiveTo || null,
      });

      toast.success("Work calendar created successfully.");
      onCreated(created);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create work calendar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-calendar-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="create-calendar-title"
              className="text-lg font-bold text-slate-950"
            >
              Create Work Calendar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure working days and weekly offs for your company.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Calendar name *
                </label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  className={inputClassName}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="DES General Work Calendar"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Calendar code *
                </label>
                <input
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9_-]+"
                  title="Letters, numbers, underscores and hyphens only"
                  className={inputClassName}
                  value={form.code}
                  onChange={(e) =>
                    updateField("code", e.target.value.toUpperCase())
                  }
                  placeholder="DES_GENERAL"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="General working calendar for the company"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Weekly off days
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.weeklyOffDays.includes(day.value)}
                      onChange={() => toggleWeeklyOff(day.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {day.label}
                  </label>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Select the days employees normally do not work.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Effective from *
                </label>
                <input
                  required
                  type="date"
                  className={inputClassName}
                  value={form.effectiveFrom}
                  onChange={(e) => updateField("effectiveFrom", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Effective to (optional)
                </label>
                <input
                  type="date"
                  min={form.effectiveFrom}
                  className={inputClassName}
                  value={form.effectiveTo ?? ""}
                  onChange={(e) =>
                    updateField("effectiveTo", e.target.value || null)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isDefault ?? false}
                  onChange={(e) => updateField("isDefault", e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Set as default calendar
              </label>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  className={inputClassName}
                  value={form.status}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value as "ACTIVE" | "INACTIVE",
                    )
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Calendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
