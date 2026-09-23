"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Plus,
  Settings2,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

export default function LeavePage() {
  const company = useAuthStore((state) => state.company);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);

  const canApply = permissions.includes("leave.apply");
  const canRead = permissions.includes("leave.read");

  const canRecommend = permissions.includes("leave.recommend");
  const canApprove = permissions.includes("leave.approve");
  const canReject = permissions.includes("leave.reject");

  const canReadTypes = permissions.includes("leave.type_read");
  const canManageTypes = permissions.includes("leave.type_manage");

  const canReadBalances = permissions.includes("leave.balance_read");
  const canManageBalances = permissions.includes("leave.balance_manage");

  const isCompanyAdministrator = role?.code === "COMPANY_ADMIN";

  const canReviewRequests = canRecommend || canApprove || canReject;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Leave Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {isCompanyAdministrator
                ? `Manage leave policies, employee balances and requests${
                    company?.name ? ` for ${company.name}` : ""
                  }.`
                : canReviewRequests
                  ? "Manage your leave and review requests within your authorized scope."
                  : "View your leave balances, apply for leave and track your requests."}
            </p>
          </div>
        </div>

        {canApply && (
          <Link
            href="/leave/apply"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Apply Leave
          </Link>
        )}
      </div>

      {/* =====================================================
          MAIN ACTIONS
         ===================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {canRead && (
          <LeaveNavigationCard
            title={canReviewRequests ? "Leave Requests" : "My Leave Requests"}
            description={
              canReviewRequests
                ? "Review your leave requests and requests visible within your authorized scope."
                : "Track your submitted, approved, rejected and cancelled leave requests."
            }
            href="/leave/requests"
            icon={ClipboardCheck}
          />
        )}

        {canReadBalances && (
          <LeaveNavigationCard
            title="Leave Balances"
            description={
              canManageBalances
                ? "Review and manage employee leave balances and allocations."
                : canReviewRequests
                  ? "Review your leave balance and balances available within your authorized scope."
                  : "Review your available, pending and used leave balance."
            }
            href="/leave/balances"
            icon={WalletCards}
          />
        )}

        {canReadTypes && (
          <LeaveNavigationCard
            title={canManageTypes ? "Leave Types" : "Leave Types"}
            description={
              canManageTypes
                ? "Configure leave types, entitlement rules and allocation methods."
                : "View the leave types available in your company."
            }
            href="/leave/types"
            icon={FileText}
          />
        )}

        {isCompanyAdministrator && (
          <LeaveNavigationCard
            title="Leave Policies"
            description="Configure leave-year rules, approval workflow and cancellation settings."
            href="/leave/policies"
            icon={Settings2}
          />
        )}
      </div>

      {/* =====================================================
          ROLE / WORKFLOW INFORMATION
         ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <SlidersHorizontal className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Leave workspace</h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Available actions are based on your company role and assigned
                permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          <WorkspaceInfo
            label="Company"
            value={company?.name ?? "Not selected"}
          />

          <WorkspaceInfo label="Role" value={role?.name ?? "Not assigned"} />

          <WorkspaceInfo
            label="Request access"
            value={
              canReviewRequests
                ? "Review & manage"
                : canApply
                  ? "Self service"
                  : "Read only"
            }
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   NAVIGATION CARD
   ========================================================= */

function LeaveNavigationCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof CalendarDays;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-6"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
        <Icon className="h-5 w-5" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-950">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-5 text-sm font-semibold text-slate-900">Open →</div>
    </Link>
  );
}

/* =========================================================
   WORKSPACE INFO
   ========================================================= */

function WorkspaceInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
