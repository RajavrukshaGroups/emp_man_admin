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

import { leaveBalanceService } from "@/features/leave/services/leave-balance.service";
import type { LeaveBalance } from "@/features/leave/types/leave.types";

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

        <button
          type="button"
          onClick={() => void loadBalances()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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
              />
            ))}
          </div>
        </section>
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
}: {
  balance: LeaveBalance;
  canManage: boolean;
  onAdjust: () => void;
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
          <button
            type="button"
            onClick={onAdjust}
            className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Adjust Balance
          </button>
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

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
