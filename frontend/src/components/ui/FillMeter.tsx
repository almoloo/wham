import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface FillMeterProps extends HTMLAttributes<HTMLDivElement> {
  filled: number;
  target: number;
  /** Past its start date without quorum — a distinctly muted treatment. */
  stalled?: boolean;
}

/** How full a forming circle is — one segment per seat, filled for confirmed members. Segmented rather than continuous so scarcity reads honestly. */
export function FillMeter({ filled, target, stalled = false, className, ...rest }: FillMeterProps) {
  const nearlyFull = !stalled && target - filled <= 2 && filled < target;
  const full = filled >= target;
  const color = stalled
    ? "bg-text-subtle"
    : full
      ? "bg-status-success"
      : nearlyFull
        ? "bg-accent-saffron"
        : "bg-brand-primary";

  return (
    <div className={cx("grid gap-1.5", className)} {...rest}>
      <div className="flex gap-[3px]">
        {Array.from({ length: target }).map((_, i) => (
          <span
            key={i}
            className={cx("h-1.5 flex-1 rounded-pill", i < filled ? color : "bg-border-subtle", stalled && i >= filled && "opacity-50")}
          />
        ))}
      </div>
      <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
        {filled}/{target} members{stalled ? " · past start date" : nearlyFull ? " · almost full" : ""}
      </span>
    </div>
  );
}
