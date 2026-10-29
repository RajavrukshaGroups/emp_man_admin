
"use client";

import {
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  ShieldAlert,
  Settings2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import {
  getCompanyEmailSettings,
  saveCompanyEmailSettings,
  verifyCompanyEmailSettings,
  updateCompanyEmailStatus,
  type CompanyEmailSettings,
  type EmailProvider,
} from "@/features/settings/services/company-email-settings.service";

export default function SettingsPage() {
  const company = useAuthStore((state) => state.company);
  const accessType = useAuthStore((state) => state.accessType);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  const isCompanyAdmin =
    accessType === "COMPANY" &&
    role?.code === "COMPANY_ADMIN" &&
    role?.scopeType === "COMPANY";

  const canRead =
    isCompanyAdmin && permissions.includes("settings.read");

  const canUpdate =
    isCompanyAdmin && permissions.includes("settings.update");

  const companyId = canRead ? company?._id : undefined;


  const [settings, setSettings] =
    useState<CompanyEmailSettings | null>(null);

  const [provider, setProvider] =
    useState<EmailProvider>("GOOGLE_WORKSPACE");

  const [email, setEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromName, setFromName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!companyId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSettings(null);

    try {
      const data = await getCompanyEmailSettings(companyId);

      setSettings(data);

      if (data) {
        setProvider(data.provider);
        setEmail(data.smtpUser);
        setFromName(data.fromName);
      } else {
        setProvider("GOOGLE_WORKSPACE");
        setEmail("");
        setFromName("");
      }

      setSmtpPassword("");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load email configuration.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (isHydrated && !isInitializing) {
      void loadSettings();
    }
  }, [isHydrated, isInitializing, loadSettings]);

  const isBusy =
    isSaving || isVerifying || isUpdatingStatus;

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!companyId || !canUpdate || isBusy) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fromName.trim();

    if (!normalizedEmail || !smtpPassword || !normalizedName) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (normalizedName.length < 2) {
      toast.error("Sender name must contain at least 2 characters.");
      return;
    }

    setIsSaving(true);

    try {
      const updated = await saveCompanyEmailSettings(
        companyId,
        {
          provider,
          smtpUser: normalizedEmail,
          smtpPassword,
          fromEmail: normalizedEmail,
          fromName: normalizedName,
        },
      );

      setSettings(updated);
      setEmail(updated.smtpUser);
      setFromName(updated.fromName);
      setSmtpPassword("");
      setIsEditing(false);

      toast.success(
        "SMTP configuration saved. Verify the credentials before enabling email delivery.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to save SMTP configuration.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVerify() {
    if (!companyId || !settings || !canUpdate || isBusy) return;

    setIsVerifying(true);

    try {
      const updated =
        await verifyCompanyEmailSettings(companyId);

      setSettings(updated);
      toast.success("SMTP credentials verified successfully.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "SMTP verification failed.",
        ),
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleStatusChange() {
    if (!companyId || !settings || !canUpdate || isBusy) return;

    const nextStatus = !settings.isEnabled;

    setIsUpdatingStatus(true);

    try {
      const updated = await updateCompanyEmailStatus(
        companyId,
        nextStatus,
      );

      setSettings(updated);

      toast.success(
        nextStatus
          ? "Company email delivery enabled."
          : "Company email delivery disabled.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update email delivery status.",
        ),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (!isHydrated || isInitializing || isLoading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!canRead || !companyId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8">
        <ShieldAlert className="mb-4 h-8 w-8 text-rose-500" />
        <h1 className="text-xl font-semibold text-slate-950">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Only authorized Company Administrators can view
          company email settings.
        </p>
      </div>
    );
  }

  const showForm = !settings || isEditing;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Company Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage configuration for {company?.name}.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Email Configuration
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure SMTP for password recovery and
                company notifications.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              settings?.isEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {settings?.isEnabled
              ? "Email delivery enabled"
              : settings
                ? "Email delivery disabled"
                : "Not configured"}
          </span>
        </div>

        {settings && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <StatusCard
              label="SMTP verification"
              value={
                settings.isVerified
                  ? "Verified"
                  : "Not verified"
              }
              positive={settings.isVerified}
            />

            <StatusCard
              label="Email delivery"
              value={
                settings.isEnabled
                  ? "Enabled"
                  : "Disabled"
              }
              positive={settings.isEnabled}
            />
          </div>
        )}

        {showForm ? (
          <form
            onSubmit={handleSave}
            className="mt-6 space-y-5 border-t border-slate-100 pt-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  SMTP provider
                </span>
                <select
                  value={provider}
                  onChange={(event) =>
                    setProvider(
                      event.target.value as EmailProvider,
                    )
                  }
                  disabled={!canUpdate || isBusy}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="GOOGLE_WORKSPACE">
                    Google Workspace
                  </option>
                  <option value="MICROSOFT_365">
                    Microsoft 365
                  </option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Email address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="hr@company.com"
                  required
                  maxLength={254}
                  disabled={!canUpdate || isBusy}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  SMTP app password / credential
                </span>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(event) =>
                    setSmtpPassword(event.target.value)
                  }
                  placeholder="Enter SMTP credential"
                  required
                  maxLength={1024}
                  autoComplete="new-password"
                  disabled={!canUpdate || isBusy}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500">
                  The saved credential is never displayed.
                  Replacing configuration requires a new credential.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Sender display name
                </span>
                <input
                  type="text"
                  value={fromName}
                  onChange={(event) =>
                    setFromName(event.target.value)
                  }
                  placeholder="Company HR"
                  required
                  minLength={2}
                  maxLength={150}
                  disabled={!canUpdate || isBusy}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {canUpdate && (
                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving
                    ? "Saving..."
                    : "Save configuration"}
                </button>
              )}

              {settings && isEditing && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setProvider(settings.provider);
                    setEmail(settings.smtpUser);
                    setFromName(settings.fromName);
                    setSmtpPassword("");
                    setIsEditing(false);
                  }}
                  className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Provider"
                value={
                  settings.provider === "GOOGLE_WORKSPACE"
                    ? "Google Workspace"
                    : "Microsoft 365"
                }
              />
              <DetailItem
                label="Email address"
                value={settings.smtpUser}
              />
              <DetailItem
                label="Sender name"
                value={settings.fromName}
              />
              <DetailItem
                label="SMTP server"
                value={`${settings.smtpHost}:${settings.smtpPort}`}
              />
              <DetailItem
                label="Credential"
                value="Stored securely (hidden)"
              />
              <DetailItem
                label="Last verified"
                value={
                  settings.lastVerifiedAt
                    ? new Date(
                        settings.lastVerifiedAt,
                      ).toLocaleString()
                    : "Never"
                }
              />
            </div>

            {canUpdate && (
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isBusy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Settings2 className="h-4 w-4" />
                  Replace configuration
                </button>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isBusy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {isVerifying
                    ? "Verifying..."
                    : "Verify SMTP"}
                </button>

                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={
                    isBusy ||
                    (!settings.isEnabled &&
                      !settings.isVerified)
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isUpdatingStatus && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {settings.isEnabled
                    ? "Disable email delivery"
                    : "Enable email delivery"}
                </button>
              </div>
            )}
          </div>
        )}

        {!settings && (
          <p className="mt-5 text-sm text-slate-500">
            Save your SMTP configuration, verify the credentials,
            and enable email delivery to activate company emails.
          </p>
        )}
      </section>
    </div>
  );
}

function StatusCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {positive ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600" />
        )}
        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
