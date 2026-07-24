"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useUser } from "@/features/users/hooks/use-user";
import { userService } from "@/features/users/services/user.service";
import {
  editUserSchema,
  type EditUserFormInput,
  type EditUserFormValues,
} from "@/features/users/validations/edit-user.schema";
import { useAuthStore } from "@/store/auth.store";

interface EditUserFormProps {
  userId: string;
}

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

function formatDateForInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClassName = "mb-2 block text-sm font-semibold text-slate-700";

const errorClassName = "mt-1.5 text-xs font-medium text-red-600";

export function EditUserForm({ userId }: EditUserFormProps) {
  const router = useRouter();

  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("admin.read");
  const canUpdate = permissions.includes("admin.update");

  const { data: user, isLoading, error, refetch } = useUser(userId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditUserFormInput, unknown, EditUserFormValues>({
    resolver: zodResolver(editUserSchema),

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
    },

    mode: "onBlur",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    reset({
      firstName: user.firstName ?? "",
      middleName: user.middleName ?? "",
      lastName: user.lastName ?? "",
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      mobile: user.mobile ?? "",
      profilePhoto: user.profilePhoto ?? "",
      gender: user.gender ?? undefined,
      dateOfBirth: formatDateForInput(user.dateOfBirth),
    });
  }, [reset, user]);

  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");
  const displayName = watch("displayName");

  const previewName =
    displayName?.trim() ||
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
    "User";

  async function onSubmit(values: EditUserFormValues) {
    if (!canUpdate) {
      toast.error("You do not have permission to update users.");

      return;
    }

    try {
      await userService.updateUser(userId, {
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        displayName: values.displayName,
        email: values.email,
        mobile: values.mobile,
        profilePhoto: values.profilePhoto,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
      });

      toast.success(`${previewName} updated successfully.`);

      router.push(`/users/${userId}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update the user."));
    }
  }

  if (!canRead || !canUpdate) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Access denied
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          You do not have permission to update user accounts.
        </p>

        <Link
          href={`/users/${userId}`}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to user details
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <UserRound className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Unable to load user
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {error}
        </p>

        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/users"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>

          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRound className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          User not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The requested user does not exist or may have been removed.
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
            href={`/users/${userId}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Back to user details"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Edit User
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Update the account and personal information for this user.
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                Update the user&apos;s legal and display names.
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
              placeholder="Leave empty to use the full name"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("displayName")}
            />

            {errors.displayName && (
              <p className={errorClassName}>{errors.displayName.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                Update login email and contact details.
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                Update optional personal details.
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
      </section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <p className="mb-3 text-xs leading-5 text-slate-500 sm:mb-0 sm:max-w-lg">
          Changes to email or mobile may reset their verification status
          depending on backend rules.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/users/${userId}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
