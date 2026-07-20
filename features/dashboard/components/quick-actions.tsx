"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

export interface QuickActionItem {
  title: string;
  description?: string;
  href: string;
  icon: ElementType;
  permission?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  title?: string;
  description?: string;
  actions: QuickActionItem[];
  className?: string;
}

export function QuickActions({
  title = "Quick actions",
  description = "Frequently used workforce management actions.",
  actions,
  className,
}: QuickActionsProps) {
  const permissions = useAuthStore((state) => state.permissions);

  const visibleActions = actions.filter((action) => {
    if (!action.permission) {
      return true;
    }

    return permissions.includes(action.permission);
  });

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleActions.map((action) => {
          const Icon = action.icon;

          if (action.disabled) {
            return (
              <div
                key={action.title}
                className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {action.title}
                </h3>

                {action.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {action.description}
                  </p>
                )}

                <p className="mt-3 text-xs font-medium text-slate-400">
                  Coming soon
                </p>
              </div>
            );
          }

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-950">
                {action.title}
              </h3>

              {action.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {action.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
