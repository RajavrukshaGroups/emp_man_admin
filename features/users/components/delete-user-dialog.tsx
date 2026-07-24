"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect } from "react";

import type { User } from "../types/user.types";

interface DeleteUserDialogProps {
  user: User | null;
  isOpen: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (user: User) => void | Promise<void>;
}

export function DeleteUserDialog({
  user,
  isOpen,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteUserDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDeleting, isOpen, onClose]);

  if (!isOpen || !user) {
    return null;
  }

  const selectedUser = user;

  const userName =
    selectedUser.displayName ||
    `${selectedUser.firstName} ${selectedUser.lastName}`.trim();

  async function handleConfirm() {
    await onConfirm(selectedUser);
  }
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="delete-user-title"
                className="text-lg font-semibold text-gray-950"
              >
                Delete user
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                This will disable the user account and remove it from active
                user records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close delete user dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-950">{userName}</span>?
          </p>

          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{user.email}</p>

            <p className="mt-1 text-xs leading-5 text-red-700">
              The account will be marked as deleted and inactive. The user will
              no longer be able to sign in.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete user
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
