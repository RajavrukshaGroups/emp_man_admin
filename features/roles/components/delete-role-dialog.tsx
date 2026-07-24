"use client";

import { Loader2, Trash2, X } from "lucide-react";

import type { Role } from "../types/role.types";

interface DeleteRoleDialogProps {
  role: Role | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteRoleDialog({
  role,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteRoleDialogProps) {
  if (!isOpen || !role) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Delete role
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-medium text-red-900">
                  Delete {role.name}?
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  The role code{" "}
                  <span className="font-mono font-semibold">{role.code}</span>{" "}
                  will be permanently removed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete role
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
