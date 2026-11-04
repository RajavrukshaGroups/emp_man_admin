"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  FileClock,
  Loader2,
  RefreshCcw,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { attendanceRegularizationService } from "@/features/attendance/services/attendance-regularization.service";

import type {
  AttendanceRegularization,
  UpdateAttendanceRegularizationPayload,
} from "@/features/attendance/types/attendance-regularization.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

type EditableField =
  | "requestedCheckInAt"
  | "requestedCheckOutAt"
  | "requestedBreakStartAt"
  | "requestedBreakEndAt"
  | "requestedBreakExtensionMinutes"
  | "reason"
  | "attachmentUrl";

type FormValues = Record<EditableField, string>;

const emptyForm: FormValues = {
  requestedCheckInAt: "",
  requestedCheckOutAt: "",
  requestedBreakStartAt: "",
  requestedBreakEndAt: "",
  requestedBreakExtensionMinutes: "",
  reason: "",
  attachmentUrl: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function toLocalDateTime(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFormValues(request: AttendanceRegularization): FormValues {
  return {
    requestedCheckInAt: toLocalDateTime(request.requestedCheckInAt),
    requestedCheckOutAt: toLocalDateTime(request.requestedCheckOutAt),
    requestedBreakStartAt: toLocalDateTime(request.requestedBreakStartAt),
    requestedBreakEndAt: toLocalDateTime(request.requestedBreakEndAt),
    requestedBreakExtensionMinutes:
      request.requestedBreakExtensionMinutes == null
        ? ""
        : String(request.requestedBreakExtensionMinutes),
    reason: request.reason ?? "",
    attachmentUrl: request.attachmentUrl ?? "",
  };
}

function getEditableTimeFields(
  request: AttendanceRegularization,
): Array<{ key: EditableField; label: string }> {
  switch (request.requestType) {
    case "MISSING_CHECK_IN":
      return [
        { key: "requestedCheckInAt", label: "Requested check-in" },
        { key: "requestedCheckOutAt", label: "Requested checkout" },
      ];

    case "MISSING_CHECKOUT":
    case "CHECKOUT_TIME_CORRECTION":
      return [{ key: "requestedCheckOutAt", label: "Requested checkout" }];

    case "CHECK_IN_TIME_CORRECTION":
      return [{ key: "requestedCheckInAt", label: "Requested check-in" }];

    case "BREAK_CORRECTION":
      return [
        { key: "requestedBreakStartAt", label: "Requested break start" },
        { key: "requestedBreakEndAt", label: "Requested break end" },
      ];

    default:
      return [];
  }
}

export default function EditAttendanceRegularizationPage() {
  const router = useRouter();
  const params = useParams<{ regularizationId: string }>();

  const regularizationId = params.regularizationId;

  const companyId = useAuthStore((state) => state.company?._id);
  const companyAccessId = useAuthStore((state) => state.companyAccess?._id);
  const permissions = useAuthStore((state) => state.permissions);

  const canRequest =
    Array.isArray(permissions) &&
    permissions.includes("attendance.correction_request");

  const [request, setRequest] = useState<AttendanceRegularization | null>(null);

  const [form, setForm] = useState<FormValues>(emptyForm);
  const [initialForm, setInitialForm] = useState<FormValues>(emptyForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasConflict, setHasConflict] = useState(false);

  const isOwnRequest = useMemo(() => {
    if (!request || !companyAccessId) return false;

    const ownerId =
      typeof request.companyAccessId === "string"
        ? request.companyAccessId
        : request.companyAccessId?._id;

    return ownerId === companyAccessId;
  }, [request, companyAccessId]);

  const canEdit =
    Boolean(request) &&
    canRequest &&
    isOwnRequest &&
    request?.status === "PENDING" &&
    !hasConflict;

  const timeFields = useMemo(
    () => (request ? getEditableTimeFields(request) : []),
    [request],
  );

  const loadRequest = useCallback(async () => {
    if (!companyId || !regularizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError("");

      const result = await attendanceRegularizationService.getById(
        companyId,
        regularizationId,
      );

      const values = getFormValues(result);

      setRequest(result);
      setForm(values);
      setInitialForm(values);
      setHasConflict(false);
    } catch (error) {
      setRequest(null);
      setLoadError(
        getApiErrorMessage(
          error,
          "Unable to load attendance regularization request.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId, regularizationId]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  function updateField(key: EditableField, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function buildPayload(): UpdateAttendanceRegularizationPayload | null {
    if (!request) return null;

    const payload: UpdateAttendanceRegularizationPayload = {
      expectedRevision: request.editRevision ?? 0,
    };

    const relevantFields: EditableField[] = [
      ...timeFields.map((field) => field.key),
      "reason",
      "attachmentUrl",
    ];

    if (request.requestType === "BREAK_EXTENSION") {
      relevantFields.push("requestedBreakExtensionMinutes");
    }

    for (const key of relevantFields) {
      if (form[key] === initialForm[key]) continue;

      if (key === "requestedBreakExtensionMinutes") {
        if (form[key] !== "") {
          payload.requestedBreakExtensionMinutes = Number(form[key]);
        }
      } else if (
        key === "requestedCheckInAt" ||
        key === "requestedCheckOutAt" ||
        key === "requestedBreakStartAt" ||
        key === "requestedBreakEndAt"
      ) {
        if (form[key]) {
          payload[key] = new Date(form[key]).toISOString();
        }
      } else if (key === "reason") {
        payload.reason = form.reason.trim();
      } else if (key === "attachmentUrl") {
        payload.attachmentUrl = form.attachmentUrl.trim();
      }
    }

    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId || !request || !canEdit) return;

    if (form.reason.trim().length < 3) {
      toast.error("Please enter a reason with at least 3 characters.");
      return;
    }

    if (form.reason.trim().length > 1500) {
      toast.error("Reason cannot exceed 1500 characters.");
      return;
    }

    for (const field of timeFields) {
      if (!form[field.key]) {
        toast.error(`${field.label} is required.`);
        return;
      }
    }

    if (request.requestType === "MISSING_CHECK_IN") {
      if (
        new Date(form.requestedCheckOutAt) <= new Date(form.requestedCheckInAt)
      ) {
        toast.error("Checkout must be later than check-in.");
        return;
      }
    }

    if (request.requestType === "BREAK_CORRECTION") {
      if (
        new Date(form.requestedBreakEndAt) <=
        new Date(form.requestedBreakStartAt)
      ) {
        toast.error("Break end must be later than break start.");
        return;
      }
    }

    if (request.requestType === "BREAK_EXTENSION") {
      const minutes = Number(form.requestedBreakExtensionMinutes);

      if (
        !form.requestedBreakExtensionMinutes ||
        !Number.isInteger(minutes) ||
        minutes <= 0 ||
        minutes > 720
      ) {
        toast.error("Enter valid extension minutes between 1 and 720.");
        return;
      }
    }

    const payload = buildPayload();

    if (!payload || Object.keys(payload).length === 1) {
      toast.error("Please change at least one field before saving.");
      return;
    }

    try {
      setIsSubmitting(true);

      await attendanceRegularizationService.update(
        companyId,
        request._id,
        payload,
      );

      toast.success("Regularization request updated successfully.");

      router.push("/attendance/regularizations");
      router.refresh();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;

      if (status === 409) {
        setHasConflict(true);
        toast.error(
          "This request has changed or is no longer pending. Reload the latest version before editing.",
        );
      } else {
        toast.error(
          getApiErrorMessage(error, "Unable to update regularization request."),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading regularization request...
      </div>
    );
  }

  if (loadError || !request) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <h1 className="font-semibold">Unable to open request</h1>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          {loadError || "Request not found."}
        </p>

        <Link
          href="/attendance/regularizations"
          className="mt-5 inline-flex text-sm font-semibold text-blue-700"
        >
          Back to regularizations
        </Link>
      </div>
    );
  }

  if (!canRequest || !isOwnRequest || request.status !== "PENDING") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-6">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          <h1 className="font-semibold">Editing unavailable</h1>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Only your own pending regularization requests can be edited. Requests
          already reviewed or processed are read-only.
        </p>

        <Link
          href="/attendance/regularizations"
          className="mt-5 inline-flex text-sm font-semibold text-blue-700"
        >
          Back to regularizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/attendance/regularizations"
          className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Edit Regularization Request
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update your pending attendance correction before it is reviewed.
          </p>
        </div>
      </div>

      {hasConflict && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-amber-900">
            This request may have changed. Reload the latest version to continue
            editing.
          </p>

          <button
            type="button"
            onClick={() => void loadRequest()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Reload Request
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <FileClock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">Request information</h2>
            <p className="text-sm text-slate-500">
              These details cannot be changed after submission.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyField
            label="Correction type"
            value={formatEnum(request.requestType)}
          />
          <ReadOnlyField
            label="Attendance date"
            value={formatDate(request.attendanceDate)}
          />
          <ReadOnlyField label="Status" value={formatEnum(request.status)} />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting || hasConflict}>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">Correction details</h2>
                <p className="text-sm text-slate-500">
                  Update the information that needs correction.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {timeFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {field.label}
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="datetime-local"
                    value={form[field.key]}
                    onChange={(event) =>
                      updateField(field.key, event.target.value)
                    }
                    className={inputClassName}
                    required
                  />
                </div>
              ))}

              {request.requestType === "BREAK_EXTENSION" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Extension minutes
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={720}
                    step={1}
                    value={form.requestedBreakExtensionMinutes}
                    onChange={(event) =>
                      updateField(
                        "requestedBreakExtensionMinutes",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    required
                  />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Reason & supporting information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  value={form.reason}
                  onChange={(event) =>
                    updateField("reason", event.target.value)
                  }
                  rows={5}
                  maxLength={1500}
                  className={`${inputClassName} h-auto resize-y py-3`}
                  required
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.reason.length}/1500
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Supporting document URL
                </label>

                <input
                  type="text"
                  value={form.attachmentUrl}
                  onChange={(event) =>
                    updateField("attachmentUrl", event.target.value)
                  }
                  maxLength={1000}
                  className={inputClassName}
                  placeholder="Optional document or image URL"
                />
              </div>
            </div>
          </section>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/attendance/regularizations"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || hasConflict}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? (
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
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
