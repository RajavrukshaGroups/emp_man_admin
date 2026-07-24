"use client";

import { Ban, CheckCircle2, PauseCircle } from "lucide-react";

import type { UserStatus } from "../types/user.types";

interface UserStatusBadgeProps {
  status: UserStatus;
}

const STATUS_CONFIG: Record<
  UserStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  INACTIVE: {
    label: "Inactive",
    icon: PauseCircle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  SUSPENDED: {
    label: "Suspended",
    icon: Ban,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const Icon = config.icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        config.className,
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" />

      {config.label}
    </span>
  );
}
