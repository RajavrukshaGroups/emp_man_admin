"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  Edit3,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { useUser } from "@/features/users/hooks/use-user";
import { useAuthStore } from "@/store/auth.store";

function formatDate(value?: string | null) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatGender(value?: string | null) {
  if (!value) {
    return "Not provided";
  }

  const genderLabels: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
  };

  return genderLabels[value] ?? value;
}

function getStatusStyles(status?: string) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "INACTIVE":
      return {
        label: "Inactive",
        icon: XCircle,
        className: "border-slate-200 bg-slate-100 text-slate-700",
      };

    case "SUSPENDED":
      return {
        label: "Suspended",
        icon: Ban,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };

    default:
      return {
        label: status ?? "Unknown",
        icon: XCircle,
        className: "border-slate-200 bg-slate-100 text-slate-700",
      };
  }
}

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

interface VerificationBadgeProps {
  verified: boolean;
  verifiedText: string;
  unverifiedText: string;
}

function VerificationBadge({
  verified,
  verifiedText,
  unverifiedText,
}: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {verified ? (
        <BadgeCheck className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}

      {verified ? verifiedText : unverifiedText}
    </span>
  );
}

export default function UserDetailsPage() {
  const params = useParams<{ userId: string }>();

  const userId = params.userId;

  const permissions = useAuthStore((state) => state.permissions);

  const canRead = permissions.includes("admin.read");
  const canUpdate = permissions.includes("admin.update");

  const { data: user, isLoading, error, refetch } = useUser(userId);

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Access denied
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          You do not have permission to view user accounts.
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

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle className="h-7 w-7" />
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
          The requested user may have been removed or does not exist.
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

  const status = getStatusStyles(user.status);
  const StatusIcon = status.icon;

  const fullName =
    user.displayName?.trim() ||
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((name) => name.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
              User Details
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              View account, contact, security and verification information.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          {canUpdate && (
            <Link
              href={`/users/${userId}/edit`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit user
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-2xl font-bold text-white">
              {user.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profilePhoto}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <h2 className="truncate text-2xl font-bold text-white">
                  {fullName}
                </h2>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              </div>

              <p className="mt-2 break-all text-sm text-slate-300">
                {user.email}
              </p>

              <p className="mt-1 text-xs text-slate-400">User ID: {user._id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <DetailItem
            label="First name"
            value={user.firstName || "Not provided"}
          />

          <DetailItem
            label="Middle name"
            value={user.middleName || "Not provided"}
          />

          <DetailItem
            label="Last name"
            value={user.lastName || "Not provided"}
          />

          <DetailItem
            label="Display name"
            value={user.displayName || "Not provided"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Contact information
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Email and mobile contact details.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email address
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                  {user.email}
                </p>
              </div>

              <VerificationBadge
                verified={user.emailVerified}
                verifiedText="Verified"
                unverifiedText="Not verified"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Mobile number
                  </p>
                </div>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {user.mobile || "Not provided"}
                </p>
              </div>

              {user.mobile && (
                <VerificationBadge
                  verified={user.mobileVerified}
                  verifiedText="Verified"
                  unverifiedText="Not verified"
                />
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
                  Personal and demographic details.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <DetailItem label="Gender" value={formatGender(user.gender)} />

            <DetailItem
              label="Date of birth"
              value={formatDate(user.dateOfBirth)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Account activity
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Security and account lifecycle information.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <DetailItem label="Account status" value={status.label} />

          <DetailItem
            label="Last login"
            value={formatDateTime(user.lastLoginAt)}
          />

          <DetailItem
            label="Password changed"
            value={formatDateTime(user.passwordChangedAt)}
          />

          <DetailItem
            label="Account created"
            value={formatDateTime(user.createdAt)}
          />

          <DetailItem
            label="Last updated"
            value={formatDateTime(user.updatedAt)}
          />

          <DetailItem label="Deleted" value={user.isDeleted ? "Yes" : "No"} />
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center sm:px-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-950">
          Company access not assigned yet
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          After the account is created, company access, role, department, team
          and employee profile can be assigned separately.
        </p>
      </section>
    </div>
  );
}
