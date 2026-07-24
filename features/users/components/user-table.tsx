"use client";

import Link from "next/link";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { UserStatusBadge } from "./user-status-badge";

import type { User, UserStatus } from "../types/user.types";

interface UserTableProps {
  users: User[];

  page: number;
  totalPages: number;
  totalRecords: number;

  canRead?: boolean;
  canUpdate?: boolean;
  canActivate?: boolean;
  canDeactivate?: boolean;
  canSuspend?: boolean;
  canResetPassword?: boolean;

  currentUserId?: string;

  isUpdatingStatus?: boolean;

  onPageChange: (page: number) => void;

  onStatusChange: (user: User, status: UserStatus) => void;

  onResetPassword: (user: User) => void;
}

interface UserActionMenuProps {
  user: User;

  canRead: boolean;
  canUpdate: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  canSuspend: boolean;
  canResetPassword: boolean;

  isCurrentUser: boolean;
  isUpdatingStatus: boolean;

  onStatusChange: (user: User, status: UserStatus) => void;

  onResetPassword: (user: User) => void;
}

function getInitials(user: User) {
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  const firstInitial = firstName?.charAt(0) ?? "";
  const lastInitial = lastName?.charAt(0) ?? "";

  return (
    `${firstInitial}${lastInitial}`.toUpperCase() ||
    user.displayName?.charAt(0)?.toUpperCase() ||
    "U"
  );
}

function formatGender(gender?: User["gender"]) {
  if (!gender) {
    return "Not specified";
  }

  const labels: Record<NonNullable<User["gender"]>, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
  };

  return labels[gender];
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "Never";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <Check className="h-3.5 w-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      <X className="h-3.5 w-3.5" />
      Unverified
    </span>
  );
}

function UserActionMenu({
  user,
  canRead,
  canUpdate,
  canActivate,
  canDeactivate,
  canSuspend,
  canResetPassword,
  isCurrentUser,
  isUpdatingStatus,
  onStatusChange,
  onResetPassword,
}: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const hasActions =
    canRead ||
    canUpdate ||
    canActivate ||
    canDeactivate ||
    canSuspend ||
    canResetPassword;
  if (!hasActions) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label={`Open actions for ${user.displayName}`}
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {canRead && (
            <Link
              href={`/users/${user._id}`}
              onClick={closeMenu}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <Eye className="h-4 w-4" />
              View details
            </Link>
          )}

          {canUpdate && (
            <Link
              href={`/users/${user._id}/edit`}
              onClick={closeMenu}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <Pencil className="h-4 w-4" />
              Edit user
            </Link>
          )}

          {canResetPassword && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onResetPassword(user);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>
          )}

          {(canRead || canUpdate || canResetPassword) &&
            (canActivate || canDeactivate || canSuspend) && (
              <div className="my-1 border-t border-gray-100" />
            )}

          {canActivate && user.status !== "ACTIVE" && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => {
                closeMenu();

                onStatusChange(user, "ACTIVE");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Power className="h-4 w-4" />
              Activate user
            </button>
          )}

          {canDeactivate && user.status !== "INACTIVE" && (
            <button
              type="button"
              disabled={isUpdatingStatus || isCurrentUser}
              onClick={() => {
                closeMenu();

                onStatusChange(user, "INACTIVE");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                isCurrentUser
                  ? "You cannot deactivate your own account."
                  : undefined
              }
            >
              <Power className="h-4 w-4" />
              Deactivate user
            </button>
          )}

          {canSuspend && user.status !== "SUSPENDED" && (
            <button
              type="button"
              disabled={isUpdatingStatus || isCurrentUser}
              onClick={() => {
                closeMenu();

                onStatusChange(user, "SUSPENDED");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                isCurrentUser
                  ? "You cannot suspend your own account."
                  : undefined
              }
            >
              <Ban className="h-4 w-4" />
              Suspend user
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function UserTable({
  users,
  page,
  totalPages,
  totalRecords,
  canRead = true,
  canUpdate = false,
  canActivate = false,
  canDeactivate = false,
  canSuspend = false,
  canResetPassword = false,
  currentUserId,
  isUpdatingStatus = false,
  onPageChange,
  onStatusChange,
  onResetPassword,
}: UserTableProps) {
  const safePage = Math.max(page, 1);
  const safeTotalPages = Math.max(totalPages, 1);

  const hasPreviousPage = safePage > 1;

  const hasNextPage = safePage < safeTotalPages;

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <UserRound className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No users found
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          No user accounts match the selected search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1250px] w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                User
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mobile
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Gender
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mobile verification
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last login
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const isCurrentUser = currentUserId === user._id;

              return (
                <tr key={user._id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex min-w-[240px] items-center gap-3">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.displayName}
                          className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
                          {getInitials(user)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user.displayName ||
                              `${user.firstName} ${user.lastName}`}
                          </p>

                          {isCurrentUser && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                              You
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {user.mobile || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {formatGender(user.gender)}
                  </td>

                  <td className="px-5 py-4">
                    <UserStatusBadge status={user.status} />
                  </td>

                  <td className="px-5 py-4">
                    <VerificationBadge verified={user.emailVerified} />
                  </td>

                  <td className="px-5 py-4">
                    <VerificationBadge verified={user.mobileVerified} />
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm text-gray-700">
                      {formatDateTime(user.lastLoginAt)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <UserActionMenu
                      user={user}
                      canRead={canRead}
                      canUpdate={canUpdate}
                      canActivate={canActivate}
                      canDeactivate={canDeactivate}
                      canSuspend={canSuspend}
                      canResetPassword={canResetPassword}
                      isCurrentUser={isCurrentUser}
                      isUpdatingStatus={isUpdatingStatus}
                      onStatusChange={onStatusChange}
                      onResetPassword={onResetPassword}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Showing page{" "}
          <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
          <span className="font-semibold text-gray-900">{safeTotalPages}</span>
          {" · "}
          <span className="font-semibold text-gray-900">
            {totalRecords}
          </span>{" "}
          total users
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
