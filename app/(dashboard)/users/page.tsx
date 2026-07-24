"use client";

import axios from "axios";
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ResetPasswordDialog } from "@/features/users/components/reset-password-dialog";
import { UserStatusDialog } from "@/features/users/components/user-status-dialog";
import { UserTable } from "@/features/users/components/user-table";
import { useUsers } from "@/features/users/hooks/use-users";
import { userService } from "@/features/users/services/user.service";
import type {
  User,
  UserGender,
  UserStatus,
} from "@/features/users/types/user.types";
import { useAuthStore } from "@/store/auth.store";

const PAGE_LIMIT = 10;

const STATUS_OPTIONS: Array<{
  value: UserStatus;
  label: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
  },
];

const GENDER_OPTIONS: Array<{
  value: UserGender;
  label: string;
}> = [
  {
    value: "MALE",
    label: "Male",
  },
  {
    value: "FEMALE",
    label: "Female",
  },
  {
    value: "OTHER",
    label: "Other",
  },
  {
    value: "PREFER_NOT_TO_SAY",
    label: "Prefer not to say",
  },
];

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export default function UsersPage() {
  const permissions = useAuthStore((state) => state.permissions);

  const currentUserId = useAuthStore((state) => state.user?._id);

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");

  const [genderFilter, setGenderFilter] = useState<UserGender | "">("");

  const [emailVerificationFilter, setEmailVerificationFilter] = useState<
    "" | "true" | "false"
  >("");

  const [mobileVerificationFilter, setMobileVerificationFilter] = useState<
    "" | "true" | "false"
  >("");

  const [selectedStatusUser, setSelectedStatusUser] = useState<User | null>(
    null,
  );

  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);

  const [selectedResetPasswordUser, setSelectedResetPasswordUser] =
    useState<User | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useUsers({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    gender: genderFilter || undefined,
    emailVerified:
      emailVerificationFilter === ""
        ? undefined
        : emailVerificationFilter === "true",
    mobileVerified:
      mobileVerificationFilter === ""
        ? undefined
        : mobileVerificationFilter === "true",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  /*
   * The backend permission seed previously used the
   * "admin" module for account administration.
   *
   * The user.* alternatives are also included so this
   * page continues working if the permission module is
   * later renamed to "user".
   */

  const canRead = permissions.includes("admin.read");

  const canCreate = permissions.includes("admin.create");

  const canUpdate = permissions.includes("admin.update");

  const canDeactivate = permissions.includes("admin.deactivate");

  /*
   * There is currently no dedicated permission for:
   * - admin.delete
   * - admin.reset_password
   *
   * Password reset is treated as an administrative update.
   * Delete is hidden until the backend introduces a clear
   * permission or confirms admin.deactivate should authorize it.
   */
  const canResetPassword = canUpdate;

  const users = data?.records ?? [];

  const pagination = data?.pagination;

  const totalRecords = pagination?.totalRecords ?? 0;

  const totalPages = pagination?.totalPages ?? 1;

  const activeFilterCount = useMemo(() => {
    return [
      statusFilter,
      genderFilter,
      emailVerificationFilter,
      mobileVerificationFilter,
    ].filter(Boolean).length;
  }, [
    emailVerificationFilter,
    genderFilter,
    mobileVerificationFilter,
    statusFilter,
  ]);

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleOpenStatusDialog(user: User, status: UserStatus) {
    setSelectedStatusUser(user);
    setSelectedStatus(status);
  }

  function handleCloseStatusDialog() {
    if (isUpdatingStatus) {
      return;
    }

    setSelectedStatusUser(null);
    setSelectedStatus(null);
  }

  async function handleConfirmStatusChange(user: User, status: UserStatus) {
    try {
      setIsUpdatingStatus(true);

      await userService.updateUserStatus(user._id, {
        status,
      });

      const statusLabel = status.charAt(0) + status.slice(1).toLowerCase();

      toast.success(`User status changed to ${statusLabel}.`);

      handleCloseStatusDialog();

      await refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update user status."));
    } finally {
      setIsUpdatingStatus(false);
      setSelectedStatusUser(null);
      setSelectedStatus(null);
    }
  }

  function handleOpenResetPasswordDialog(user: User) {
    setSelectedResetPasswordUser(user);
  }

  function handleCloseResetPasswordDialog() {
    if (isResettingPassword) {
      return;
    }

    setSelectedResetPasswordUser(null);
  }

  async function handleConfirmResetPassword(user: User, newPassword: string) {
    try {
      setIsResettingPassword(true);

      await userService.resetPassword(user._id, {
        newPassword,
      });

      toast.success(
        `Password reset successfully for ${user.displayName || user.email}.`,
      );

      setSelectedResetPasswordUser(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to reset the password."));
    } finally {
      setIsResettingPassword(false);
    }
  }

  function handleClearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setGenderFilter("");
    setEmailVerificationFilter("");
    setMobileVerificationFilter("");
    setPage(1);
  }

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-gray-950">
          Access denied
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
          You do not have permission to view user accounts. Contact your company
          administrator if you require access.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UsersRound className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                  Users Management
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Create and manage application login accounts, access status
                  and credentials.
                </p>
              </div>
            </div>
          </div>

          {canCreate && (
            <Link
              href="/users/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Create user
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total users</p>

            <p className="mt-2 text-3xl font-bold text-gray-950">
              {isLoading ? "—" : totalRecords}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Matching the current filters
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Current page</p>

            <p className="mt-2 text-3xl font-bold text-gray-950">{page}</p>

            <p className="mt-1 text-xs text-gray-500">
              Out of {Math.max(totalPages, 1)} pages
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Displayed records
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-950">
              {isLoading ? "—" : users.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Maximum {PAGE_LIMIT} per page
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active filters</p>

            <p className="mt-2 text-3xl font-bold text-gray-950">
              {activeFilterCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Search is counted separately
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          {/* Search */}
          <div>
            <label
              htmlFor="user-search"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Search users
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="user-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email or mobile"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="absolute right-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Clear user search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0">
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as UserStatus | "");
                  setPage(1);
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All statuses</option>

                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="gender-filter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Gender
              </label>

              <select
                id="gender-filter"
                value={genderFilter}
                onChange={(event) => {
                  setGenderFilter(event.target.value as UserGender | "");
                  setPage(1);
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All genders</option>

                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="email-verification-filter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email verification
              </label>

              <select
                id="email-verification-filter"
                value={emailVerificationFilter}
                onChange={(event) => {
                  setEmailVerificationFilter(
                    event.target.value as "" | "true" | "false",
                  );
                  setPage(1);
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All emails</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="mobile-verification-filter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Mobile verification
              </label>

              <select
                id="mobile-verification-filter"
                value={mobileVerificationFilter}
                onChange={(event) => {
                  setMobileVerificationFilter(
                    event.target.value as "" | "true" | "false",
                  );
                  setPage(1);
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All mobiles</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!searchInput && !activeFilterCount}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <X className="h-4 w-4" />
              Clear
            </button>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                className={["h-4 w-4", isLoading ? "animate-spin" : ""].join(
                  " ",
                )}
              />
              Refresh
            </button>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-3 text-sm font-medium text-gray-600">
                Loading users...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-950">
              Unable to load users
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (
          <UserTable
            users={users}
            page={pagination?.page ?? page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            currentUserId={currentUserId}
            canRead={canRead}
            canUpdate={canUpdate}
            canActivate={canUpdate}
            canDeactivate={canDeactivate}
            canSuspend={canUpdate}
            canResetPassword={canResetPassword}
            isUpdatingStatus={isUpdatingStatus}
            onPageChange={handlePageChange}
            onStatusChange={handleOpenStatusDialog}
            onResetPassword={handleOpenResetPasswordDialog}
          />
        )}
      </div>

      <UserStatusDialog
        user={selectedStatusUser}
        status={selectedStatus}
        isOpen={Boolean(selectedStatusUser && selectedStatus)}
        isUpdating={isUpdatingStatus}
        onClose={handleCloseStatusDialog}
        onConfirm={handleConfirmStatusChange}
      />

      <ResetPasswordDialog
        user={selectedResetPasswordUser}
        isOpen={Boolean(selectedResetPasswordUser)}
        isResetting={isResettingPassword}
        onClose={handleCloseResetPasswordDialog}
        onConfirm={handleConfirmResetPassword}
      />
    </>
  );
}
