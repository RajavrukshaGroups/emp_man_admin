"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { companyAdministratorService } from "../services/company-administrator.service";

import {
  companyAdministratorResetPasswordSchema,
  type CompanyAdministratorResetPasswordFormValues,
} from "../validations/company-administrator-reset-password.schema";

interface CompanyAdministratorResetPasswordDialogProps {
  companyId: string;
  administratorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyAdministratorResetPasswordDialog({
  companyId,
  administratorName,
  isOpen,
  onClose,
}: CompanyAdministratorResetPasswordDialogProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyAdministratorResetPasswordFormValues>({
    resolver: zodResolver(companyAdministratorResetPasswordSchema),

    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }

    reset();

    setShowNewPassword(false);

    setShowConfirmPassword(false);

    onClose();
  };

  const onSubmit = async (
    values: CompanyAdministratorResetPasswordFormValues,
  ) => {
    try {
      await companyAdministratorService.resetCompanyAdministratorPassword(
        companyId,
        {
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        },
      );

      toast.success("Company administrator password reset successfully.");

      reset();

      setShowNewPassword(false);

      setShowConfirmPassword(false);

      onClose();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to reset company administrator password.",
        ),
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-administrator-password-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="reset-administrator-password-title"
                className="text-lg font-bold text-slate-950"
              >
                Reset administrator password
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Set a new login password for {administratorName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={closeDialog}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close reset password dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 p-5"
          noValidate
        >
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              New password
            </label>

            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder="Enter new password"
                {...register("newPassword")}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder="Re-enter new password"
                {...register("confirmPassword")}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              The administrator must use the new password on their next login.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={closeDialog}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Reset password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
