import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const TIERS = ["Starter", "Standard", "Trusted"] as const;

export interface TierChipProps extends HTMLAttributes<HTMLSpanElement> {
  tier?: (typeof TIERS)[number];
}

/** Starter / Standard / Trusted — a member's earned level or a circle's required level. Reads like an account level, not a game rank. */
export function TierChip({ tier = "Starter", className, ...rest }: TierChipProps) {
  const idx = Math.max(0, TIERS.findIndex((t) => t.toLowerCase() === tier.toLowerCase()));

  return (
    <span
      className={cx("inline-flex items-center gap-2 rounded-pill bg-surface-sunken py-[3px] pe-2.5 ps-2", className)}
      {...rest}
    >
      <span className="flex gap-[3px]">
        {TIERS.map((_, i) => (
          <span key={i} className={cx("h-[5px] w-[5px] rounded-pill", i <= idx ? "bg-brand-primary" : "bg-border-default")} />
        ))}
      </span>
      <span className="wham-label">{TIERS[idx] ?? tier}</span>
    </span>
  );
}
