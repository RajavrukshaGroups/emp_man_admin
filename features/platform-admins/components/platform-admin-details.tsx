"use client";

import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RefreshCcw,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { platformAdminService } from "../services/platform-admin.service";

import type {
  PlatformAdmin,
  PlatformAdminStatus,
} from "../types/platform-admin.types";

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve platform administrator.",
) {
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusClassNames: Record<PlatformAdminStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",

  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",

  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
};

export function PlatformAdminDetails({
  platformAccessId,
}: {
  platformAccessId: string;
}) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadAdmin = useCallback(async () => {
    try {
      setIsLoading(true);

      const result =
        await platformAdminService.getPlatformAdminById(platformAccessId);

      setAdmin(result);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [platformAccessId]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  async function handleStatusChange(status: PlatformAdminStatus) {
    if (!admin) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      const updatedAdmin = await platformAdminService.updatePlatformAdminStatus(
        admin._id,
        status,
      );

      setAdmin(updatedAdmin);

      toast.success(
        status === "ACTIVE"
          ? "Platform administrator activated successfully."
          : status === "SUSPENDED"
            ? "Platform administrator suspended successfully."
            : "Platform administrator deactivated successfully.",
      );
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to update administrator status."),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <h2 className="text-xl font-bold text-red-900">
          Platform administrator not found
        </h2>

        <Link
          href="/platform/admins"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
        >
          Back to platform administrators
        </Link>
      </div>
    );
  }

  const user = admin.userId;
  const role = admin.roleId;

  const displayName =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link
            href="/platform/admins"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to platform administrators
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Platform administrator details
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View platform identity, GLOBAL access and account information.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadAdmin()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            href={`/platform/admins/${admin._id}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Pencil className="h-4 w-4" />
            Edit administrator
          </Link>

          <Link
            href={`/platform/admins/${admin._id}/reset-password`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <KeyRound className="h-4 w-4" />
            Reset password
          </Link>

          {admin.status === "ACTIVE" ? (
            <>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void handleStatusChange("SUSPENDED")}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Suspend
              </button>

              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void handleStatusChange("INACTIVE")}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Deactivate
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("ACTIVE")}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              Activate
            </button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-7 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl font-bold">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{displayName}</h2>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusClassNames[admin.status]
                  }`}
                >
                  {admin.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                {role.name} ({role.code})
              </p>

              <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user.mobile || "No mobile"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <InfoCell label="Access scope" value={role.scopeType} />

          <InfoCell
            label="Last login"
            value={formatDateTime(user.lastLoginAt)}
          />

          <InfoCell label="Created" value={formatDateTime(admin.createdAt)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailsCard icon={UserCog} title="Account information">
          <DetailsRow label="First name" value={user.firstName} />

          <DetailsRow label="Middle name" value={user.middleName || "—"} />

          <DetailsRow label="Last name" value={user.lastName} />

          <DetailsRow label="Display name" value={displayName} />

          <DetailsRow
            label="Email verified"
            value={user.emailVerified ? "Yes" : "No"}
          />

          <DetailsRow
            label="Mobile verified"
            value={user.mobileVerified ? "Yes" : "No"}
          />
        </DetailsCard>

        <DetailsCard icon={ShieldCheck} title="Platform access">
          <DetailsRow label="Role" value={role.name} />

          <DetailsRow label="Role code" value={role.code} />

          <DetailsRow label="Scope" value={role.scopeType} />

          <DetailsRow label="Role status" value={role.status} />

          <DetailsRow label="Access status" value={admin.status} />

          <DetailsRow label="Updated" value={formatDateTime(admin.updatedAt)} />
        </DetailsCard>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 p-5 md:border-l md:first:border-l-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailsCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <h2 className="font-bold text-slate-950">{title}</h2>
      </div>

      <div className="divide-y divide-slate-100 px-5">{children}</div>
    </section>
  );
}

function DetailsRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
