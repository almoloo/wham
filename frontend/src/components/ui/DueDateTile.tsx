import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const TONE_CLASSES: Record<NonNullable<DueDateTileProps["tone"]>, { bg: string; fg: string; sub: string }> = {
  default: { bg: "bg-surface-sunken", fg: "text-text-strong", sub: "text-text-subtle" },
  due: { bg: "bg-status-warning-surface", fg: "text-status-warning-text", sub: "text-status-warning-text" },
  overdue: { bg: "bg-status-danger-surface", fg: "text-status-danger-text", sub: "text-status-danger-text" },
  paid: { bg: "bg-status-success-surface", fg: "text-status-success-text", sub: "text-status-success-text" },
  payout: { bg: "bg-surface-accent-quiet", fg: "text-saffron-600", sub: "text-saffron-600" },
};

export interface DueDateTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Day of month, e.g. 3. */
  day: number | string;
  /** Three-letter month, e.g. "Sep". */
  month: string;
  tone?: "default" | "due" | "overdue" | "paid" | "payout";
  size?: "sm" | "md";
}

/** Small date block used as the leading slot of schedule rows. Tone encodes payment state. */
export function DueDateTile({ day, month, tone = "default", size = "md", className, ...rest }: DueDateTileProps) {
  const { bg, fg, sub } = TONE_CLASSES[tone];
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      className={cx("grid flex-none content-center justify-items-center rounded-md wham-tnum", dim, bg, className)}
      {...rest}
    >
      <span className={fg} style={{ font: `var(--weight-bold) ${size === "sm" ? 15 : 17}px/1 var(--font-core)` }}>
        {day}
      </span>
      <span className={cx("uppercase", sub)} style={{ font: "var(--weight-semibold) 9.5px/1.4 var(--font-core)", letterSpacing: "0.06em" }}>
        {month}
      </span>
    </div>
  );
}
