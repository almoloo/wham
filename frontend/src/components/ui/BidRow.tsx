import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { formatBps } from "@/lib/money";
import { Avatar, type AvatarBand } from "./Avatar";
import { Badge } from "./Badge";
import { MoneyAmount } from "./MoneyAmount";

export interface BidRowProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  /** Discount bid in basis points (integer, 10_000 = 100%): 450 is a 4.5% bid. */
  discountBps: number;
  /** Net amount the bidder would receive after the discount, in base units (decimal string). */
  receives?: string;
  band?: AvatarBand;
  /** Highest bid so far — turquoise quiet fill and a "Leading" badge. */
  leading?: boolean;
  /** This is the current user's bid — saffron quiet fill, label reads "You". */
  you?: boolean;
  /** Relative time, e.g. "2 min ago". */
  time?: string;
}

/** One bid in the live auction: who, what discount they accepted, what they'd receive. */
export function BidRow({ name, discountBps, receives, band, leading = false, you = false, time, className, ...rest }: BidRowProps) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-md border px-3.5 py-3",
        leading ? "border-border-brand bg-surface-brand-quiet" : you ? "border-saffron-100 bg-surface-accent-quiet" : "border-transparent bg-transparent",
        className
      )}
      {...rest}
    >
      <Avatar name={name} size="sm" band={band} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-text-strong" style={{ font: "var(--text-ui-s)" }}>
          {you ? "You" : name}
        </span>
        {time ? (
          <span className="text-text-subtle" style={{ font: "var(--text-body-s)" }}>
            {time}
          </span>
        ) : null}
      </div>
      {leading ? <Badge tone="brand">Leading</Badge> : null}
      <div className="grid gap-0.5 text-right">
        <span className="wham-tnum text-text-strong" style={{ font: "var(--weight-bold) 17px/1.1 var(--font-core)" }}>
          {formatBps(discountBps)}%
        </span>
        {receives != null ? (
          <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
            receives <MoneyAmount value={receives} size="sm" tone="muted" decimals={0} round="down" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
