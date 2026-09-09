"use client";

import { useState } from "react";
import { Clock3, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import { attendanceShiftService } from "@/features/attendance/services/attendance-shift.service";
import type {
  AttendanceShift,
  AttendanceShiftStatus,
  CreateAttendanceShiftPayload,
} from "@/features/attendance/types/attendance-shift.types";
import { getApiErrorMessage } from "@/lib/axios";

interface AttendanceShiftFormProps {
  companyId: string;
  shift?: AttendanceShift | null;
  onClose: () => void;
  onSaved: (shift: AttendanceShift) => void;
}

interface ShiftFormState {
  name: string;
  code: string;
  description: string;

  startTime: string;
  endTime: string;

  isOvernight: boolean;

  fullDayMinutes: number;
  halfDayMinutes: number;

  lateGraceMinutes: number;
  earlyCheckoutGraceMinutes: number;

  standardBreakMinutes: number;
  maxBreakMinutes: number;

  allowMultipleBreaks: boolean;

  workingDays: number[];

  effectiveFrom: string;
  effectiveTo: string;

  status: AttendanceShiftStatus;
}

const INITIAL_STATE: ShiftFormState = {
  name: "",
  code: "",
  description: "",

  startTime: "09:30",
  endTime: "18:30",

  isOvernight: false,

  fullDayMinutes: 480,
  halfDayMinutes: 240,

  lateGraceMinutes: 15,
  earlyCheckoutGraceMinutes: 15,

  standardBreakMinutes: 60,
  maxBreakMinutes: 90,

  allowMultipleBreaks: true,

  workingDays: [1, 2, 3, 4, 5, 6],

  effectiveFrom: "",
  effectiveTo: "",

  status: "ACTIVE",
};

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`).toISOString();
}

function getInitialState(shift?: AttendanceShift | null): ShiftFormState {
  if (!shift) {
    return {
      ...INITIAL_STATE,
      workingDays: [...INITIAL_STATE.workingDays],
    };
  }

  return {
    name: shift.name ?? "",
    code: shift.code ?? "",
    description: shift.description ?? "",

    startTime: shift.startTime,
    endTime: shift.endTime,

    isOvernight: shift.isOvernight,

    fullDayMinutes: shift.fullDayMinutes,
    halfDayMinutes: shift.halfDayMinutes,

    lateGraceMinutes: shift.lateGraceMinutes,
    earlyCheckoutGraceMinutes: shift.earlyCheckoutGraceMinutes,

    standardBreakMinutes: shift.standardBreakMinutes,

    maxBreakMinutes: shift.maxBreakMinutes,

    allowMultipleBreaks: shift.allowMultipleBreaks,

    workingDays: [...shift.workingDays],

    effectiveFrom: toDateInputValue(shift.effectiveFrom),

    effectiveTo: toDateInputValue(shift.effectiveTo),

    status: shift.status,
  };
}

export function AttendanceShiftForm({
  companyId,
  shift,
  onClose,
  onSaved,
}: AttendanceShiftFormProps) {
  const [form, setForm] = useState<ShiftFormState>(() =>
    getInitialState(shift),
  );

  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(shift?._id);

  function updateField<K extends keyof ShiftFormState>(
    field: K,
    value: ShiftFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleWorkingDay(day: number) {
    setForm((current) => {
      const exists = current.workingDays.includes(day);

      return {
        ...current,
        workingDays: exists
          ? current.workingDays.filter((item) => item !== day)
          : [...current.workingDays, day].sort((a, b) => a - b),
      };
    });
  }

  function validateForm() {
    if (!form.name.trim()) {
      toast.error("Shift name is required.");
      return false;
    }

    if (!form.code.trim()) {
      toast.error("Shift code is required.");
      return false;
    }

    if (!form.startTime || !form.endTime) {
      toast.error("Shift start and end time are required.");
      return false;
    }

    if (!form.isOvernight && form.startTime === form.endTime) {
      toast.error("Normal shift start and end time cannot be the same.");
      return false;
    }

    if (form.fullDayMinutes < 1) {
      toast.error("Full-day minutes must be greater than 0.");
      return false;
    }

    if (form.halfDayMinutes < 1) {
      toast.error("Half-day minutes must be greater than 0.");
      return false;
    }

    if (form.halfDayMinutes > form.fullDayMinutes) {
      toast.error("Half-day minutes cannot exceed full-day minutes.");
      return false;
    }

    if (form.maxBreakMinutes < form.standardBreakMinutes) {
      toast.error(
        "Maximum break minutes cannot be below standard break minutes.",
      );
      return false;
    }

    if (form.workingDays.length === 0) {
      toast.error("At least one working day is required.");
      return false;
    }

    if (
      form.effectiveFrom &&
      form.effectiveTo &&
      form.effectiveTo < form.effectiveFrom
    ) {
      toast.error(
        "Effective-to date cannot be earlier than effective-from date.",
      );
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateAttendanceShiftPayload = {
      name: form.name.trim(),

      code: form.code.trim().toUpperCase(),

      description: form.description.trim(),

      startTime: form.startTime,
      endTime: form.endTime,

      isOvernight: form.isOvernight,

      fullDayMinutes: form.fullDayMinutes,

      halfDayMinutes: form.halfDayMinutes,

      lateGraceMinutes: form.lateGraceMinutes,

      earlyCheckoutGraceMinutes: form.earlyCheckoutGraceMinutes,

      standardBreakMinutes: form.standardBreakMinutes,

      maxBreakMinutes: form.maxBreakMinutes,

      allowMultipleBreaks: form.allowMultipleBreaks,

      workingDays: form.workingDays,

      effectiveFrom: toIsoDate(form.effectiveFrom),

      effectiveTo: toIsoDate(form.effectiveTo),

      status: form.status,
    };

    try {
      setIsSaving(true);

      let saved: AttendanceShift;

      if (isEditMode && shift?._id) {
        saved = await attendanceShiftService.update(
          companyId,
          shift._id,
          payload,
        );

        toast.success("Shift updated successfully.");
      } else {
        saved = await attendanceShiftService.create(companyId, payload);

        toast.success("Shift created successfully.");
      }

      onSaved(saved);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode ? "Unable to update shift." : "Unable to create shift.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {isEditMode ? "Edit Attendance Shift" : "Add Attendance Shift"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditMode
                  ? "Update shift timings, working rules and effective dates."
                  : "Configure shift timings, attendance thresholds and working days."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-8 p-5 sm:p-6">
            {/* Basic */}
            <section>
              <SectionTitle
                title="Shift details"
                description="Enter the basic information and status for this shift."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Shift name" required>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="General Shift"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Shift code" required>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                    placeholder="GENERAL_SHIFT"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as AttendanceShiftStatus,
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="ACTIVE">Active</option>

                    <option value="INACTIVE">Inactive</option>
                  </select>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      rows={3}
                      placeholder="Optional shift description..."
                      className={`${inputClassName} min-h-24 resize-y py-3`}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Timing */}
            <section>
              <SectionTitle
                title="Shift timing"
                description="Configure the scheduled working period."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Start time" required>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateField("startTime", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="End time" required>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateField("endTime", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <ToggleCard
                  label="Overnight shift"
                  description="Enable when the shift ends on the following calendar day."
                  checked={form.isOvernight}
                  onChange={(checked) => updateField("isOvernight", checked)}
                />
              </div>
            </section>

            {/* Attendance thresholds */}
            <section>
              <SectionTitle
                title="Attendance thresholds"
                description="Define how much work qualifies for full-day and half-day attendance."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MinutesField
                  label="Full-day minutes"
                  value={form.fullDayMinutes}
                  onChange={(value) => updateField("fullDayMinutes", value)}
                  min={1}
                  max={1440}
                />

                <MinutesField
                  label="Half-day minutes"
                  value={form.halfDayMinutes}
                  onChange={(value) => updateField("halfDayMinutes", value)}
                  min={1}
                  max={1440}
                />

                <MinutesField
                  label="Late grace"
                  value={form.lateGraceMinutes}
                  onChange={(value) => updateField("lateGraceMinutes", value)}
                  min={0}
                  max={720}
                />

                <MinutesField
                  label="Early checkout grace"
                  value={form.earlyCheckoutGraceMinutes}
                  onChange={(value) =>
                    updateField("earlyCheckoutGraceMinutes", value)
                  }
                  min={0}
                  max={720}
                />
              </div>
            </section>

            {/* Breaks */}
            <section>
              <SectionTitle
                title="Break configuration"
                description="Configure standard break duration and maximum permitted break time."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MinutesField
                  label="Standard break"
                  value={form.standardBreakMinutes}
                  onChange={(value) =>
                    updateField("standardBreakMinutes", value)
                  }
                  min={0}
                  max={720}
                />

                <MinutesField
                  label="Maximum break"
                  value={form.maxBreakMinutes}
                  onChange={(value) => updateField("maxBreakMinutes", value)}
                  min={0}
                  max={720}
                />

                <ToggleCard
                  label="Multiple breaks"
                  description="Employees may take multiple breaks during the shift."
                  checked={form.allowMultipleBreaks}
                  onChange={(checked) =>
                    updateField("allowMultipleBreaks", checked)
                  }
                />
              </div>
            </section>

            {/* Working days */}
            <section>
              <SectionTitle
                title="Working days"
                description="Select the weekdays applicable to this shift."
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const selected = form.workingDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWorkingDay(day.value)}
                      className={`min-w-14 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Effective dates */}
            <section>
              <SectionTitle
                title="Effective dates"
                description="Optionally control when this shift configuration becomes valid."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Effective from">
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(event) =>
                      updateField("effectiveFrom", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Effective to">
                  <input
                    type="date"
                    value={form.effectiveTo}
                    onChange={(event) =>
                      updateField("effectiveTo", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSaving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  description: string;
}

function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>

      {children}
    </div>
  );
}

interface MinutesFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function MinutesField({ label, value, onChange, min, max }: MinutesFieldProps) {
  return (
    <FormField label={label}>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${inputClassName} pr-16`}
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          min
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-400">{formatMinutes(value)}</p>
    </FormField>
  );
}

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) {
    return "";
  }

  const hours = Math.floor(minutes / 60);

  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder} min`;
  }

  if (remainder === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainder} min`;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400";
