"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatBps, mulBps, toBigInt } from "@/lib/money";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

export interface BidTicketProps extends HTMLAttributes<HTMLDivElement> {
  /** Full pot for the round, in base units (decimal string). */
  pot: string;
  /** Current discount in basis points (integer, 10_000 = 100%): 450 is a 4.5% bid. */
  discountBps: number;
  onDiscountBpsChange?: (next: number) => void;
  minBps?: number;
  maxBps?: number;
  /** The contract's minimum bid increment is 25 bps; the default step is coarser. */
  stepBps?: number;
  /** Action row, usually a full-width accent Button. */
  footer?: ReactNode;
}

/** The bid composer: discount slider with live net amount and the plain-language trade-off. */
export function BidTicket({
  pot,
  discountBps,
  onDiscountBpsChange,
  minBps = 0,
  maxBps = 1000,
  stepBps = 50,
  footer,
  className,
  ...rest
}: BidTicketProps) {
  // Same integer arithmetic as the contract's discountAmount = grossPot * discountBps / 10000.
  const forgone = mulBps(pot, discountBps);
  const receives = toBigInt(pot) - forgone;

  return (
    <Card className={cx("grid grid-cols-[minmax(0,1fr)] gap-4", className)} {...rest}>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className="wham-label">Your bid</span>
          <span className="wham-tnum text-text-strong" style={{ font: "var(--text-money-l)" }}>
            {formatBps(discountBps)}%
          </span>
        </div>
        <div className="grid gap-1 text-right">
          <span className="wham-label">You would receive</span>
          <MoneyAmount value={receives} size="lg" decimals={0} round="down" tone="accent" />
        </div>
      </div>
      <input
        type="range"
        min={minBps}
        max={maxBps}
        step={stepBps}
        value={discountBps}
        onChange={(e) => onDiscountBpsChange?.(Number(e.target.value))}
        className="h-7 w-full"
        style={{ accentColor: "var(--brand-primary)" }}
      />
      <div className="flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2.5">
        <Icon name="info" size={16} color="var(--text-muted)" />
        <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
          You give up <MoneyAmount value={forgone} size="sm" tone="muted" /> to take the pot this round instead of
          waiting your turn.
        </span>
      </div>
      {footer}
    </Card>
  );
}
