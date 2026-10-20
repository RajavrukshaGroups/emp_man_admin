"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AttendancePolicyForm } from "@/features/attendance/components/policies/attendance-policy-form";
import { attendancePolicyService } from "@/features/attendance/services/attendance-policy.service";
import type {
  AttendancePolicy,
  AttendancePolicyListResponse,
  AttendancePolicyStatus,
} from "@/features/attendance/types/attendance-policy.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export default function AttendancePoliciesPage() {
  const router = useRouter();
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead =
    permissions.includes("attendance.policy_read") ||
    permissions.includes("attendance.policy_update");
  const canManage = permissions.includes("attendance.policy_update");

  const [data, setData] = useState<AttendancePolicyListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AttendancePolicyStatus | "ALL">("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(
    null,
  );

  useEffect(() => {
    if (!canRead) router.replace("/attendance");
  }, [canRead, router]);

  const loadPolicies = useCallback(
    async (background = false) => {
      if (!company?._id || !canRead) {
        setIsLoading(false);
        return;
      }

      try {
        if (!background) {
          setIsLoading(true);
        }

        const result = await attendancePolicyService.list(company._id, {
          page: 1,
          limit: 50,
          search: search.trim() || undefined,
          status: status === "ALL" ? undefined : status,
        });

        setData(result);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Unable to load attendance policies."),
        );
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [company, canRead, search, status],
  );

  useEffect(() => {
    async function loadInitialPolicies() {
      await loadPolicies();
    }

    void loadInitialPolicies();
  }, [loadPolicies]);

  /**
   * Refresh attendance policies when returning to the browser tab.
   * Preserve filters and any open Add/Edit forms.
   */
  useEffect(() => {
    if (!company?._id || !canRead) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadPolicies(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [company?._id, canRead, loadPolicies]);

  const activeCount = useMemo(
    () => data?.items.filter((item) => item.status === "ACTIVE").length ?? 0,
    [data],
  );
  const defaultPolicy = useMemo(
    () =>
      data?.items.find((item) => item.isDefault && item.status === "ACTIVE"),
    [data],
  );

  if (!canRead) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Attendance Policies
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Configure GPS, geofencing, work sessions, missing checkout rules
              and regularization.
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Add Policy
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total policies"
          value={String(data?.pagination.total ?? 0)}
        />
        <SummaryCard
          label="Active policies (this page)"
          value={String(activeCount)}
        />
        <SummaryCard
          label="Active default (this page)"
          value={defaultPolicy?.name ?? "Not found"}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search policies..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AttendancePolicyStatus | "ALL")
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => void loadPolicies()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-4 text-base font-semibold text-slate-950">
            No attendance policies found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {canManage
              ? "Add an active default policy to enable company attendance rules."
              : "No policies match your filters."}
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((policy) => (
            <PolicyCard
              key={policy._id}
              policy={policy}
              canManage={canManage}
              onEdit={setEditingPolicy}
            />
          ))}
        </div>
      )}

      {canManage && isAddOpen && company?._id && (
        <AttendancePolicyForm
          companyId={company._id}
          onClose={() => setIsAddOpen(false)}
          onSaved={() => {
            setIsAddOpen(false);
            void loadPolicies();
          }}
        />
      )}
      {canManage && editingPolicy && company?._id && (
        <AttendancePolicyForm
          key={editingPolicy._id}
          companyId={company._id}
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSaved={() => {
            setEditingPolicy(null);
            void loadPolicies();
          }}
        />
      )}
    </div>
  );
}

function PolicyCard({
  policy,
  canManage,
  onEdit,
}: {
  policy: AttendancePolicy;
  canManage: boolean;
  onEdit: (policy: AttendancePolicy) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-950">
              {policy.name}
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${policy.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {policy.status}
            </span>
            {policy.isDefault && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {policy.code}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => onEdit(policy)}
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </button>
        )}
      </div>
      {policy.description && (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {policy.description}
        </p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoItem
          label="GPS required"
          value={policy.locationRequired ? "Yes" : "No"}
        />
        <InfoItem
          label="Max GPS inaccuracy"
          value={`${policy.maximumAcceptedAccuracyMeters} m`}
        />
        <InfoItem
          label="Office geofence"
          value={policy.enforceGeofenceForOffice ? "Enforced" : "Not enforced"}
        />
        <InfoItem
          label="Work sessions"
          value={policy.allowMultipleWorkSessions ? "Multiple" : "Single"}
        />
        <InfoItem
          label="Missing checkout"
          value={policy.missingCheckoutAction.replaceAll("_", " ")}
        />
        <InfoItem
          label="Regularization"
          value={
            policy.regularizationEnabled
              ? `${policy.regularizationWindowDays} days`
              : "Disabled"
          }
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="Effective from"
          value={formatDate(policy.effectiveFrom)}
        />
        <InfoItem
          label="Effective to"
          value={
            policy.effectiveTo ? formatDate(policy.effectiveTo) : "No end date"
          }
        />
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
