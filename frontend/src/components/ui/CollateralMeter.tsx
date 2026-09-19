import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

export interface CollateralMeterProps extends HTMLAttributes<HTMLDivElement> {
  /** Amount this member must lock. */
  deposit: number;
  /** The pot they will eventually receive — the deposit is expressed as a share of this. */
  potShare: number;
  /** Optional comparison: the deposit a flat rule would demand. Renders as a marker line. */
  flatRule?: number;
  label?: string;
  /** Shows the sparkles glyph indicating the agent set this number. Default true. */
  agentPriced?: boolean;
}

/**
 * Shows a personalized security deposit against the member's pot share, with an optional
 * marker for what a flat rule would have charged — the visual argument for underwriting.
 */
export function CollateralMeter({
  deposit,
  potShare,
  flatRule,
  label = "Your security deposit",
  agentPriced = true,
  className,
  ...rest
}: CollateralMeterProps) {
  const base = potShare || deposit;
  const ratio = Math.max(0, Math.min(1, deposit / base));
  const flatRatio = flatRule != null ? Math.max(0, Math.min(1, flatRule / base)) : null;

  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)] gap-3", className)} {...rest}>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className="wham-label flex items-center gap-1.5">
            {agentPriced ? <Icon name="sparkles" size={13} color="var(--status-info)" /> : null}
            {label}
          </span>
          <MoneyAmount value={deposit} size="lg" />
        </div>
        <span className="text-right text-text-muted" style={{ font: "var(--text-body-s)" }}>
          {Math.round(ratio * 100)}% of your <MoneyAmount value={potShare} size="sm" tone="muted" /> pot share
        </span>
      </div>
      <div className="relative h-3 rounded-pill bg-surface-sunken">
        <div
          className="h-full rounded-pill bg-brand-primary [transition:width_var(--duration-slow)_var(--ease-out)]"
          style={{ width: `${ratio * 100}%` }}
        />
        {flatRatio != null ? (
          <div className="absolute -top-[5px] -bottom-[5px] w-0.5 bg-warm-500" style={{ left: `${flatRatio * 100}%` }} />
        ) : null}
      </div>
      {flatRule != null ? (
        <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
          Marker shows the flat <MoneyAmount value={flatRule} size="sm" tone="muted" /> a one-size-fits-all rule would
          charge.
        </span>
      ) : null}
    </div>
  );
}
