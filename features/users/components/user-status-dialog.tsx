"use client";

import { Ban, CheckCircle2, Loader2, PauseCircle, X } from "lucide-react";
import { useEffect } from "react";

import type { User, UserStatus } from "../types/user.types";

interface UserStatusDialogProps {
  user: User | null;
  status: UserStatus | null;
  isOpen: boolean;
  isUpdating?: boolean;
  onClose: () => void;
  onConfirm: (user: User, status: UserStatus) => void | Promise<void>;
}

const STATUS_CONFIG: Record<
  UserStatus,
  {
    title: string;
    actionLabel: string;
    description: string;
    icon: typeof CheckCircle2;
    iconClassName: string;
    buttonClassName: string;
  }
> = {
  ACTIVE: {
    title: "Activate user",
    actionLabel: "Activate",
    description:
      "The user will regain access to the application and can sign in again.",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-50 text-emerald-600",
    buttonClassName: "bg-emerald-600 hover:bg-emerald-700",
  },

  INACTIVE: {
    title: "Deactivate user",
    actionLabel: "Deactivate",
    description:
      "The user account will remain in the system, but the user will not be able to sign in.",
    icon: PauseCircle,
    iconClassName: "bg-amber-50 text-amber-600",
    buttonClassName: "bg-amber-600 hover:bg-amber-700",
  },

  SUSPENDED: {
    title: "Suspend user",
    actionLabel: "Suspend",
    description:
      "The user will be blocked from accessing the application until the account is activated again.",
    icon: Ban,
    iconClassName: "bg-red-50 text-red-600",
    buttonClassName: "bg-red-600 hover:bg-red-700",
  },
};

export function UserStatusDialog({
  user,
  status,
  isOpen,
  isUpdating = false,
  onClose,
  onConfirm,
}: UserStatusDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isUpdating) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isUpdating, onClose]);

  if (!isOpen || !user || !status) {
    return null;
  }

  const selectedUser = user;
  const selectedStatus = status;

  const config = STATUS_CONFIG[selectedStatus];
  const Icon = config.icon;

  const userName =
    selectedUser.displayName ||
    `${selectedUser.firstName} ${selectedUser.lastName}`.trim();

  async function handleConfirm() {
    await onConfirm(selectedUser, selectedStatus);
  }
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-status-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isUpdating) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                config.iconClassName,
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="user-status-title"
                className="text-lg font-semibold text-gray-950"
              >
                {config.title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Change the account status for this user.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close user status dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-700">
            Are you sure you want to{" "}
            <span className="font-semibold lowercase text-gray-950">
              {config.actionLabel}
            </span>{" "}
            <span className="font-semibold text-gray-950">{userName}</span>?
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">
              {selectedUser.email}
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isUpdating}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              config.buttonClassName,
            ].join(" ")}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Icon className="h-4 w-4" />
                {config.actionLabel} user
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
