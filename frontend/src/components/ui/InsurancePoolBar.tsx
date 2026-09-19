import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { poolFill } from "@/lib/pool";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

export interface InsurancePoolBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Base units (decimal string). */
  balance: string;
  /** Target balance the pool is sized against. */
  target?: string;
  /** How many missed contributions the balance can absorb. */
  covers?: number;
  /** Per-member per-round amount that funds the pool. */
  contributionsPerRound?: string;
}

/** Status of the shared buffer that absorbs a default: balance, health, and how many misses it covers. */
export function InsurancePoolBar({ balance, target, covers, contributionsPerRound, className, ...rest }: InsurancePoolBarProps) {
  const { state, bps, healthy } = poolFill(balance, target);
  // Without a target there is nothing to measure against: show the balance, but no health claim and no fill.
  const known = state !== "unknown";
  const toneClass = healthy ? "bg-status-success" : "bg-status-warning";
  const iconColor = !known ? "var(--text-muted)" : healthy ? "var(--status-success)" : "var(--status-warning)";

  return (
    <div className={cx("grid gap-3", className)} {...rest}>
      <div className="flex items-center gap-2.5">
        <Icon name="shield-check" size={18} color={iconColor} />
        <span className="flex-1 text-text-strong" style={{ font: "var(--text-ui-s)" }}>
          Insurance pool
        </span>
        <MoneyAmount value={balance} size="md" />
      </div>
      <div className="h-2.5 overflow-hidden rounded-pill bg-surface-sunken">
        {known ? (
          <div
            className={cx("h-full rounded-pill transition-[width] duration-300 ease-out", toneClass)}
            style={{ width: `${bps / 100}%` }}
          />
        ) : null}
      </div>
      <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
        {covers != null ? `Covers ${covers} missed contribution${covers === 1 ? "" : "s"} before members are exposed. ` : ""}
        {contributionsPerRound != null ? (
          <>
            Funded by <MoneyAmount value={contributionsPerRound} size="sm" tone="muted" /> per member per round.
          </>
        ) : null}
      </span>
    </div>
  );
}
