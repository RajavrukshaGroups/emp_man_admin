"use client";

import {
  Building2,
  CalendarDays,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name?: string) {
  if (!name) {
    return "NA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const companyAccess = useAuthStore((state) => state.companyAccess);
  const role = useAuthStore((state) => state.role);
  const changePassword = useAuthStore((state) => state.changePassword);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from your current password.");
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success("Password changed successfully. Please log in again.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to change password.";

      toast.error(message);
    }
  }

  const displayName =
    user?.displayName ||
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your personal, employment and account information.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={displayName}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700">
              {getInitials(displayName)}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-slate-950">{displayName}</h2>

            <p className="mt-1 text-sm font-medium text-slate-600">
              {companyAccess?.designation || role?.name || "Employee"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {role?.name && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {role.name}
                </span>
              )}

              {companyAccess?.status && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {companyAccess.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileSection title="Personal information">
          <ProfileItem icon={UserRound} label="Full name" value={displayName} />

          <ProfileItem icon={Mail} label="Email" value={user?.email || "—"} />

          <ProfileItem
            icon={Phone}
            label="Mobile"
            value={user?.mobile || "—"}
          />

          <ProfileItem
            icon={CalendarDays}
            label="Date of birth"
            value={formatDate(user?.dateOfBirth)}
          />
        </ProfileSection>

        <ProfileSection title="Employment information">
          <ProfileItem
            icon={ShieldCheck}
            label="Employee code"
            value={companyAccess?.employeeCode || "—"}
          />

          <ProfileItem
            icon={UserRound}
            label="Designation"
            value={companyAccess?.designation || "—"}
          />

          <ProfileItem
            icon={Building2}
            label="Company"
            value={company?.name || "—"}
          />

          <ProfileItem
            icon={ShieldCheck}
            label="Role"
            value={role?.name || "—"}
          />

          <ProfileItem
            icon={UsersRound}
            label="Employment type"
            value={formatLabel(companyAccess?.employmentType)}
          />

          <ProfileItem
            icon={CalendarDays}
            label="Joining date"
            value={formatDate(companyAccess?.joiningDate)}
          />

          <ProfileItem
            icon={MapPin}
            label="Work location"
            value={companyAccess?.workLocationName || "—"}
          />

          <ProfileItem
            icon={Building2}
            label="Work location type"
            value={formatLabel(companyAccess?.workLocationType)}
          />
        </ProfileSection>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Change password
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="grid gap-5 lg:grid-cols-3"
        >
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />

              {isLoading ? "Changing password..." : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>

      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}
