"use client";

import { Loader2, Power, PowerOff, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { companyAdministratorService } from "../services/company-administrator.service";

interface CompanyAdministratorStatusDialogProps {
  companyId: string;
  administratorName: string;
  currentStatus: "ACTIVE" | "INACTIVE";
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

export function CompanyAdministratorStatusDialog({
  companyId,
  administratorName,
  currentStatus,
  isOpen,
  onClose,
  onUpdated,
}: CompanyAdministratorStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const isDeactivating = nextStatus === "INACTIVE";

  const handleStatusUpdate = async () => {
    try {
      setIsSubmitting(true);

      await companyAdministratorService.updateCompanyAdministratorStatus(
        companyId,
        nextStatus,
      );

      toast.success(
        isDeactivating
          ? "Company administrator deactivated successfully."
          : "Company administrator activated successfully.",
      );

      await onUpdated();

      onClose();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isDeactivating
            ? "Unable to deactivate company administrator."
            : "Unable to activate company administrator.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isDeactivating
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isDeactivating ? (
                <PowerOff className="h-5 w-5" />
              ) : (
                <Power className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {isDeactivating
                  ? "Deactivate administrator"
                  : "Activate administrator"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {isDeactivating
                  ? `${administratorName} will no longer be able to access the company account.`
                  : `${administratorName} will regain access to the company account.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div
            className={`rounded-xl border p-4 ${
              isDeactivating
                ? "border-red-200 bg-red-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                isDeactivating ? "text-red-900" : "text-emerald-900"
              }`}
            >
              {isDeactivating
                ? "The administrator will be blocked from signing in."
                : "The administrator will be allowed to sign in again."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleStatusUpdate()}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isDeactivating
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isDeactivating ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
