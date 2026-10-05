"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  leavePolicyService,
  type CreateLeavePolicyPayload,
  type UpdateLeavePolicyPayload,
} from "@/features/leave/services/leave-policy.service";

import type {
  LeaveApprovalWorkflow,
  LeavePolicy,
  LeaveProrationRounding,
  LeaveSandwichRule,
  LeaveStatus,
} from "@/features/leave/types/leave.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

/* =========================================================
   PAGE
   ========================================================= */

export default function LeavePoliciesPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("leave.policy_read");
  const canManage = permissions.includes("leave.policy_manage");

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeaveStatus | "ALL">("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [form, setForm] = useState<LeavePolicyFormState>(
    getInitialPolicyForm(),
  );

  /* =========================================================
     LOAD POLICIES
     ========================================================= */

  const loadPolicies = useCallback(async () => {
    if (!company?._id || !canRead) {
      setPolicies([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await leavePolicyService.list(company._id, {
        page: 1,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status !== "ALL" ? { status } : {}),
        sortBy: "name",
        sortOrder: "asc",
      });

      setPolicies(result.items);
    } catch (error) {
      setPolicies([]);

      toast.error(
        getApiErrorMessage(error, "Unable to load company leave policies."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, canRead, search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPolicies();
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadPolicies]);

  /* =========================================================
     FORM HELPERS
     ========================================================= */

  function updateForm<K extends keyof LeavePolicyFormState>(
    field: K,
    value: LeavePolicyFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    if (!canManage) {
      return;
    }

    setEditingPolicy(null);
    setForm(getInitialPolicyForm());
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }

    setIsCreateOpen(false);
    setForm(getInitialPolicyForm());
  }

  function openEditModal(policy: LeavePolicy) {
    if (!canManage) {
      return;
    }

    setForm({
      name: policy.name,
      code: policy.code,
      description: policy.description ?? "",

      leaveYearStartMonth: String(policy.leaveYearStartMonth),
      leaveYearStartDay: String(policy.leaveYearStartDay),

      excludeWeeklyOffsFromLeaveDays: policy.excludeWeeklyOffsFromLeaveDays,

      excludePublicHolidaysFromLeaveDays:
        policy.excludePublicHolidaysFromLeaveDays,

      sandwichRule: policy.sandwichRule,

      approvalWorkflow: policy.approvalWorkflow,
      allowApprovalWithoutRecommendation:
        policy.allowApprovalWithoutRecommendation,

      preventOverlappingRequests: policy.preventOverlappingRequests,
      preventAttendanceConflict: policy.preventAttendanceConflict,

      maximumFutureApplicationDays:
        policy.maximumFutureApplicationDays === null
          ? ""
          : String(policy.maximumFutureApplicationDays),

      requireReason: policy.requireReason,

      autoCreateLeaveBalances: policy.autoCreateLeaveBalances,
      reserveBalanceOnSubmission: policy.reserveBalanceOnSubmission,

      prorateEntitlementForNewJoiners: policy.prorateEntitlementForNewJoiners,

      prorationRounding: policy.prorationRounding,

      allowEmployeeCancelPending: policy.allowEmployeeCancelPending,
      allowEmployeeCancelRecommended: policy.allowEmployeeCancelRecommended,

      allowApprovedLeaveCancellation: policy.allowApprovedLeaveCancellation,

      approvedCancellationRequiresApproval:
        policy.approvedCancellationRequiresApproval,

      effectiveFrom: policy.effectiveFrom.slice(0, 10),

      effectiveTo: policy.effectiveTo ? policy.effectiveTo.slice(0, 10) : "",

      isDefault: policy.isDefault,
      status: policy.status,
    });

    setEditingPolicy(policy);
  }

  function closeEditModal() {
    if (isUpdating) {
      return;
    }

    setEditingPolicy(null);
    setForm(getInitialPolicyForm());
  }

  function closePolicyModal() {
    if (editingPolicy) {
      closeEditModal();
      return;
    }

    closeCreateModal();
  }

  /* =========================================================
     VALIDATION
     ========================================================= */

  function validateForm() {
    if (!form.name.trim()) {
      toast.error("Leave policy name is required.");
      return false;
    }

    if (!form.code.trim()) {
      toast.error("Leave policy code is required.");
      return false;
    }

    if (!form.effectiveFrom) {
      toast.error("Effective from date is required.");
      return false;
    }

    const month = Number(form.leaveYearStartMonth);
    const day = Number(form.leaveYearStartDay);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      toast.error("Leave year start month must be between 1 and 12.");
      return false;
    }

    if (!Number.isInteger(day) || day < 1 || day > 28) {
      toast.error("Leave year start day must be between 1 and 28.");
      return false;
    }

    if (
      form.maximumFutureApplicationDays.trim() !== "" &&
      Number(form.maximumFutureApplicationDays) < 0
    ) {
      toast.error("Maximum future application days cannot be negative.");
      return false;
    }

    if (
      form.effectiveTo &&
      new Date(form.effectiveTo) < new Date(form.effectiveFrom)
    ) {
      toast.error("Effective to date cannot be before effective from date.");
      return false;
    }

    return true;
  }

  /* =========================================================
     PAYLOAD
     ========================================================= */

  function buildPayload(): CreateLeavePolicyPayload {
    return {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),

      ...(form.description.trim()
        ? { description: form.description.trim() }
        : {}),

      leaveYearStartMonth: Number(form.leaveYearStartMonth),
      leaveYearStartDay: Number(form.leaveYearStartDay),

      excludeWeeklyOffsFromLeaveDays: form.excludeWeeklyOffsFromLeaveDays,

      excludePublicHolidaysFromLeaveDays:
        form.excludePublicHolidaysFromLeaveDays,

      sandwichRule: form.sandwichRule,

      approvalWorkflow: form.approvalWorkflow,

      allowApprovalWithoutRecommendation:
        form.approvalWorkflow === "DIRECT_APPROVAL"
          ? true
          : form.allowApprovalWithoutRecommendation,

      preventOverlappingRequests: form.preventOverlappingRequests,
      preventAttendanceConflict: form.preventAttendanceConflict,

      maximumFutureApplicationDays:
        form.maximumFutureApplicationDays.trim() === ""
          ? null
          : Number(form.maximumFutureApplicationDays),

      requireReason: form.requireReason,

      autoCreateLeaveBalances: form.autoCreateLeaveBalances,
      reserveBalanceOnSubmission: form.reserveBalanceOnSubmission,

      prorateEntitlementForNewJoiners: form.prorateEntitlementForNewJoiners,

      prorationRounding: form.prorationRounding,

      allowEmployeeCancelPending: form.allowEmployeeCancelPending,

      allowEmployeeCancelRecommended: form.allowEmployeeCancelRecommended,

      allowApprovedLeaveCancellation: form.allowApprovedLeaveCancellation,

      approvedCancellationRequiresApproval: form.allowApprovedLeaveCancellation
        ? form.approvedCancellationRequiresApproval
        : true,

      effectiveFrom: form.effectiveFrom,

      effectiveTo: form.effectiveTo || null,

      isDefault: form.isDefault,

      status: form.status,
    };
  }

  /* =========================================================
     CREATE
     ========================================================= */

  async function handleCreatePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id || !canManage) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);

      await leavePolicyService.create(company._id, buildPayload());

      toast.success("Leave policy created successfully.");

      setIsCreateOpen(false);
      setForm(getInitialPolicyForm());

      await loadPolicies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create leave policy."));
    } finally {
      setIsCreating(false);
    }
  }

  /* =========================================================
     UPDATE
     ========================================================= */

  async function handleUpdatePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id || !editingPolicy || !canManage) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);

      const payload: UpdateLeavePolicyPayload = buildPayload();

      /*
       * Backend intentionally prevents directly unsetting the
       * current default policy.
       */
      if (editingPolicy.isDefault) {
        delete payload.isDefault;
      }

      await leavePolicyService.update(company._id, editingPolicy._id, payload);

      toast.success("Leave policy updated successfully.");

      setEditingPolicy(null);
      setForm(getInitialPolicyForm());

      await loadPolicies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update leave policy."));
    } finally {
      setIsUpdating(false);
    }
  }

  /* =========================================================
     PERMISSION
     ========================================================= */

  if (!canRead) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Leave policies unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view company leave policies.
          </p>
        </section>
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  const defaultPolicy = policies.find((policy) => policy.isDefault) ?? null;

  const activeCount = policies.filter(
    (policy) => policy.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadPolicies()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Leave Policy
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Policies" value={String(policies.length)} />

        <SummaryCard title="Active" value={String(activeCount)} />

        <SummaryCard
          title="Default Policy"
          value={defaultPolicy?.name ?? "Not configured"}
        />
      </div>

      {/* FILTERS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leave policy..."
              className={`${inputClassName} pl-9`}
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LeaveStatus | "ALL")
            }
            className={inputClassName}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </section>

      {/* LIST */}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm text-slate-500">
            Loading leave policies...
          </p>
        </section>
      ) : policies.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No leave policies found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {canManage
              ? "Create the company's first leave policy to configure leave-year and workflow rules."
              : "No leave policies are currently available for this company."}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-950">Company Leave Policies</h2>

            <p className="mt-1 text-sm text-slate-500">
              {canManage
                ? "Review and configure company-wide leave rules."
                : "Review the leave policies configured for your company."}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {policies.map((policy) => (
              <PolicyRow
                key={policy._id}
                policy={policy}
                canManage={canManage}
                onEdit={openEditModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* MODAL */}

      {(isCreateOpen || editingPolicy) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-32px)]">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingPolicy ? "Edit Leave Policy" : "Create Leave Policy"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingPolicy
                    ? `Update the configuration for ${editingPolicy.name}.`
                    : "Configure leave-year, workflow and balance rules."}
                </p>
              </div>

              <button
                type="button"
                onClick={closePolicyModal}
                disabled={isSaving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close leave policy modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-8 p-4 sm:p-6">
                  {/* BASIC */}

                  <FormSection
                    title="Basic information"
                    description="Identify this company leave policy."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Name" required>
                        <input
                          value={form.name}
                          onChange={(event) =>
                            updateForm("name", event.target.value)
                          }
                          placeholder="Example: Standard Leave Policy"
                          className={inputClassName}
                          disabled={isSaving}
                        />
                      </FormField>

                      <FormField label="Code" required>
                        <input
                          value={form.code}
                          onChange={(event) =>
                            updateForm("code", event.target.value.toUpperCase())
                          }
                          placeholder="Example: STANDARD"
                          className={inputClassName}
                          disabled={isSaving}
                        />
                      </FormField>
                    </div>

                    <FormField label="Description">
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        placeholder="Describe this leave policy."
                        className={textareaClassName}
                        disabled={isSaving}
                      />
                    </FormField>

                    <FormField label="Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm(
                            "status",
                            event.target.value as LeaveStatus,
                          )
                        }
                        className={inputClassName}
                        disabled={isSaving}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </FormField>

                    <ToggleField
                      label="Default policy"
                      description={
                        editingPolicy?.isDefault
                          ? "This is the current default policy. To replace it, set another policy as default."
                          : "Use this policy as the company's default leave policy."
                      }
                      checked={form.isDefault}
                      onChange={(value) => updateForm("isDefault", value)}
                      disabled={isSaving || Boolean(editingPolicy?.isDefault)}
                    />
                  </FormSection>

                  {/* LEAVE YEAR */}

                  <FormSection
                    title="Leave year"
                    description="Configure when the company's leave year begins and when this policy is effective."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Start month" required>
                        <select
                          value={form.leaveYearStartMonth}
                          onChange={(event) =>
                            updateForm(
                              "leaveYearStartMonth",
                              event.target.value,
                            )
                          }
                          className={inputClassName}
                          disabled={isSaving}
                        >
                          {MONTHS.map((month, index) => (
                            <option key={month} value={String(index + 1)}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField
                        label="Start day"
                        hint="Supported values are 1 to 28."
                        required
                      >
                        <input
                          type="number"
                          min="1"
                          max="28"
                          step="1"
                          value={form.leaveYearStartDay}
                          onChange={(event) =>
                            updateForm("leaveYearStartDay", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isSaving}
                        />
                      </FormField>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Effective from" required>
                        <input
                          type="date"
                          value={form.effectiveFrom}
                          onChange={(event) =>
                            updateForm("effectiveFrom", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isSaving}
                        />
                      </FormField>

                      <FormField
                        label="Effective to"
                        hint="Leave blank if there is no end date."
                      >
                        <input
                          type="date"
                          value={form.effectiveTo}
                          onChange={(event) =>
                            updateForm("effectiveTo", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isSaving}
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* DAY CALCULATION */}

                  <FormSection
                    title="Leave day calculation"
                    description="Configure how weekly offs and holidays affect leave duration."
                  >
                    <ToggleField
                      label="Exclude weekly offs"
                      description="Weekly offs falling within the request are excluded from leave days."
                      checked={form.excludeWeeklyOffsFromLeaveDays}
                      onChange={(value) =>
                        updateForm("excludeWeeklyOffsFromLeaveDays", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Exclude public holidays"
                      description="Public holidays falling within the request are excluded from leave days."
                      checked={form.excludePublicHolidaysFromLeaveDays}
                      onChange={(value) =>
                        updateForm("excludePublicHolidaysFromLeaveDays", value)
                      }
                      disabled={isSaving}
                    />

                    <FormField label="Sandwich rule">
                      <select
                        value={form.sandwichRule}
                        onChange={(event) =>
                          updateForm(
                            "sandwichRule",
                            event.target.value as LeaveSandwichRule,
                          )
                        }
                        className={inputClassName}
                        disabled={isSaving}
                      >
                        <option value="NONE">
                          Do not count intervening non-working days
                        </option>

                        <option value="COUNT_INTERVENING_NON_WORKING_DAYS">
                          Count intervening non-working days
                        </option>
                      </select>
                    </FormField>
                  </FormSection>

                  {/* WORKFLOW */}

                  <FormSection
                    title="Approval workflow"
                    description="Configure how submitted leave requests move through approval."
                  >
                    <FormField label="Workflow">
                      <select
                        value={form.approvalWorkflow}
                        onChange={(event) => {
                          const value = event.target
                            .value as LeaveApprovalWorkflow;

                          updateForm("approvalWorkflow", value);

                          if (value === "DIRECT_APPROVAL") {
                            updateForm(
                              "allowApprovalWithoutRecommendation",
                              true,
                            );
                          }
                        }}
                        className={inputClassName}
                        disabled={isSaving}
                      >
                        <option value="RECOMMEND_THEN_APPROVE">
                          Recommend then approve
                        </option>

                        <option value="DIRECT_APPROVAL">Direct approval</option>
                      </select>
                    </FormField>

                    <ToggleField
                      label="Allow approval without recommendation"
                      description={
                        form.approvalWorkflow === "DIRECT_APPROVAL"
                          ? "Direct approval requires this setting."
                          : "An authorized approver may approve a pending request without a recommendation."
                      }
                      checked={form.allowApprovalWithoutRecommendation}
                      onChange={(value) =>
                        updateForm("allowApprovalWithoutRecommendation", value)
                      }
                      disabled={
                        isSaving || form.approvalWorkflow === "DIRECT_APPROVAL"
                      }
                    />
                  </FormSection>

                  {/* APPLICATION */}

                  <FormSection
                    title="Application rules"
                    description="Configure validation rules when employees submit leave requests."
                  >
                    <ToggleField
                      label="Prevent overlapping requests"
                      description="Block employees from submitting overlapping leave requests."
                      checked={form.preventOverlappingRequests}
                      onChange={(value) =>
                        updateForm("preventOverlappingRequests", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Prevent attendance conflicts"
                      description="Prevent leave requests that conflict with attendance records."
                      checked={form.preventAttendanceConflict}
                      onChange={(value) =>
                        updateForm("preventAttendanceConflict", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Require reason"
                      description="Employees must provide a reason when applying for leave."
                      checked={form.requireReason}
                      onChange={(value) => updateForm("requireReason", value)}
                      disabled={isSaving}
                    />

                    <FormField
                      label="Maximum future application days"
                      hint="Leave blank for no future application limit."
                    >
                      <input
                        type="number"
                        min="0"
                        max="1095"
                        step="1"
                        value={form.maximumFutureApplicationDays}
                        onChange={(event) =>
                          updateForm(
                            "maximumFutureApplicationDays",
                            event.target.value,
                          )
                        }
                        placeholder="No limit"
                        className={inputClassName}
                        disabled={isSaving}
                      />
                    </FormField>
                  </FormSection>

                  {/* BALANCE */}

                  <FormSection
                    title="Balance rules"
                    description="Configure balance creation, reservation and new-joiner entitlement."
                  >
                    <ToggleField
                      label="Auto-create leave balances"
                      description="Automatically create applicable employee leave balances."
                      checked={form.autoCreateLeaveBalances}
                      onChange={(value) =>
                        updateForm("autoCreateLeaveBalances", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Reserve balance on submission"
                      description="Reserve applicable paid leave when a request is submitted."
                      checked={form.reserveBalanceOnSubmission}
                      onChange={(value) =>
                        updateForm("reserveBalanceOnSubmission", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Prorate new joiner entitlement"
                      description="Prorate entitlement when an employee joins during the leave year."
                      checked={form.prorateEntitlementForNewJoiners}
                      onChange={(value) =>
                        updateForm("prorateEntitlementForNewJoiners", value)
                      }
                      disabled={isSaving}
                    />

                    {form.prorateEntitlementForNewJoiners && (
                      <FormField label="Proration rounding">
                        <select
                          value={form.prorationRounding}
                          onChange={(event) =>
                            updateForm(
                              "prorationRounding",
                              event.target.value as LeaveProrationRounding,
                            )
                          }
                          className={inputClassName}
                          disabled={isSaving}
                        >
                          <option value="DOWN_TO_HALF">
                            Round down to half day
                          </option>

                          <option value="NEAREST_HALF">
                            Round to nearest half day
                          </option>

                          <option value="UP_TO_HALF">
                            Round up to half day
                          </option>
                        </select>
                      </FormField>
                    )}
                  </FormSection>

                  {/* CANCELLATION */}

                  <FormSection
                    title="Cancellation rules"
                    description="Configure when employees may cancel or request cancellation of leave."
                  >
                    <ToggleField
                      label="Allow employee cancellation while pending"
                      description="Employees may cancel their own pending leave requests."
                      checked={form.allowEmployeeCancelPending}
                      onChange={(value) =>
                        updateForm("allowEmployeeCancelPending", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Allow employee cancellation after recommendation"
                      description="Employees may cancel requests after they have been recommended."
                      checked={form.allowEmployeeCancelRecommended}
                      onChange={(value) =>
                        updateForm("allowEmployeeCancelRecommended", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Allow approved leave cancellation"
                      description="Allow cancellation requests for already-approved leave."
                      checked={form.allowApprovedLeaveCancellation}
                      onChange={(value) =>
                        updateForm("allowApprovedLeaveCancellation", value)
                      }
                      disabled={isSaving}
                    />

                    <ToggleField
                      label="Approved cancellation requires approval"
                      description={
                        form.allowApprovedLeaveCancellation
                          ? "An approved leave cancellation must itself be reviewed."
                          : "This remains enforced while approved leave cancellation is disabled."
                      }
                      checked={form.approvedCancellationRequiresApproval}
                      onChange={(value) =>
                        updateForm(
                          "approvedCancellationRequiresApproval",
                          value,
                        )
                      }
                      disabled={
                        isSaving || !form.allowApprovedLeaveCancellation
                      }
                    />
                  </FormSection>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closePolicyModal}
                  disabled={isSaving}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}

                  {editingPolicy ? "Save Changes" : "Create Leave Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   POLICY ROW
   ========================================================= */

function PolicyRow({
  policy,
  canManage,
  onEdit,
}: {
  policy: LeavePolicy;
  canManage: boolean;
  onEdit: (policy: LeavePolicy) => void;
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-950">
              {policy.name}
            </h3>

            <StatusBadge status={policy.status} />

            {policy.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <Star className="h-3 w-3" />
                Default
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">{policy.code}</p>

          {policy.description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {policy.description}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RuleCard
              label="Leave year"
              value={formatLeaveYearStart(
                policy.leaveYearStartMonth,
                policy.leaveYearStartDay,
              )}
            />

            <RuleCard
              label="Workflow"
              value={formatEnum(policy.approvalWorkflow)}
            />

            <RuleCard
              label="Future limit"
              value={
                policy.maximumFutureApplicationDays === null
                  ? "No limit"
                  : `${policy.maximumFutureApplicationDays} days`
              }
            />

            <RuleCard
              label="Effective from"
              value={formatDate(policy.effectiveFrom)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RulePill>
              {policy.excludeWeeklyOffsFromLeaveDays
                ? "Weekly offs excluded"
                : "Weekly offs counted"}
            </RulePill>

            <RulePill>
              {policy.excludePublicHolidaysFromLeaveDays
                ? "Holidays excluded"
                : "Holidays counted"}
            </RulePill>

            <RulePill>
              {policy.reserveBalanceOnSubmission
                ? "Balance reserved on submission"
                : "No submission reservation"}
            </RulePill>

            {policy.prorateEntitlementForNewJoiners && (
              <RulePill>New joiner proration</RulePill>
            )}

            {policy.preventOverlappingRequests && (
              <RulePill>Overlap prevention</RulePill>
            )}
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => onEdit(policy)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function PageHeader() {
  return (
    <div className="flex items-start gap-3">
      <Link
        href="/leave"
        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Leave Policies
          </h1>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Configure leave-year, workflow, balance and cancellation rules.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function RuleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RulePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FormField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 shrink-0 accent-slate-950"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {formatEnum(status)}
    </span>
  );
}

/* =========================================================
   FORM STATE
   ========================================================= */

interface LeavePolicyFormState {
  name: string;
  code: string;
  description: string;

  leaveYearStartMonth: string;
  leaveYearStartDay: string;

  excludeWeeklyOffsFromLeaveDays: boolean;
  excludePublicHolidaysFromLeaveDays: boolean;

  sandwichRule: LeaveSandwichRule;

  approvalWorkflow: LeaveApprovalWorkflow;
  allowApprovalWithoutRecommendation: boolean;

  preventOverlappingRequests: boolean;
  preventAttendanceConflict: boolean;

  maximumFutureApplicationDays: string;

  requireReason: boolean;

  autoCreateLeaveBalances: boolean;
  reserveBalanceOnSubmission: boolean;

  prorateEntitlementForNewJoiners: boolean;
  prorationRounding: LeaveProrationRounding;

  allowEmployeeCancelPending: boolean;
  allowEmployeeCancelRecommended: boolean;

  allowApprovedLeaveCancellation: boolean;
  approvedCancellationRequiresApproval: boolean;

  effectiveFrom: string;
  effectiveTo: string;

  isDefault: boolean;

  status: LeaveStatus;
}

/* =========================================================
   DEFAULT FORM
   ========================================================= */

function getInitialPolicyForm(): LeavePolicyFormState {
  return {
    name: "",
    code: "",
    description: "",

    leaveYearStartMonth: "1",
    leaveYearStartDay: "1",

    excludeWeeklyOffsFromLeaveDays: true,
    excludePublicHolidaysFromLeaveDays: true,

    sandwichRule: "NONE",

    approvalWorkflow: "RECOMMEND_THEN_APPROVE",
    allowApprovalWithoutRecommendation: true,

    preventOverlappingRequests: true,
    preventAttendanceConflict: true,

    maximumFutureApplicationDays: "",

    requireReason: true,

    autoCreateLeaveBalances: true,
    reserveBalanceOnSubmission: true,

    prorateEntitlementForNewJoiners: true,
    prorationRounding: "NEAREST_HALF",

    allowEmployeeCancelPending: true,
    allowEmployeeCancelRecommended: true,

    allowApprovedLeaveCancellation: false,
    approvedCancellationRequiresApproval: true,

    effectiveFrom: getTodayDateInputValue(),
    effectiveTo: "",

    isDefault: false,

    status: "ACTIVE",
  };
}

/* =========================================================
   HELPERS
   ========================================================= */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getTodayDateInputValue() {
  const now = new Date();

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}

function formatLeaveYearStart(month: number, day: number) {
  const monthName = MONTHS[month - 1] ?? `Month ${month}`;
  return `${monthName} ${day}`;
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatEnum(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";

const textareaClassName =
  "w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
