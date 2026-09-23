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
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  leaveTypeService,
  type CreateLeaveTypePayload,
} from "@/features/leave/services/leave-type.service";

import type {
  LeaveAllocationMethod,
  LeaveStatus,
  LeaveType,
} from "@/features/leave/types/leave.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

/* =========================================================
   PAGE
   ========================================================= */

export default function LeaveTypesPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("leave.type_read");
  const canManage = permissions.includes("leave.type_manage");

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeaveStatus | "ALL">("ALL");
  const [allocationMethod, setAllocationMethod] = useState<
    LeaveAllocationMethod | "ALL"
  >("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState<CreateLeaveTypeFormState>(
    getInitialCreateForm(),
  );

  /* =========================================================
     LOAD LEAVE TYPES
     ========================================================= */

  const loadLeaveTypes = useCallback(async () => {
    if (!company?._id || !canRead) {
      setLeaveTypes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await leaveTypeService.list(company._id, {
        page: 1,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status !== "ALL" ? { status } : {}),
        ...(allocationMethod !== "ALL" ? { allocationMethod } : {}),
        sortBy: "name",
        sortOrder: "asc",
      });

      setLeaveTypes(result.items);
    } catch (error) {
      setLeaveTypes([]);

      toast.error(
        getApiErrorMessage(error, "Unable to load company leave types."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, canRead, search, status, allocationMethod]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLeaveTypes();
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadLeaveTypes]);

  /* =========================================================
   CREATE LEAVE TYPE
   ========================================================= */

  function openCreateModal() {
    if (!canManage) {
      return;
    }

    setForm(getInitialCreateForm());
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }

    setIsCreateOpen(false);
    setForm(getInitialCreateForm());
  }

  function updateForm<K extends keyof CreateLeaveTypeFormState>(
    field: K,
    value: CreateLeaveTypeFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateLeaveType(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!company?._id) {
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to create leave types.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Leave type name is required.");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Leave type code is required.");
      return;
    }

    if (!form.effectiveFrom) {
      toast.error("Effective from date is required.");
      return;
    }

    if (
      form.allocationMethod === "MONTHLY_ACCRUAL" &&
      Number(form.monthlyEntitlementDays) <= 0
    ) {
      toast.error("Monthly entitlement must be greater than 0.");
      return;
    }

    if (
      form.allocationMethod === "ANNUAL_UPFRONT" &&
      Number(form.annualEntitlementDays) <= 0
    ) {
      toast.error("Annual entitlement must be greater than 0.");
      return;
    }

    try {
      setIsCreating(true);

      const payload: CreateLeaveTypePayload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),

        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),

        paymentType: form.paymentType,

        requiresBalance:
          form.allocationMethod === "NO_BALANCE" ? false : form.requiresBalance,

        allocationMethod: form.allocationMethod,

        annualEntitlementDays:
          form.allocationMethod === "ANNUAL_UPFRONT"
            ? Number(form.annualEntitlementDays)
            : 0,

        monthlyEntitlementDays:
          form.allocationMethod === "MONTHLY_ACCRUAL"
            ? Number(form.monthlyEntitlementDays)
            : 0,

        maximumMonthlyUsageDays:
          form.maximumMonthlyUsageDays.trim() === ""
            ? null
            : Number(form.maximumMonthlyUsageDays),

        allowMonthlyAccumulation:
          form.allocationMethod === "MONTHLY_ACCRUAL"
            ? form.allowMonthlyAccumulation
            : false,

        allowHalfDay: form.allowHalfDay,

        minimumServiceDays: Number(form.minimumServiceDays),
        minimumNoticeDays: Number(form.minimumNoticeDays),

        maximumConsecutiveDays:
          form.maximumConsecutiveDays.trim() === ""
            ? null
            : Number(form.maximumConsecutiveDays),

        allowBackdatedApplication: form.allowBackdatedApplication,

        maximumBackdatedDays: form.allowBackdatedApplication
          ? Number(form.maximumBackdatedDays)
          : 0,

        requireAttachment: form.requireAttachment,

        attachmentRequiredFromDays: form.requireAttachment
          ? form.attachmentRequiredFromDays.trim() === ""
            ? null
            : Number(form.attachmentRequiredFromDays)
          : null,

        allowNegativeBalance:
          form.allocationMethod === "NO_BALANCE"
            ? false
            : form.allowNegativeBalance,

        carryForwardEnabled:
          form.allocationMethod === "ANNUAL_UPFRONT"
            ? form.carryForwardEnabled
            : false,

        maximumCarryForwardDays:
          form.allocationMethod === "ANNUAL_UPFRONT" && form.carryForwardEnabled
            ? Number(form.maximumCarryForwardDays)
            : 0,

        effectiveFrom: form.effectiveFrom,

        ...(form.effectiveTo ? { effectiveTo: form.effectiveTo } : {}),

        status: form.status,
      };

      await leaveTypeService.create(company._id, payload);

      toast.success("Leave type created successfully.");

      setIsCreateOpen(false);
      setForm(getInitialCreateForm());

      await loadLeaveTypes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create leave type."));
    } finally {
      setIsCreating(false);
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
          <FileText className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Leave types unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view company leave types.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadLeaveTypes()}
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
              Create Leave Type
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Leave Types" value={String(leaveTypes.length)} />

        <SummaryCard
          title="Active"
          value={String(
            leaveTypes.filter((leaveType) => leaveType.status === "ACTIVE")
              .length,
          )}
        />

        <SummaryCard
          title="Unpaid Types"
          value={String(
            leaveTypes.filter((leaveType) => leaveType.paymentType === "UNPAID")
              .length,
          )}
        />
      </div>

      {/* =====================================================
          FILTERS
         ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leave type..."
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

          <select
            value={allocationMethod}
            onChange={(event) =>
              setAllocationMethod(
                event.target.value as LeaveAllocationMethod | "ALL",
              )
            }
            className={inputClassName}
          >
            <option value="ALL">All allocation methods</option>
            <option value="ANNUAL_UPFRONT">Annual upfront</option>
            <option value="MONTHLY_ACCRUAL">Monthly accrual</option>
            <option value="MANUAL">Manual</option>
            <option value="NO_BALANCE">No balance</option>
          </select>
        </div>
      </section>

      {/* =====================================================
          LIST
         ===================================================== */}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />

          <p className="mt-3 text-sm text-slate-500">Loading leave types...</p>
        </section>
      ) : leaveTypes.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No leave types found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {canManage
              ? "Create the company's first leave type to define entitlement and usage rules."
              : "No leave types are currently available for this company."}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-950">Company Leave Types</h2>

            <p className="mt-1 text-sm text-slate-500">
              {canManage
                ? "Review and configure the leave types available to employees."
                : "Review the leave types configured for your company."}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {leaveTypes.map((leaveType) => (
              <LeaveTypeRow
                key={leaveType._id}
                leaveType={leaveType}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      )}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-32px)]">
            {/* HEADER */}

            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Create Leave Type
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure entitlement, allocation and usage rules.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isCreating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close create leave type modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateLeaveType}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-7 p-4 sm:p-6">
                  {/* BASIC INFORMATION */}

                  <FormSection
                    title="Basic information"
                    description="Define how this leave type will appear to employees."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Name" required>
                        <input
                          value={form.name}
                          onChange={(event) =>
                            updateForm("name", event.target.value)
                          }
                          placeholder="Example: Sick Leave"
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>

                      <FormField label="Code" required>
                        <input
                          value={form.code}
                          onChange={(event) =>
                            updateForm("code", event.target.value.toUpperCase())
                          }
                          placeholder="Example: SL"
                          className={inputClassName}
                          disabled={isCreating}
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
                        placeholder="Describe when this leave type should be used."
                        disabled={isCreating}
                        className={textareaClassName}
                      />
                    </FormField>
                  </FormSection>

                  {/* PAYMENT / BALANCE */}

                  <FormSection
                    title="Payment & balance"
                    description="Configure whether the leave is paid and whether it consumes a balance."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Payment type">
                        <select
                          value={form.paymentType}
                          onChange={(event) =>
                            updateForm(
                              "paymentType",
                              event.target.value as "PAID" | "UNPAID",
                            )
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        >
                          <option value="PAID">Paid</option>
                          <option value="UNPAID">Unpaid</option>
                        </select>
                      </FormField>

                      <FormField label="Allocation method">
                        <select
                          value={form.allocationMethod}
                          onChange={(event) =>
                            updateForm(
                              "allocationMethod",
                              event.target.value as LeaveAllocationMethod,
                            )
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        >
                          <option value="MONTHLY_ACCRUAL">
                            Monthly accrual
                          </option>
                          <option value="ANNUAL_UPFRONT">Annual upfront</option>
                          <option value="MANUAL">Manual</option>
                          <option value="NO_BALANCE">No balance</option>
                        </select>
                      </FormField>
                    </div>

                    {form.allocationMethod !== "NO_BALANCE" && (
                      <ToggleField
                        label="Requires balance"
                        description="Employees must have sufficient leave balance before applying."
                        checked={form.requiresBalance}
                        onChange={(value) =>
                          updateForm("requiresBalance", value)
                        }
                        disabled={isCreating}
                      />
                    )}

                    {form.allocationMethod === "NO_BALANCE" && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                        No-balance leave does not consume an employee leave
                        balance. This is suitable for leave types such as Loss
                        of Pay.
                      </div>
                    )}
                  </FormSection>

                  {/* ENTITLEMENT */}

                  <FormSection
                    title="Entitlement"
                    description="Configure how much leave employees receive and may use."
                  >
                    {form.allocationMethod === "MONTHLY_ACCRUAL" && (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label="Monthly entitlement"
                            hint="Days credited each month."
                            required
                          >
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={form.monthlyEntitlementDays}
                              onChange={(event) =>
                                updateForm(
                                  "monthlyEntitlementDays",
                                  event.target.value,
                                )
                              }
                              className={inputClassName}
                              disabled={isCreating}
                            />
                          </FormField>

                          <FormField
                            label="Maximum monthly usage"
                            hint="Leave blank for no monthly usage cap."
                          >
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={form.maximumMonthlyUsageDays}
                              onChange={(event) =>
                                updateForm(
                                  "maximumMonthlyUsageDays",
                                  event.target.value,
                                )
                              }
                              placeholder="No limit"
                              className={inputClassName}
                              disabled={isCreating}
                            />
                          </FormField>
                        </div>

                        <ToggleField
                          label="Allow monthly accumulation"
                          description="Unused monthly leave may remain available for later months."
                          checked={form.allowMonthlyAccumulation}
                          onChange={(value) =>
                            updateForm("allowMonthlyAccumulation", value)
                          }
                          disabled={isCreating}
                        />
                      </>
                    )}

                    {form.allocationMethod === "ANNUAL_UPFRONT" && (
                      <FormField
                        label="Annual entitlement"
                        hint="Total days credited upfront for the leave year."
                        required
                      >
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={form.annualEntitlementDays}
                          onChange={(event) =>
                            updateForm(
                              "annualEntitlementDays",
                              event.target.value,
                            )
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>
                    )}

                    {(form.allocationMethod === "MANUAL" ||
                      form.allocationMethod === "NO_BALANCE") && (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {form.allocationMethod === "MANUAL"
                          ? "Leave entitlement will be allocated manually by an authorized administrator."
                          : "This leave type does not maintain an entitlement balance."}
                      </div>
                    )}
                  </FormSection>

                  {/* USAGE RULES */}

                  <FormSection
                    title="Usage rules"
                    description="Control how employees can request this leave type."
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField label="Minimum service days">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.minimumServiceDays}
                          onChange={(event) =>
                            updateForm("minimumServiceDays", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>

                      <FormField label="Notice required">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.minimumNoticeDays}
                          onChange={(event) =>
                            updateForm("minimumNoticeDays", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>

                      <FormField
                        label="Maximum consecutive days"
                        hint="Leave blank for no limit."
                      >
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={form.maximumConsecutiveDays}
                          onChange={(event) =>
                            updateForm(
                              "maximumConsecutiveDays",
                              event.target.value,
                            )
                          }
                          placeholder="No limit"
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>
                    </div>

                    <ToggleField
                      label="Allow half-day leave"
                      description="Employees may request first-half or second-half leave."
                      checked={form.allowHalfDay}
                      onChange={(value) => updateForm("allowHalfDay", value)}
                      disabled={isCreating}
                    />

                    <ToggleField
                      label="Allow negative balance"
                      description="Allow requests even when the available leave balance is insufficient."
                      checked={form.allowNegativeBalance}
                      onChange={(value) =>
                        updateForm("allowNegativeBalance", value)
                      }
                      disabled={
                        isCreating || form.allocationMethod === "NO_BALANCE"
                      }
                    />
                  </FormSection>

                  {/* BACKDATED */}

                  <FormSection
                    title="Backdated applications"
                    description="Configure whether employees may apply for past dates."
                  >
                    <ToggleField
                      label="Allow backdated application"
                      description="Employees may submit leave requests for dates that have already passed."
                      checked={form.allowBackdatedApplication}
                      onChange={(value) =>
                        updateForm("allowBackdatedApplication", value)
                      }
                      disabled={isCreating}
                    />

                    {form.allowBackdatedApplication && (
                      <FormField label="Maximum backdated days">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.maximumBackdatedDays}
                          onChange={(event) =>
                            updateForm(
                              "maximumBackdatedDays",
                              event.target.value,
                            )
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>
                    )}
                  </FormSection>

                  {/* ATTACHMENT */}

                  <FormSection
                    title="Attachments"
                    description="Configure supporting-document requirements."
                  >
                    <ToggleField
                      label="Require attachment"
                      description="Employees must provide supporting documentation when required."
                      checked={form.requireAttachment}
                      onChange={(value) =>
                        updateForm("requireAttachment", value)
                      }
                      disabled={isCreating}
                    />

                    {form.requireAttachment && (
                      <FormField
                        label="Attachment required from"
                        hint="Number of leave days from which an attachment becomes required. Leave blank if your backend rule treats it as always required."
                      >
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={form.attachmentRequiredFromDays}
                          onChange={(event) =>
                            updateForm(
                              "attachmentRequiredFromDays",
                              event.target.value,
                            )
                          }
                          placeholder="Example: 2"
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>
                    )}
                  </FormSection>

                  {/* CARRY FORWARD */}

                  {form.allocationMethod === "ANNUAL_UPFRONT" && (
                    <FormSection
                      title="Carry forward"
                      description="Configure whether unused annual leave may move into the next leave year."
                    >
                      <ToggleField
                        label="Enable carry forward"
                        description="Unused leave may be carried into the next leave year."
                        checked={form.carryForwardEnabled}
                        onChange={(value) =>
                          updateForm("carryForwardEnabled", value)
                        }
                        disabled={isCreating}
                      />

                      {form.carryForwardEnabled && (
                        <FormField label="Maximum carry-forward days">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={form.maximumCarryForwardDays}
                            onChange={(event) =>
                              updateForm(
                                "maximumCarryForwardDays",
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                            disabled={isCreating}
                          />
                        </FormField>
                      )}
                    </FormSection>
                  )}

                  {/* EFFECTIVE PERIOD */}

                  <FormSection
                    title="Effective period"
                    description="Control when this leave type is available."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Effective from" required>
                        <input
                          type="date"
                          value={form.effectiveFrom}
                          onChange={(event) =>
                            updateForm("effectiveFrom", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>

                      <FormField label="Effective to" hint="Optional.">
                        <input
                          type="date"
                          value={form.effectiveTo}
                          onChange={(event) =>
                            updateForm("effectiveTo", event.target.value)
                          }
                          className={inputClassName}
                          disabled={isCreating}
                        />
                      </FormField>
                    </div>

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
                        disabled={isCreating}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </FormField>
                  </FormSection>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Leave Type
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
   LEAVE TYPE ROW
   ========================================================= */

function LeaveTypeRow({
  leaveType,
  canManage,
}: {
  leaveType: LeaveType;
  canManage: boolean;
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          {/* TITLE */}

          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-950">
              {leaveType.name}
            </h3>

            <StatusBadge status={leaveType.status} />

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                leaveType.paymentType === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {leaveType.paymentType === "PAID" ? "Paid" : "Unpaid"}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {leaveType.code} · {formatEnum(leaveType.allocationMethod)}
          </p>

          {leaveType.description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {leaveType.description}
            </p>
          )}

          {/* RULES */}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RuleCard
              label="Entitlement"
              value={getEntitlementLabel(leaveType)}
            />

            <RuleCard
              label="Monthly usage"
              value={getMonthlyUsageLabel(leaveType)}
            />

            <RuleCard
              label="Balance"
              value={leaveType.requiresBalance ? "Required" : "Not required"}
            />

            <RuleCard
              label="Half day"
              value={leaveType.allowHalfDay ? "Allowed" : "Not allowed"}
            />
          </div>

          {/* SECONDARY RULES */}

          <div className="mt-4 flex flex-wrap gap-2">
            {leaveType.allocationMethod === "MONTHLY_ACCRUAL" && (
              <RulePill>
                {leaveType.allowMonthlyAccumulation
                  ? "Monthly accumulation allowed"
                  : "No monthly accumulation"}
              </RulePill>
            )}

            <RulePill>
              Notice: {formatDays(leaveType.minimumNoticeDays)}
            </RulePill>

            <RulePill>
              {leaveType.maximumConsecutiveDays !== null
                ? `Max consecutive: ${formatDays(
                    leaveType.maximumConsecutiveDays,
                  )}`
                : "No consecutive-day limit"}
            </RulePill>

            <RulePill>
              {leaveType.requireAttachment
                ? "Attachment required"
                : "Attachment not required"}
            </RulePill>

            {leaveType.carryForwardEnabled && (
              <RulePill>
                Carry forward: {formatDays(leaveType.maximumCarryForwardDays)}
              </RulePill>
            )}
          </div>
        </div>

        {/* ACTION */}

        {canManage && (
          <button
            type="button"
            onClick={() =>
              toast.info(`Edit form for ${leaveType.name} will be added next.`)
            }
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
            Leave Types
          </h1>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Review leave entitlement, allocation and usage rules.
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

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
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
   HELPERS
   ========================================================= */

function getEntitlementLabel(leaveType: LeaveType) {
  switch (leaveType.allocationMethod) {
    case "MONTHLY_ACCRUAL":
      return `${formatDays(leaveType.monthlyEntitlementDays)} / month`;

    case "ANNUAL_UPFRONT":
      return `${formatDays(leaveType.annualEntitlementDays)} / year`;

    case "MANUAL":
      return "Manual allocation";

    case "NO_BALANCE":
      return "No entitlement balance";

    default:
      return "—";
  }
}

function getMonthlyUsageLabel(leaveType: LeaveType) {
  if (leaveType.maximumMonthlyUsageDays === null) {
    return "No monthly cap";
  }

  return formatDays(leaveType.maximumMonthlyUsageDays);
}

function formatDays(value: number) {
  const normalized = Number(value.toFixed(2));

  return `${normalized} day${normalized === 1 ? "" : "s"}`;
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

interface CreateLeaveTypeFormState {
  name: string;
  code: string;
  description: string;

  paymentType: "PAID" | "UNPAID";
  requiresBalance: boolean;

  allocationMethod: LeaveAllocationMethod;

  annualEntitlementDays: string;
  monthlyEntitlementDays: string;
  maximumMonthlyUsageDays: string;

  allowMonthlyAccumulation: boolean;
  allowHalfDay: boolean;

  minimumServiceDays: string;
  minimumNoticeDays: string;
  maximumConsecutiveDays: string;

  allowBackdatedApplication: boolean;
  maximumBackdatedDays: string;

  requireAttachment: boolean;
  attachmentRequiredFromDays: string;

  allowNegativeBalance: boolean;

  carryForwardEnabled: boolean;
  maximumCarryForwardDays: string;

  effectiveFrom: string;
  effectiveTo: string;

  status: LeaveStatus;
}

function getInitialCreateForm(): CreateLeaveTypeFormState {
  return {
    name: "",
    code: "",
    description: "",

    paymentType: "PAID",
    requiresBalance: true,

    allocationMethod: "MONTHLY_ACCRUAL",

    annualEntitlementDays: "0",
    monthlyEntitlementDays: "1",
    maximumMonthlyUsageDays: "",

    allowMonthlyAccumulation: false,
    allowHalfDay: true,

    minimumServiceDays: "0",
    minimumNoticeDays: "0",
    maximumConsecutiveDays: "",

    allowBackdatedApplication: false,
    maximumBackdatedDays: "0",

    requireAttachment: false,
    attachmentRequiredFromDays: "",

    allowNegativeBalance: false,

    carryForwardEnabled: false,
    maximumCarryForwardDays: "0",

    effectiveFrom: getTodayDateInputValue(),
    effectiveTo: "",

    status: "ACTIVE",
  };
}

function getTodayDateInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";

const textareaClassName =
  "w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
