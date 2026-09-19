import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const FILL_CLASSES: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  brand: "bg-brand-primary",
  accent: "bg-accent-saffron",
  danger: "bg-status-danger",
  neutral: "bg-warm-400",
};

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  tone?: "brand" | "accent" | "danger" | "neutral";
  height?: number;
  /** Left label above the track. */
  label?: string;
  /** Right caption above the track — usually "4 of 12". */
  caption?: string;
}

/** Linear progress for funded amounts, rounds completed, insurance-pool coverage. */
export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  height = 8,
  label,
  caption,
  className,
  ...rest
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)] gap-1.5", className)} {...rest}>
      {label || caption ? (
        <div className="flex justify-between gap-3">
          {label ? (
            <span className="text-text-strong" style={{ font: "var(--text-ui-s)" }}>
              {label}
            </span>
          ) : null}
          {caption ? (
            <span className="wham-tnum text-text-muted" style={{ font: "var(--text-body-s)" }}>
              {caption}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-pill bg-surface-sunken" style={{ height }}>
        <div
          className={cx("h-full rounded-pill [transition:width_var(--duration-slow)_var(--ease-out)]", FILL_CLASSES[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
