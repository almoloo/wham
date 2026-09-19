import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

export interface InsurancePoolBarProps extends HTMLAttributes<HTMLDivElement> {
  balance: number;
  /** Target balance the pool is sized against. */
  target?: number;
  /** How many missed contributions the balance can absorb. */
  covers?: number;
  /** Per-member per-round amount that funds the pool. */
  contributionsPerRound?: number;
}

/** Status of the shared buffer that absorbs a default: balance, health, and how many misses it covers. */
export function InsurancePoolBar({ balance, target, covers, contributionsPerRound, className, ...rest }: InsurancePoolBarProps) {
  const pct = Math.max(0, Math.min(1, Number(balance) / Number(target || balance)));
  const healthy = pct >= 0.6;
  const toneClass = healthy ? "bg-status-success" : "bg-status-warning";

  return (
    <div className={cx("grid gap-3", className)} {...rest}>
      <div className="flex items-center gap-2.5">
        <Icon name="shield-check" size={18} color={healthy ? "var(--status-success)" : "var(--status-warning)"} />
        <span className="flex-1 text-text-strong" style={{ font: "var(--text-ui-s)" }}>
          Insurance pool
        </span>
        <MoneyAmount value={balance} size="md" />
      </div>
      <div className="h-2.5 overflow-hidden rounded-pill bg-surface-sunken">
        <div
          className={cx("h-full rounded-pill transition-[width] duration-300 ease-out", toneClass)}
          style={{ width: `${pct * 100}%` }}
        />
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
