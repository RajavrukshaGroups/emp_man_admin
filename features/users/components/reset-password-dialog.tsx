"use client";

import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import type { User } from "../types/user.types";

interface ResetPasswordDialogProps {
  user: User | null;
  isOpen: boolean;
  isResetting?: boolean;
  onClose: () => void;
  onConfirm: (user: User, newPassword: string) => void | Promise<void>;
}

export function ResetPasswordDialog({
  user,
  isOpen,
  isResetting = false,
  onClose,
  onConfirm,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError(null);
  }, [isOpen, user?._id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isResetting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isResetting, onClose]);

  if (!isOpen || !user) {
    return null;
  }

  const selectedUser = user;

  const userName =
    selectedUser.displayName ||
    `${selectedUser.firstName} ${selectedUser.lastName}`.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedPassword = newPassword.trim();

    if (!trimmedPassword) {
      setError("New password is required.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (trimmedPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    await onConfirm(selectedUser, trimmedPassword);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isResetting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <KeyRound className="h-5 w-5" />
              </div>

              <div>
                <h2
                  id="reset-password-title"
                  className="text-lg font-semibold text-gray-950"
                >
                  Reset password
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Set a new password for {userName}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close reset password dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{userName}</p>

              <p className="mt-0.5 text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                New password
              </label>

              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  disabled={isResetting}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  disabled={isResetting}
                  className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Confirm new password
              </label>

              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  disabled={isResetting}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  disabled={isResetting}
                  className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed"
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
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Use at least 8 characters. The backend may enforce additional
              uppercase, lowercase, number or special-character rules.
            </p>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isResetting || !newPassword || !confirmPassword}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Reset password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
