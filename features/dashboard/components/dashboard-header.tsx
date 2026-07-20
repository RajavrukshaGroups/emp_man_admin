import type { ReactNode } from "react";

interface DashboardHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
