
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { forgotPassword } from "@/features/auth/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/validation";
import { getApiErrorMessage } from "@/lib/axios";

const successMessage =
  "If the account exists and is eligible for password recovery, a reset link will be sent to the email address.";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await forgotPassword({
        email: values.email.trim(),
      });

      setIsSubmitted(true);
      toast.success("Password recovery request submitted.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to process your request. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <div
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <Mail className="mb-3 text-slate-700" size={24} />

          <p className="text-sm leading-6 text-slate-700">
            {successMessage}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Please check your inbox and spam folder.
            The reset link expires after 15 minutes.
          </p>
        </div>

        <Link
          href="/login"
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-slate-700"
        >
          Email address
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your registered email"
          {...register("email")}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        {errors.email && (
          <p className="text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && (
          <Loader2 size={18} className="animate-spin" />
        )}

        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>
    </form>
  );
}
