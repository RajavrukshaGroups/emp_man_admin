"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { attendancePolicyService } from "@/features/attendance/services/attendance-policy.service";
import type {
  AttendanceMissingCheckoutAction,
  AttendancePolicy,
  AttendancePolicyStatus,
  CreateAttendancePolicyPayload,
} from "@/features/attendance/types/attendance-policy.types";
import { getApiErrorMessage } from "@/lib/axios";

interface AttendancePolicyFormProps {
  companyId: string;
  policy?: AttendancePolicy | null;
  onClose: () => void;
  onSaved: (policy: AttendancePolicy) => void;
}

type PolicyFormState = Omit<
  CreateAttendancePolicyPayload,
  "effectiveFrom" | "effectiveTo"
> & {
  name: string;
  code: string;
  description: string;
  locationRequired: boolean;
  maximumAcceptedAccuracyMeters: number;
  enforceGeofenceForOffice: boolean;
  enforceGeofenceForHybrid: boolean;
  enforceGeofenceForField: boolean;
  enforceGeofenceForRemote: boolean;
  allowMultipleWorkSessions: boolean;
  allowReCheckInSameDay: boolean;
  preventOverlappingSessions: boolean;
  missingCheckoutAction: AttendanceMissingCheckoutAction;
  autoCloseAfterMinutes: number;
  maximumOpenSessionMinutes: number;
  allowNextDayCheckInWithPendingPreviousDay: boolean;
  regularizationEnabled: boolean;
  regularizationWindowDays: number;
  requireRegularizationReason: boolean;
  allowCheckInCorrection: boolean;
  allowCheckOutCorrection: boolean;
  allowBreakCorrection: boolean;
  fieldVisitEnabled: boolean;
  fieldVisitPurposeRequired: boolean;
  fieldVisitOutcomeRequired: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  isDefault: boolean;
  status: AttendancePolicyStatus;
};

const INITIAL_STATE: PolicyFormState = {
  name: "",
  code: "",
  description: "",
  locationRequired: true,
  maximumAcceptedAccuracyMeters: 100,
  enforceGeofenceForOffice: true,
  enforceGeofenceForHybrid: true,
  enforceGeofenceForField: false,
  enforceGeofenceForRemote: false,
  allowMultipleWorkSessions: true,
  allowReCheckInSameDay: true,
  preventOverlappingSessions: true,
  missingCheckoutAction: "REQUIRE_REGULARIZATION",
  autoCloseAfterMinutes: 120,
  maximumOpenSessionMinutes: 960,
  allowNextDayCheckInWithPendingPreviousDay: true,
  regularizationEnabled: true,
  regularizationWindowDays: 7,
  requireRegularizationReason: true,
  allowCheckInCorrection: true,
  allowCheckOutCorrection: true,
  allowBreakCorrection: true,
  fieldVisitEnabled: true,
  fieldVisitPurposeRequired: true,
  fieldVisitOutcomeRequired: false,
  effectiveFrom: "",
  effectiveTo: "",
  isDefault: true,
  status: "ACTIVE",
};

function dateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// Date-only values are represented consistently as UTC midnight.
function toIsoDate(value: string) {
  return `${value}T00:00:00.000Z`;
}

function getInitialState(policy?: AttendancePolicy | null): PolicyFormState {
  if (!policy) return { ...INITIAL_STATE };
  return {
    name: policy.name,
    code: policy.code,
    description: policy.description ?? "",
    locationRequired: policy.locationRequired,
    maximumAcceptedAccuracyMeters: policy.maximumAcceptedAccuracyMeters,
    enforceGeofenceForOffice: policy.enforceGeofenceForOffice,
    enforceGeofenceForHybrid: policy.enforceGeofenceForHybrid,
    enforceGeofenceForField: policy.enforceGeofenceForField,
    enforceGeofenceForRemote: policy.enforceGeofenceForRemote,
    allowMultipleWorkSessions: policy.allowMultipleWorkSessions,
    allowReCheckInSameDay: policy.allowReCheckInSameDay,
    preventOverlappingSessions: policy.preventOverlappingSessions,
    missingCheckoutAction: policy.missingCheckoutAction,
    autoCloseAfterMinutes: policy.autoCloseAfterMinutes,
    maximumOpenSessionMinutes: policy.maximumOpenSessionMinutes,
    allowNextDayCheckInWithPendingPreviousDay:
      policy.allowNextDayCheckInWithPendingPreviousDay,
    regularizationEnabled: policy.regularizationEnabled,
    regularizationWindowDays: policy.regularizationWindowDays,
    requireRegularizationReason: policy.requireRegularizationReason,
    allowCheckInCorrection: policy.allowCheckInCorrection,
    allowCheckOutCorrection: policy.allowCheckOutCorrection,
    allowBreakCorrection: policy.allowBreakCorrection,
    fieldVisitEnabled: policy.fieldVisitEnabled,
    fieldVisitPurposeRequired: policy.fieldVisitPurposeRequired,
    fieldVisitOutcomeRequired: policy.fieldVisitOutcomeRequired,
    effectiveFrom: dateInputValue(policy.effectiveFrom),
    effectiveTo: dateInputValue(policy.effectiveTo),
    isDefault: policy.isDefault,
    status: policy.status,
  };
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400";

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
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

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <FormField label={label}>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${inputClassName} ${unit ? "pr-16" : ""}`}
        />
        {unit ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {unit}
          </span>
        ) : null}
      </div>
    </FormField>
  );
}

export function AttendancePolicyForm({
  companyId,
  policy,
  onClose,
  onSaved,
}: AttendancePolicyFormProps) {
  const [form, setForm] = useState<PolicyFormState>(() =>
    getInitialState(policy),
  );
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = Boolean(policy?._id);

  function updateField<K extends keyof PolicyFormState>(
    field: K,
    value: PolicyFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    if (form.name.trim().length < 2 || form.name.trim().length > 100) {
      toast.error("Policy name must be between 2 and 100 characters.");
      return false;
    }
    if (!/^[A-Za-z0-9_-]{2,50}$/.test(form.code.trim())) {
      toast.error(
        "Policy code must be 2–50 letters, numbers, underscores or hyphens.",
      );
      return false;
    }
    if (form.description.trim().length > 500) {
      toast.error("Description cannot exceed 500 characters.");
      return false;
    }
    if (!form.effectiveFrom) {
      toast.error("Effective-from date is required.");
      return false;
    }
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      toast.error(
        "Effective-to date cannot be earlier than effective-from date.",
      );
      return false;
    }
    const numericFields: Array<[string, number, number, number]> = [
      ["Maximum GPS accuracy", form.maximumAcceptedAccuracyMeters, 1, 5000],
      ["Auto-close delay", form.autoCloseAfterMinutes, 0, 1440],
      ["Maximum open session", form.maximumOpenSessionMinutes, 1, 2880],
      ["Regularization window", form.regularizationWindowDays, 0, 365],
    ];
    for (const [label, value, min, max] of numericFields) {
      if (!Number.isInteger(value) || value < min || value > max) {
        toast.error(
          `${label} must be a whole number between ${min} and ${max}.`,
        );
        return false;
      }
    }
    if (
      form.missingCheckoutAction === "AUTO_CLOSE" &&
      form.maximumOpenSessionMinutes < form.autoCloseAfterMinutes
    ) {
      toast.error(
        "Maximum open session must not be shorter than auto-close delay.",
      );
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !validateForm()) return;

    const payload: CreateAttendancePolicyPayload = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      effectiveFrom: toIsoDate(form.effectiveFrom),
      effectiveTo: form.effectiveTo ? toIsoDate(form.effectiveTo) : null,
    };

    try {
      setIsSaving(true);
      const saved =
        isEditMode && policy?._id
          ? await attendancePolicyService.update(companyId, policy._id, payload)
          : await attendancePolicyService.create(companyId, payload);
      toast.success(
        isEditMode
          ? "Attendance policy updated successfully."
          : "Attendance policy created successfully.",
      );
      onSaved(saved);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode
            ? "Unable to update attendance policy."
            : "Unable to create attendance policy.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-policy-form-title"
        className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="attendance-policy-form-title"
                className="text-xl font-bold text-slate-950"
              >
                {isEditMode
                  ? "Edit Attendance Policy"
                  : "Add Attendance Policy"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure GPS, attendance sessions, corrections and company-wide
                rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-8 p-5 sm:p-6">
            <section>
              <SectionTitle
                title="Policy details"
                description="Name the policy and control its default and active status."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Policy name" required>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="DES General Attendance Policy"
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="Policy code" required>
                  <input
                    required
                    minLength={2}
                    maxLength={50}
                    value={form.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    placeholder="DES_ATT_GENERAL"
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value as AttendancePolicyStatus,
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </FormField>
                <ToggleCard
                  label="Default policy"
                  description="Use this policy as the company's default. Selecting it replaces the previous default."
                  checked={form.isDefault}
                  onChange={(v) => updateField("isDefault", v)}
                />
                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      maxLength={500}
                      rows={3}
                      placeholder="Describe when this policy should be used..."
                      className={`${inputClassName} min-h-24 resize-y py-3`}
                    />
                  </FormField>
                </div>
              </div>
            </section>
            <section>
              <SectionTitle
                title="GPS and geofencing"
                description="Control location evidence and geofence enforcement by attendance mode."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Maximum accepted GPS accuracy"
                  value={form.maximumAcceptedAccuracyMeters}
                  onChange={(v) =>
                    updateField("maximumAcceptedAccuracyMeters", v)
                  }
                  min={1}
                  max={5000}
                  unit="metres"
                />
                <ToggleCard
                  label="GPS location required"
                  description="Require location evidence when recording attendance."
                  checked={form.locationRequired}
                  onChange={(v) => updateField("locationRequired", v)}
                />
                <ToggleCard
                  label="Office geofence"
                  description="Require office-mode employees to be within an approved attendance location."
                  checked={form.enforceGeofenceForOffice}
                  onChange={(v) => updateField("enforceGeofenceForOffice", v)}
                />
                <ToggleCard
                  label="Hybrid geofence"
                  description="Enforce geofencing for hybrid-mode attendance."
                  checked={form.enforceGeofenceForHybrid}
                  onChange={(v) => updateField("enforceGeofenceForHybrid", v)}
                />
                <ToggleCard
                  label="Field geofence"
                  description="Enforce geofencing for field-mode attendance."
                  checked={form.enforceGeofenceForField}
                  onChange={(v) => updateField("enforceGeofenceForField", v)}
                />
                <ToggleCard
                  label="Remote geofence"
                  description="Enforce geofencing for remote-mode attendance."
                  checked={form.enforceGeofenceForRemote}
                  onChange={(v) => updateField("enforceGeofenceForRemote", v)}
                />
              </div>
            </section>
            <section>
              <SectionTitle
                title="Work sessions"
                description="Control repeat check-ins and prevent overlapping work sessions."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ToggleCard
                  label="Multiple work sessions"
                  description="Allow more than one work session per day."
                  checked={form.allowMultipleWorkSessions}
                  onChange={(v) => updateField("allowMultipleWorkSessions", v)}
                />
                <ToggleCard
                  label="Re-check-in on the same day"
                  description="Allow employees to check in again after checking out."
                  checked={form.allowReCheckInSameDay}
                  onChange={(v) => updateField("allowReCheckInSameDay", v)}
                />
                <ToggleCard
                  label="Prevent overlapping sessions"
                  description="Reject work sessions that overlap existing ones."
                  checked={form.preventOverlappingSessions}
                  onChange={(v) => updateField("preventOverlappingSessions", v)}
                />
                <ToggleCard
                  label="Next-day check-in with pending checkout"
                  description="Allow a new day's check-in when the previous day's session is unresolved."
                  checked={form.allowNextDayCheckInWithPendingPreviousDay}
                  onChange={(v) =>
                    updateField("allowNextDayCheckInWithPendingPreviousDay", v)
                  }
                />
              </div>
            </section>
            <section>
              <SectionTitle
                title="Missing checkout"
                description="Choose how incomplete sessions are handled."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FormField label="Missing checkout action">
                  <select
                    value={form.missingCheckoutAction}
                    onChange={(e) =>
                      updateField(
                        "missingCheckoutAction",
                        e.target.value as AttendanceMissingCheckoutAction,
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="REQUIRE_REGULARIZATION">
                      Require regularization
                    </option>
                    <option value="FLAG_ONLY">Flag only</option>
                    <option value="AUTO_CLOSE">Auto-close</option>
                  </select>
                </FormField>
                <NumberField
                  label="Auto-close delay"
                  value={form.autoCloseAfterMinutes}
                  onChange={(v) => updateField("autoCloseAfterMinutes", v)}
                  min={0}
                  max={1440}
                  unit="min"
                />
                <NumberField
                  label="Maximum open session"
                  value={form.maximumOpenSessionMinutes}
                  onChange={(v) => updateField("maximumOpenSessionMinutes", v)}
                  min={1}
                  max={2880}
                  unit="min"
                />
              </div>
              {form.missingCheckoutAction !== "AUTO_CLOSE" ? (
                <p className="mt-2 text-xs text-slate-500">
                  Auto-close delay is only used when the auto-close action is
                  selected.
                </p>
              ) : null}
            </section>
            <section>
              <SectionTitle
                title="Attendance regularization"
                description="Set the correction window and permitted request types."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Regularization window"
                  value={form.regularizationWindowDays}
                  onChange={(v) => updateField("regularizationWindowDays", v)}
                  min={0}
                  max={365}
                  unit="days"
                />
                <ToggleCard
                  label="Enable regularization"
                  description="Allow attendance correction requests."
                  checked={form.regularizationEnabled}
                  onChange={(v) => updateField("regularizationEnabled", v)}
                />
                <ToggleCard
                  label="Require a reason"
                  description="Require employees to explain their correction requests."
                  checked={form.requireRegularizationReason}
                  onChange={(v) =>
                    updateField("requireRegularizationReason", v)
                  }
                />
                <ToggleCard
                  label="Check-in corrections"
                  description="Allow requests to correct check-in times."
                  checked={form.allowCheckInCorrection}
                  onChange={(v) => updateField("allowCheckInCorrection", v)}
                />
                <ToggleCard
                  label="Checkout corrections"
                  description="Allow requests to correct checkout times."
                  checked={form.allowCheckOutCorrection}
                  onChange={(v) => updateField("allowCheckOutCorrection", v)}
                />
                <ToggleCard
                  label="Break corrections"
                  description="Allow requests to correct recorded breaks."
                  checked={form.allowBreakCorrection}
                  onChange={(v) => updateField("allowBreakCorrection", v)}
                />
              </div>
            </section>
            <section>
              <SectionTitle
                title="Field visits"
                description="Configure field visit availability and reporting requirements."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ToggleCard
                  label="Enable field visits"
                  description="Allow eligible employees to record field visits."
                  checked={form.fieldVisitEnabled}
                  onChange={(v) => updateField("fieldVisitEnabled", v)}
                />
                <ToggleCard
                  label="Require visit purpose"
                  description="Require a purpose when recording a field visit."
                  checked={form.fieldVisitPurposeRequired}
                  onChange={(v) => updateField("fieldVisitPurposeRequired", v)}
                />
                <ToggleCard
                  label="Require visit outcome"
                  description="Require an outcome when completing a field visit."
                  checked={form.fieldVisitOutcomeRequired}
                  onChange={(v) => updateField("fieldVisitOutcomeRequired", v)}
                />
              </div>
            </section>
            <section>
              <SectionTitle
                title="Effective dates"
                description="The effective-from date is required; leave effective-to empty for an ongoing policy."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Effective from" required>
                  <input
                    type="date"
                    required
                    value={form.effectiveFrom}
                    onChange={(e) =>
                      updateField("effectiveFrom", e.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="Effective to">
                  <input
                    type="date"
                    min={form.effectiveFrom || undefined}
                    value={form.effectiveTo}
                    onChange={(e) => updateField("effectiveTo", e.target.value)}
                    className={inputClassName}
                  />
                </FormField>
              </div>
            </section>
          </div>
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
                  : "Add Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
