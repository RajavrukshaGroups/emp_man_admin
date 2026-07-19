"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/validation";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export function LoginForm() {
  const router = useRouter();

  const login = useAuthStore(
    (state) => state.login,
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading,
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      identifier: "",
      password: "",
      companyId: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (
    values: LoginFormValues,
  ) => {
    try {
      await login({
        identifier: values.identifier,
        password: values.password,
        companyId:
          values.companyId?.trim() || undefined,
        rememberMe: values.rememberMe,
      });

      toast.success("Login successful.");

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to log in. Please check your credentials.",
        ),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-slate-700"
        >
          Email or mobile number
        </label>

        <input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="Enter email or mobile number"
          {...register("identifier")}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        {errors.identifier && (
          <p className="text-sm text-red-600">
            {errors.identifier.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            type={
              showPassword ? "text" : "password"
            }
            autoComplete="current-password"
            placeholder="Enter password"
            {...register("password")}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {errors.password && (
          <p className="text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="companyId"
          className="text-sm font-medium text-slate-700"
        >
          Company ID
          <span className="ml-1 font-normal text-slate-400">
            optional
          </span>
        </label>

        <input
          id="companyId"
          type="text"
          placeholder="Enter company ID"
          {...register("companyId")}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        {errors.companyId && (
          <p className="text-sm text-red-600">
            {errors.companyId.message}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          {...register("rememberMe")}
          className="h-4 w-4 rounded border-slate-300"
        />

        <span className="text-sm text-slate-600">
          Remember me
        </span>
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && (
          <Loader2
            size={18}
            className="animate-spin"
          />
        )}

        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}