"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { userService } from "@/features/users/services/user.service";
import {
  createUserSchema,
  type CreateUserFormInput,
  type CreateUserFormValues,
} from "@/features/users/validations/create-user.schema";
import { useAuthStore } from "@/store/auth.store";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

export function CreateUserForm() {
  const router = useRouter();

  const permissions = useAuthStore((state) => state.permissions);

  const canCreate = permissions.includes("admin.create");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),

    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      displayName: "",
      email: "",
      mobile: "",
      profilePhoto: "",
      gender: undefined,
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
      status: "ACTIVE",
    },
    mode: "onBlur",
  });
  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");
  const displayName = watch("displayName");

  const previewName =
    displayName?.trim() ||
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
    "New user";

  async function onSubmit(values: CreateUserFormValues) {
    if (!canCreate) {
      toast.error("You do not have permission to create users.");
      return;
    }

    try {
      const { confirmPassword: _confirmPassword, ...payload } = values;

      await userService.createUser({
        firstName: payload.firstName,
        middleName: payload.middleName,
        lastName: payload.lastName,
        displayName: payload.displayName,
        email: payload.email,
        mobile: payload.mobile,
        password: payload.password,
        profilePhoto: payload.profilePhoto,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
        status: payload.status,
      });

      toast.success(`${previewName} created successfully.`);

      router.push("/users");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create the user."));
    }
  }

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Access denied
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          You do not have permission to create user accounts.
        </p>

        <Link
          href="/users"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/users"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Back to users"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Create User
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Create a new application login account. Company access and
              employee details can be assigned afterward.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            User preview
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-blue-950">
            {previewName}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Basic information
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Enter the users legal and display names.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <div>
            <label htmlFor="firstName" className={labelClassName}>
              First name <span className="text-red-500">*</span>
            </label>

            <input
              id="firstName"
              type="text"
              placeholder="Enter first name"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("firstName")}
            />

            {errors.firstName && (
              <p className={errorClassName}>{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="middleName" className={labelClassName}>
              Middle name
            </label>

            <input
              id="middleName"
              type="text"
              placeholder="Enter middle name"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("middleName")}
            />

            {errors.middleName && (
              <p className={errorClassName}>{errors.middleName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className={labelClassName}>
              Last name <span className="text-red-500">*</span>
            </label>

            <input
              id="lastName"
              type="text"
              placeholder="Enter last name"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("lastName")}
            />

            {errors.lastName && (
              <p className={errorClassName}>{errors.lastName.message}</p>
            )}
          </div>

          <div className="sm:col-span-2 xl:col-span-3">
            <label htmlFor="displayName" className={labelClassName}>
              Display name
            </label>

            <input
              id="displayName"
              type="text"
              placeholder="Leave empty to generate from the user's name"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("displayName")}
            />

            {errors.displayName && (
              <p className={errorClassName}>{errors.displayName.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Contact information
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Add login email and optional contact details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email address <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                disabled={isSubmitting}
                className={`${inputClassName} pl-10`}
                {...register("email")}
              />
            </div>

            {errors.email && (
              <p className={errorClassName}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="mobile" className={labelClassName}>
              Mobile number
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                disabled={isSubmitting}
                className={`${inputClassName} pl-10`}
                {...register("mobile")}
              />
            </div>

            {errors.mobile && (
              <p className={errorClassName}>{errors.mobile.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="profilePhoto" className={labelClassName}>
              Profile photo URL
            </label>

            <input
              id="profilePhoto"
              type="url"
              placeholder="https://example.com/profile-photo.jpg"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("profilePhoto")}
            />

            {errors.profilePhoto && (
              <p className={errorClassName}>{errors.profilePhoto.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Personal information
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Optional personal details for the user account.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="gender" className={labelClassName}>
              Gender
            </label>

            <select
              id="gender"
              disabled={isSubmitting}
              className={selectClassName}
              {...register("gender")}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>

            {errors.gender && (
              <p className={errorClassName}>{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dateOfBirth" className={labelClassName}>
              Date of birth
            </label>

            <input
              id="dateOfBirth"
              type="date"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("dateOfBirth")}
            />

            {errors.dateOfBirth && (
              <p className={errorClassName}>{errors.dateOfBirth.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Security and status
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Set the initial login password and account status.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="password" className={labelClassName}>
              Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter secure password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${inputClassName} pr-11`}
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={isSubmitting}
                className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className={errorClassName}>{errors.password.message}</p>
            )}

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use at least 8 characters with uppercase, lowercase, number and
              special character.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClassName}>
              Confirm password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${inputClassName} pr-11`}
                {...register("confirmPassword")}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                disabled={isSubmitting}
                className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
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
              <p className={errorClassName}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="status" className={labelClassName}>
              Account status <span className="text-red-500">*</span>
            </label>

            <select
              id="status"
              disabled={isSubmitting}
              className={selectClassName}
              {...register("status")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {errors.status && (
              <p className={errorClassName}>{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <p className="mb-3 text-xs leading-5 text-slate-500 sm:mb-0 sm:max-w-lg">
          Creating this record only creates the login account. Company access,
          role and employee profile can be assigned in the next steps.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href="/users"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating user...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create user
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
