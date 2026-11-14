"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { acceptInvitation } from "@/features/auth/api";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "@/features/auth/validation";
import { getApiErrorMessage } from "@/lib/axios";

export function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasValidTokenFormat = Boolean(token && /^[a-f0-9]{64}$/i.test(token));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: AcceptInvitationFormValues) => {
    if (isSubmitting || isSuccess || !token || !hasValidTokenFormat) return;

    setIsSubmitting(true);

    try {
      await acceptInvitation({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      setIsSuccess(true);
      toast.success("Your account password has been created successfully.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to accept your invitation. The link may have expired or already been used.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasValidTokenFormat) {
    return (
      <div className="space-y-5">
        <p role="alert" className="text-sm leading-6 text-red-600">
          This invitation link is missing or invalid. Please contact your
          company administrator or HR team to request a new invitation.
        </p>

        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-5">
        <div
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <CheckCircle2 className="mb-3 text-green-600" size={26} />

          <p className="font-semibold text-slate-900">
            Account setup completed
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your login password has been created successfully. You can now sign
            in to your Employee Management account.
          </p>
        </div>

        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="invitationNewPassword"
          className="text-sm font-medium text-slate-700"
        >
          Create password
        </label>

        <div className="relative">
          <input
            id="invitationNewPassword"
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create your password"
            {...register("newPassword")}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          <button
            type="button"
            onClick={() => setShowNewPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.newPassword && (
          <p className="text-sm text-red-600" role="alert">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="invitationConfirmPassword"
          className="text-sm font-medium text-slate-700"
        >
          Confirm password
        </label>

        <div className="relative">
          <input
            id="invitationConfirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.confirmPassword && (
          <p className="text-sm text-red-600" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        Use at least 8 characters, including an uppercase letter, lowercase
        letter, number, and special character.
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isFormSubmitting || isSuccess}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {(isSubmitting || isFormSubmitting) && (
          <Loader2 size={18} className="animate-spin" />
        )}

        {isSubmitting || isFormSubmitting
          ? "Creating your password..."
          : "Complete account setup"}
      </button>

      <Link
        href="/login"
        className="block text-center text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Back to login
      </Link>
    </form>
  );
}
