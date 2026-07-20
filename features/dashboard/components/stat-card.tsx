import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  description?: string;
  trendValue?: string;
  trendDirection?: TrendDirection;
  href?: string;
  actionLabel?: string;
  footer?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const trendConfig = {
  up: {
    icon: ArrowUpRight,
    className: "bg-emerald-50 text-emerald-700",
  },
  down: {
    icon: ArrowDownRight,
    className: "bg-red-50 text-red-700",
  },
  neutral: {
    icon: Minus,
    className: "bg-slate-100 text-slate-600",
  },
} satisfies Record<
  TrendDirection,
  {
    icon: ElementType;
    className: string;
  }
>;

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trendValue,
  trendDirection = "neutral",
  href,
  actionLabel = "View details",
  footer,
  isLoading = false,
  className,
}: StatCardProps) {
  const trend = trendConfig[trendDirection];
  const TrendIcon = trend.icon;

  return (
    <article
      className={cn(
        "group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{title}</p>

          {isLoading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {(description || trendValue) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {trendValue && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                trend.className,
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {trendValue}
            </span>
          )}

          {description && (
            <span className="text-xs text-slate-500">{description}</span>
          )}
        </div>
      )}

      {footer && (
        <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div>
      )}

      {href && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href={href}
            className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            {actionLabel} →
          </Link>
        </div>
      )}
    </article>
  );
}
