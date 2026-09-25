"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  WalletCards,
  X,
  Info,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";
import type { Employee } from "@/features/employees/types/employee.types";

import { leaveBalanceService } from "@/features/leave/services/leave-balance.service";
import { leavePolicyService } from "@/features/leave/services/leave-policy.service";
import { leaveTypeService } from "@/features/leave/services/leave-type.service";

import type {
  LeaveBalance,
  LeavePolicy,
  LeaveType,
} from "@/features/leave/types/leave.types";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

/* =========================================================
   PAGE
   ========================================================= */

export default function LeaveBalancesPage() {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("leave.balance_read");
  const canManage = permissions.includes("leave.balance_manage");

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(
    null,
  );

  const [adjustmentDays, setAdjustmentDays] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentPeriodKey, setAdjustmentPeriodKey] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  /* =========================================================
   INITIALIZE BALANCE
   ========================================================= */

  const [isInitializeOpen, setIsInitializeOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);

  const [initializeEmployeeId, setInitializeEmployeeId] = useState("");
  const [initializeLeaveTypeId, setInitializeLeaveTypeId] = useState("");
  const [initializePolicyId, setInitializePolicyId] = useState("");

  const [isLoadingInitializeData, setIsLoadingInitializeData] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false);

  /* =========================================================
   MONTHLY LEAVE CREDIT
   ========================================================= */

  const [creditBalance, setCreditBalance] = useState<LeaveBalance | null>(null);
  const [creditPeriodKey, setCreditPeriodKey] = useState("");
  const [isCrediting, setIsCrediting] = useState(false);
  /* =========================================================
     LOAD BALANCES
     ========================================================= */

  const loadBalances = useCallback(async () => {
    if (!company?._id || !canRead) {
      setBalances([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await leaveBalanceService.list(company._id, {
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setBalances(result.items);
    } catch (error) {
      setBalances([]);

      toast.error(getApiErrorMessage(error, "Unable to load leave balances."));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, canRead]);

  const loadInitializeData = useCallback(async () => {
    if (!company?._id || !canManage) {
      return;
    }

    try {
      setIsLoadingInitializeData(true);

      const [employeeResult, leaveTypeResult, policyResult] = await Promise.all(
        [
          employeeService.getEmployees(company._id, {
            page: 1,
            limit: 100,
          }),

          leaveTypeService.list(company._id, {
            page: 1,
            limit: 100,
            status: "ACTIVE",
            sortBy: "name",
            sortOrder: "asc",
          }),

          leavePolicyService.list(company._id, {
            page: 1,
            limit: 100,
            status: "ACTIVE",
            isDefault: true,
          }),
        ],
      );

      setEmployees(employeeResult.records);

      setLeaveTypes(
        leaveTypeResult.items.filter(
          (leaveType) =>
            leaveType.requiresBalance &&
            leaveType.allocationMethod !== "NO_BALANCE",
        ),
      );

      setLeavePolicies(policyResult.items);

      const defaultPolicy = policyResult.items.find(
        (policy) => policy.isDefault,
      );

      setInitializePolicyId(defaultPolicy?._id ?? "");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load leave balance initialization data.",
        ),
      );
    } finally {
      setIsLoadingInitializeData(false);
    }
  }, [company?._id, canManage]);

  function openInitializeBalance() {
    if (!canManage) {
      toast.error("You do not have permission to initialize leave balances.");
      return;
    }

    setInitializeEmployeeId("");
    setInitializeLeaveTypeId("");
    setInitializePolicyId("");
    setIsInitializeOpen(true);

    void loadInitializeData();
  }

  function closeInitializeBalance() {
    if (isInitializing) {
      return;
    }

    setIsInitializeOpen(false);
    setInitializeEmployeeId("");
    setInitializeLeaveTypeId("");
    setInitializePolicyId("");
  }

  const selectedInitializePolicy = useMemo(
    () =>
      leavePolicies.find((policy) => policy._id === initializePolicyId) ?? null,
    [leavePolicies, initializePolicyId],
  );

  const initializeLeaveYear = useMemo(() => {
    if (!selectedInitializePolicy) {
      return null;
    }

    return getLeaveYearForDate(
      new Date(),
      selectedInitializePolicy.leaveYearStartMonth ?? 1,
      selectedInitializePolicy.leaveYearStartDay ?? 1,
    );
  }, [selectedInitializePolicy]);

  const availableInitializeLeaveTypes = useMemo(() => {
    if (!initializeEmployeeId || !initializeLeaveYear) {
      return leaveTypes;
    }

    return leaveTypes.filter((leaveType) => {
      const alreadyInitialized = balances.some((balance) => {
        const balanceEmployeeId =
          typeof balance.employeeId === "string"
            ? balance.employeeId
            : balance.employeeId?._id;

        const balanceLeaveTypeId =
          typeof balance.leaveTypeId === "string"
            ? balance.leaveTypeId
            : balance.leaveTypeId?._id;

        return (
          balanceEmployeeId === initializeEmployeeId &&
          balanceLeaveTypeId === leaveType._id &&
          balance.leaveYearStart.slice(0, 10) === initializeLeaveYear.start &&
          balance.leaveYearEnd.slice(0, 10) === initializeLeaveYear.end
        );
      });

      return !alreadyInitialized;
    });
  }, [leaveTypes, balances, initializeEmployeeId, initializeLeaveYear]);

  async function handleInitializeBalance(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!company?._id) {
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to initialize leave balances.");
      return;
    }

    if (!initializeEmployeeId) {
      toast.error("Select an employee.");
      return;
    }

    if (!initializeLeaveTypeId) {
      toast.error("Select a leave type.");
      return;
    }

    if (!initializePolicyId) {
      toast.error("No active default leave policy is available.");
      return;
    }

    if (!initializeLeaveYear) {
      toast.error("Unable to determine the current leave year.");
      return;
    }

    try {
      setIsInitializing(true);

      await leaveBalanceService.initialize(company._id, {
        employeeId: initializeEmployeeId,
        leaveTypeId: initializeLeaveTypeId,
        leavePolicyId: initializePolicyId,
        leaveYearStart: initializeLeaveYear.start,
        leaveYearEnd: initializeLeaveYear.end,
        leaveYearLabel: initializeLeaveYear.label,
        carriedForwardDays: 0,
      });

      toast.success("Leave balance initialized successfully.");

      setIsInitializeOpen(false);
      setInitializeEmployeeId("");
      setInitializeLeaveTypeId("");
      setInitializePolicyId("");

      await loadBalances();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to initialize leave balance."),
      );
    } finally {
      setIsInitializing(false);
    }
  }

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  /* =========================================================
     SUMMARY
     ========================================================= */

  const summary = useMemo(() => {
    return balances.reduce(
      (result, balance) => {
        result.available += getAvailableDays(balance);
        result.pending += balance.pendingDays ?? 0;
        result.used += balance.usedDays ?? 0;

        return result;
      },
      {
        available: 0,
        pending: 0,
        used: 0,
      },
    );
  }, [balances]);

  /* =========================================================
     OPEN ADJUSTMENT
     ========================================================= */

  function openAdjustment(balance: LeaveBalance) {
    setSelectedBalance(balance);
    setAdjustmentDays("");
    setAdjustmentReason("");

    if (balance.allocationMethod === "MONTHLY_ACCRUAL") {
      const currentPeriodKey = getCurrentPeriodKey();

      const availablePeriods = getMonthlyAdjustmentPeriods(balance);

      const defaultPeriod =
        availablePeriods.find((period) => period.value === currentPeriodKey)
          ?.value ??
        availablePeriods.at(-1)?.value ??
        "";

      setAdjustmentPeriodKey(defaultPeriod);
    } else {
      setAdjustmentPeriodKey("");
    }
  }

  function closeAdjustment() {
    if (isAdjusting) {
      return;
    }

    setSelectedBalance(null);
    setAdjustmentDays("");
    setAdjustmentReason("");
    setAdjustmentPeriodKey("");
  }

  /* =========================================================
   MONTHLY LEAVE CREDIT
   ========================================================= */

  function openMonthlyCredit(balance: LeaveBalance) {
    if (!canManage) {
      toast.error("You do not have permission to credit leave balances.");
      return;
    }

    if (balance.allocationMethod !== "MONTHLY_ACCRUAL") {
      toast.error(
        "Monthly credit is only available for monthly-accrual leave.",
      );
      return;
    }

    const availablePeriods = getAvailableAccrualPeriods(balance);
    const currentPeriodKey = getCurrentPeriodKey();

    const defaultPeriod =
      availablePeriods.find((period) => period.value === currentPeriodKey)
        ?.value ??
      availablePeriods[0]?.value ??
      "";

    setCreditBalance(balance);
    setCreditPeriodKey(defaultPeriod);
  }

  function closeMonthlyCredit() {
    if (isCrediting) {
      return;
    }

    setCreditBalance(null);
    setCreditPeriodKey("");
  }

  async function handleMonthlyCredit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id || !creditBalance) {
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to credit leave balances.");
      return;
    }

    if (!creditPeriodKey) {
      toast.error("Select a month to credit.");
      return;
    }

    try {
      setIsCrediting(true);

      await leaveBalanceService.accrue(company._id, creditBalance._id, {
        periodDate: `${creditPeriodKey}-01`,
      });

      toast.success(
        `Monthly leave credited for ${formatPeriodKey(creditPeriodKey)}.`,
      );

      setCreditBalance(null);
      setCreditPeriodKey("");

      await loadBalances();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to credit monthly leave."));
    } finally {
      setIsCrediting(false);
    }
  }

  /* =========================================================
     SUBMIT ADJUSTMENT
     ========================================================= */

  async function handleAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id || !selectedBalance) {
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to adjust leave balances.");
      return;
    }

    const parsedAdjustment = Number(adjustmentDays);

    if (!Number.isFinite(parsedAdjustment) || parsedAdjustment === 0) {
      toast.error("Enter a valid positive or negative adjustment.");
      return;
    }

    if (
      selectedBalance.allocationMethod === "MONTHLY_ACCRUAL" &&
      !adjustmentPeriodKey
    ) {
      toast.error("Select the month for this balance adjustment.");
      return;
    }

    if (adjustmentReason.trim().length < 3) {
      toast.error("Please provide a reason for the balance adjustment.");
      return;
    }

    try {
      setIsAdjusting(true);

      await leaveBalanceService.adjust(company._id, selectedBalance._id, {
        adjustmentDays: parsedAdjustment,
        ...(selectedBalance.allocationMethod === "MONTHLY_ACCRUAL"
          ? { periodKey: adjustmentPeriodKey }
          : {}),
        reason: adjustmentReason.trim(),
      });

      toast.success("Leave balance adjusted successfully.");

      closeAdjustment();

      await loadBalances();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to adjust leave balance."));
    } finally {
      setIsAdjusting(false);
    }
  }

  /* =========================================================
     NO PERMISSION
     ========================================================= */

  if (!canRead) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <WalletCards className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Leave balances unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view leave balances.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={openInitializeBalance}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Initialize Balance
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadBalances()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Available" value={formatDays(summary.available)} />

        <SummaryCard title="Pending" value={formatDays(summary.pending)} />

        <SummaryCard title="Used" value={formatDays(summary.used)} />
      </div>

      {/* =====================================================
          BALANCES
         ===================================================== */}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />

          <p className="mt-3 text-sm text-slate-500">
            Loading leave balances...
          </p>
        </section>
      ) : balances.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <WalletCards className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No leave balances found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            No active leave balances are available within your authorized scope.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-950">Leave balances</h2>

            <p className="mt-1 text-sm text-slate-500">
              {canManage
                ? "Review employee balances and make authorized adjustments."
                : "Review leave balances available within your scope."}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {balances.map((balance) => (
              <BalanceRow
                key={balance._id}
                balance={balance}
                canManage={canManage}
                onAdjust={() => openAdjustment(balance)}
                onCreditMonthly={() => openMonthlyCredit(balance)}
              />
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
    INITIALIZE BALANCE MODAL
   ===================================================== */}

      {isInitializeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-32px)]">
            {/* HEADER */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0 pr-3">
                <h2 className="text-lg font-bold text-slate-950">
                  Initialize Leave Balance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a leave balance for an employee.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInitializeBalance}
                disabled={isInitializing}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close initialize balance modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleInitializeBalance}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-5 p-4 sm:p-5">
                  {isLoadingInitializeData ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading employees and leave configuration...
                    </div>
                  ) : (
                    <>
                      {/* EMPLOYEE */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Employee
                        </label>

                        <select
                          value={initializeEmployeeId}
                          onChange={(event) => {
                            setInitializeEmployeeId(event.target.value);
                            setInitializeLeaveTypeId("");
                          }}
                          disabled={isInitializing}
                          className={inputClassName}
                        >
                          <option value="">Select employee</option>

                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {getEmployeeOptionLabel(employee)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* LEAVE TYPE */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Leave type
                        </label>

                        <select
                          value={initializeLeaveTypeId}
                          onChange={(event) =>
                            setInitializeLeaveTypeId(event.target.value)
                          }
                          disabled={isInitializing}
                          className={inputClassName}
                        >
                          <option value="">Select leave type</option>

                          {availableInitializeLeaveTypes.map((leaveType) => (
                            <option key={leaveType._id} value={leaveType._id}>
                              {leaveType.name} ({leaveType.code})
                            </option>
                          ))}
                        </select>
                        {initializeEmployeeId &&
                          availableInitializeLeaveTypes.length === 0 && (
                            <p className="mt-2 text-sm text-amber-600">
                              All applicable leave balances are already
                              initialized for this employee for the current
                              leave year.
                            </p>
                          )}
                      </div>

                      {/* POLICY */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Leave policy
                        </label>

                        <select
                          value={initializePolicyId}
                          onChange={(event) =>
                            setInitializePolicyId(event.target.value)
                          }
                          disabled={isInitializing}
                          className={inputClassName}
                        >
                          <option value="">Select policy</option>

                          {leavePolicies.map((policy) => (
                            <option key={policy._id} value={policy._id}>
                              {policy.name}
                              {policy.isDefault ? " (Default)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* LEAVE YEAR */}
                      {initializeLeaveYear && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium text-slate-400">
                            Leave year
                          </p>

                          <p className="mt-1 font-bold text-slate-950">
                            {initializeLeaveYear.label}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {initializeLeaveYear.start} to{" "}
                            {initializeLeaveYear.end}
                          </p>
                        </div>
                      )}

                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                        The initial balance will be calculated according to the
                        selected leave type and company leave policy.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeInitializeBalance}
                  disabled={isInitializing}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isInitializing ||
                    isLoadingInitializeData ||
                    !initializeEmployeeId ||
                    !initializeLeaveTypeId ||
                    !initializePolicyId ||
                    !initializeLeaveYear
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isInitializing && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Initialize Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
    MONTHLY LEAVE CREDIT MODAL
   ===================================================== */}

      {creditBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-32px)]">
            {/* HEADER */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0 pr-3">
                <h2 className="text-lg font-bold text-slate-950">
                  Credit Monthly Leave
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {getEmployeeName(creditBalance)} ·{" "}
                  {getLeaveTypeName(creditBalance)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMonthlyCredit}
                disabled={isCrediting}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close monthly leave credit modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleMonthlyCredit}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* BODY */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-5 p-4 sm:p-5">
                  {/* EMPLOYEE / LEAVE TYPE */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Employee
                      </p>

                      <p className="mt-1 font-bold text-slate-950">
                        {getEmployeeName(creditBalance)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Leave type
                      </p>

                      <p className="mt-1 font-bold text-slate-950">
                        {getLeaveTypeName(creditBalance)}
                      </p>
                    </div>
                  </div>

                  {/* MONTH */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Credit month
                    </label>

                    <select
                      value={creditPeriodKey}
                      onChange={(event) =>
                        setCreditPeriodKey(event.target.value)
                      }
                      disabled={isCrediting}
                      className={inputClassName}
                    >
                      <option value="">Select month</option>

                      {getAvailableAccrualPeriods(creditBalance).map(
                        (period) => (
                          <option key={period.value} value={period.value}>
                            {period.label}
                          </option>
                        ),
                      )}
                    </select>

                    <p className="mt-1.5 text-xs text-slate-500">
                      Only months that have not already been credited are
                      available.
                    </p>
                  </div>

                  {/* MONTHLY ENTITLEMENT */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-medium text-blue-600">
                      Monthly entitlement
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-950">
                      {formatDays(getMonthlyEntitlement(creditBalance))}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      This is configured in the Leave Type settings and will be
                      credited automatically for the selected month.
                    </p>
                  </div>

                  {/* LEAVE YEAR */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Leave year
                    </p>

                    <p className="mt-1 font-bold text-slate-950">
                      {creditBalance.leaveYearLabel}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {creditBalance.leaveYearStart.slice(0, 10)} to{" "}
                      {creditBalance.leaveYearEnd.slice(0, 10)}
                    </p>
                  </div>

                  {/* INFO */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    This credits the configured monthly entitlement for the
                    selected leave type. Use Adjust Balance only for manual HR
                    corrections or exceptional changes.
                  </div>

                  {getAvailableAccrualPeriods(creditBalance).length === 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      There are no uncredited months available for this leave
                      balance.
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeMonthlyCredit}
                  disabled={isCrediting}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCrediting || !creditPeriodKey}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCrediting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCrediting
                    ? "Crediting..."
                    : `Credit ${formatDays(getMonthlyEntitlement(creditBalance))}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADJUSTMENT MODAL
         ===================================================== */}

      {selectedBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-32px)]">
            {/* HEADER */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0 pr-3">
                <h2 className="text-lg font-bold text-slate-950">
                  Adjust Leave Balance
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {getEmployeeName(selectedBalance)} ·{" "}
                  {getLeaveTypeName(selectedBalance)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdjustment}
                disabled={isAdjusting}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close adjustment modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleAdjustment}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* SCROLLABLE BODY */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
                  {/* CURRENT BALANCE */}
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Current available balance
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {formatDays(getAvailableDays(selectedBalance))}
                    </p>
                  </div>

                  {/* ADJUSTMENT MONTH */}
                  {selectedBalance.allocationMethod === "MONTHLY_ACCRUAL" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Adjustment month
                      </label>

                      <select
                        value={adjustmentPeriodKey}
                        onChange={(event) =>
                          setAdjustmentPeriodKey(event.target.value)
                        }
                        disabled={isAdjusting}
                        className={inputClassName}
                      >
                        <option value="">Select month</option>

                        {getMonthlyAdjustmentPeriods(selectedBalance).map(
                          (period) => (
                            <option key={period.value} value={period.value}>
                              {period.label}
                            </option>
                          ),
                        )}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-500">
                        The adjustment will apply only to this monthly leave
                        bucket.
                      </p>
                    </div>
                  )}

                  {/* ADJUSTMENT DAYS */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Adjustment days
                    </label>

                    <input
                      type="number"
                      step="0.5"
                      value={adjustmentDays}
                      onChange={(event) =>
                        setAdjustmentDays(event.target.value)
                      }
                      disabled={isAdjusting}
                      placeholder="Example: 1 or -0.5"
                      className={inputClassName}
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAdjustmentDays((current) =>
                            String((Number(current) || 0) + 1),
                          )
                        }
                        disabled={isAdjusting}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />+ 1 day
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAdjustmentDays((current) =>
                            String((Number(current) || 0) - 1),
                          )
                        }
                        disabled={isAdjusting}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />− 1 day
                      </button>
                    </div>
                  </div>

                  {/* REASON */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reason
                    </label>

                    <textarea
                      rows={4}
                      value={adjustmentReason}
                      onChange={(event) =>
                        setAdjustmentReason(event.target.value)
                      }
                      disabled={isAdjusting}
                      placeholder="Reason for this balance adjustment..."
                      className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                    />
                  </div>

                  {/* INFO */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 sm:p-4 sm:text-sm sm:leading-6">
                    Positive values credit leave. Negative values deduct leave.
                    The reason is retained in the balance adjustment history.
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeAdjustment}
                  disabled={isAdjusting}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isAdjusting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply Adjustment
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
   BALANCE ROW
   ========================================================= */

function BalanceRow({
  balance,
  canManage,
  onAdjust,
  onCreditMonthly,
}: {
  balance: LeaveBalance;
  canManage: boolean;
  onAdjust: () => void;
  onCreditMonthly: () => void;
}) {
  const available = getAvailableDays(balance);

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">
              {getEmployeeName(balance)}
            </h3>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {getLeaveTypeName(balance)}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {balance.leaveYearLabel} · {formatEnum(balance.allocationMethod)}
          </p>
        </div>

        {balance.allocationMethod === "MONTHLY_ACCRUAL" ? (
          <MonthlyBalanceBreakdown balance={balance} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <BalanceMetric
              label="Allocated"
              value={balance.allocatedDays ?? 0}
              help="Leave credited to you upfront for the leave year."
            />

            <BalanceMetric
              label="Adjusted"
              value={balance.adjustedDays ?? 0}
              help="Manual balance changes made by HR or an administrator. Positive values add leave and negative values deduct leave."
              showSign
            />

            <BalanceMetric
              label="Pending"
              value={balance.pendingDays ?? 0}
              help="Leave days currently reserved for requests that are still awaiting a final decision."
            />

            <BalanceMetric
              label="Used"
              value={balance.usedDays ?? 0}
              help="Leave days already consumed through approved leave requests."
            />

            <BalanceMetric
              label="Available"
              value={available}
              help="Leave currently available for you to use after adjustments, pending requests, used leave and expired leave are considered."
              emphasize
            />
          </div>
        )}

        {canManage && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {balance.allocationMethod === "MONTHLY_ACCRUAL" && (
              <button
                type="button"
                onClick={onCreditMonthly}
                className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Credit Monthly Leave
              </button>
            )}

            <button
              type="button"
              onClick={onAdjust}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Adjust Balance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyBalanceBreakdown({ balance }: { balance: LeaveBalance }) {
  const monthlyBalances = [...(balance.monthlyBalances ?? [])].sort((a, b) =>
    b.periodKey.localeCompare(a.periodKey),
  );

  if (monthlyBalances.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No monthly leave has been credited yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {monthlyBalances.map((month) => {
        const available =
          (month.creditedDays ?? 0) +
          (month.adjustedDays ?? 0) -
          (month.pendingDays ?? 0) -
          (month.usedDays ?? 0) -
          (month.lapsedDays ?? 0);

        return (
          <div
            key={month.periodKey}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {formatPeriodKey(month.periodKey)}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Monthly leave balance
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">Available</p>

                <p className="text-base font-bold text-blue-700">
                  {formatDays(available)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
              <BalanceMetric
                label="Credited"
                value={month.creditedDays ?? 0}
                help="Leave credited to you for this month according to the company's leave policy."
              />
              <BalanceMetric
                label="Adjusted"
                value={month.adjustedDays ?? 0}
                help="Manual changes made by HR or an administrator for this specific month. Positive values add leave and negative values deduct leave."
                showSign
              />
              <BalanceMetric
                label="Pending"
                value={month.pendingDays ?? 0}
                help="Leave from this month's balance currently reserved for requests awaiting a final decision."
              />
              <BalanceMetric
                label="Used"
                value={month.usedDays ?? 0}
                help="Leave already consumed from this month's balance."
              />
              <BalanceMetric
                label="Lapsed"
                value={month.lapsedDays ?? 0}
                help="Leave from this month that has expired and can no longer be used."
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
/* =========================================================
   HELPERS
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Leave Balances
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review leave allocation, usage and available balances.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function BalanceMetric({
  label,
  value,
  emphasize = false,
  help,
  showSign = false,
  tooltipAlign = "center",
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  help?: string;
  showSign?: boolean;
  tooltipAlign?: "left" | "center" | "right";
}) {
  const displayValue =
    showSign && value > 0 ? `+${formatDays(value)}` : formatDays(value);

  const tooltipPosition =
    tooltipAlign === "right"
      ? "right-0"
      : tooltipAlign === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  const arrowPosition =
    tooltipAlign === "right"
      ? "right-1"
      : tooltipAlign === "left"
        ? "left-1"
        : "left-1/2 -translate-x-1/2";

  return (
    <div className="min-w-[72px]">
      <div className="flex items-center gap-1">
        <p className="text-xs text-slate-400">{label}</p>

        {help && (
          <div className="group relative">
            <button
              type="button"
              aria-label={`What does ${label} mean?`}
              className="flex text-slate-400 transition hover:text-slate-700"
            >
              <Info className="h-3.5 w-3.5" />
            </button>

            <div
              className={`pointer-events-none absolute bottom-full z-30 mb-2 hidden w-56 rounded-lg bg-slate-950 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg group-hover:block group-focus-within:block ${tooltipPosition}`}
            >
              {help}

              <div
                className={`absolute top-full border-4 border-transparent border-t-slate-950 ${arrowPosition}`}
              />
            </div>
          </div>
        )}
      </div>

      <p
        className={`mt-1 text-sm font-bold ${
          emphasize ? "text-blue-700" : "text-slate-900"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function getAvailableDays(balance: LeaveBalance) {
  return (
    (balance.allocatedDays ?? 0) +
    (balance.accruedDays ?? 0) +
    (balance.carriedForwardDays ?? 0) +
    (balance.adjustedDays ?? 0) -
    (balance.pendingDays ?? 0) -
    (balance.usedDays ?? 0) -
    (balance.lapsedDays ?? 0)
  );
}

function getEmployeeName(balance: LeaveBalance) {
  const employee = balance.employeeId;

  if (typeof employee === "string") {
    return "Employee";
  }

  const user = employee?.userId;

  if (user && typeof user !== "string") {
    return (
      user.displayName ||
      [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
      employee.employeeCode ||
      "Employee"
    );
  }

  return employee?.employeeCode ?? "Employee";
}

function getLeaveTypeName(balance: LeaveBalance) {
  const leaveType = balance.leaveTypeId;

  if (typeof leaveType === "string") {
    return "Leave";
  }

  return leaveType?.name ?? leaveType?.code ?? "Leave";
}

function getMonthlyEntitlement(balance: LeaveBalance) {
  const leaveType = balance.leaveTypeId;

  if (typeof leaveType === "string" || !leaveType) {
    return 0;
  }

  return Number(leaveType.monthlyEntitlementDays ?? 0);
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

function getCurrentPeriodKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthlyAdjustmentPeriods(balance: LeaveBalance) {
  const start = new Date(balance.leaveYearStart);
  const end = new Date(balance.leaveYearEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const periods: Array<{
    value: string;
    label: string;
  }> = [];

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );

  const finalMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
  );

  while (cursor <= finalMonth) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    periods.push({
      value: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: cursor.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return periods;
}

function getAvailableAccrualPeriods(balance: LeaveBalance) {
  if (balance.allocationMethod !== "MONTHLY_ACCRUAL") {
    return [];
  }

  const start = new Date(balance.leaveYearStart);
  const end = new Date(balance.leaveYearEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const alreadyCreditedPeriods = new Set(
    (balance.monthlyBalances ?? []).map((month) => month.periodKey),
  );

  const currentPeriodKey = getCurrentPeriodKey();

  const periods: Array<{
    value: string;
    label: string;
  }> = [];

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );

  const finalMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
  );

  while (cursor <= finalMonth) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Do not allow future months.
    if (
      periodKey <= currentPeriodKey &&
      !alreadyCreditedPeriods.has(periodKey)
    ) {
      periods.push({
        value: periodKey,
        label: cursor.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
      });
    }

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return periods;
}

function formatPeriodKey(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);

  if (!year || !month) {
    return periodKey;
  }

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getLeaveYearForDate(date: Date, startMonth: number, startDay: number) {
  const currentYear = date.getFullYear();

  const currentDate = new Date(currentYear, date.getMonth(), date.getDate());

  const startThisYear = new Date(currentYear, startMonth - 1, startDay);

  const startYear =
    currentDate >= startThisYear ? currentYear : currentYear - 1;

  const leaveYearStart = new Date(startYear, startMonth - 1, startDay);

  const leaveYearEnd = new Date(startYear + 1, startMonth - 1, startDay);

  leaveYearEnd.setDate(leaveYearEnd.getDate() - 1);

  return {
    start: formatDateForApi(leaveYearStart),
    end: formatDateForApi(leaveYearEnd),
    label: `${leaveYearStart.getFullYear()}-${leaveYearEnd.getFullYear()}`,
  };
}

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEmployeeOptionLabel(employee: Employee) {
  const user = employee.userId;

  if (user && typeof user !== "string") {
    const name =
      user.displayName ||
      [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ");

    const companyAccess = employee.companyAccessId;

    const employeeCode =
      companyAccess && typeof companyAccess !== "string"
        ? companyAccess.employeeCode
        : "";

    return employeeCode
      ? `${name || "Employee"} (${employeeCode})`
      : name || "Employee";
  }

  const companyAccess = employee.companyAccessId;

  if (companyAccess && typeof companyAccess !== "string") {
    return companyAccess.employeeCode || "Employee";
  }

  return "Employee";
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
