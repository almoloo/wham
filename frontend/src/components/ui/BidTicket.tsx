"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

export interface BidTicketProps extends HTMLAttributes<HTMLDivElement> {
  /** Full pot for the round. */
  pot: number;
  /** Current discount percentage. */
  discount: number;
  onDiscountChange?: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Action row, usually a full-width accent Button. */
  footer?: ReactNode;
}

/** The bid composer: discount slider with live net amount and the plain-language trade-off. */
export function BidTicket({
  pot,
  discount,
  onDiscountChange,
  min = 0,
  max = 10,
  step = 0.5,
  footer,
  className,
  ...rest
}: BidTicketProps) {
  const receives = pot * (1 - discount / 100);
  const forgone = pot - receives;

  return (
    <Card className={cx("grid grid-cols-[minmax(0,1fr)] gap-4", className)} {...rest}>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className="wham-label">Your bid</span>
          <span className="wham-tnum text-text-strong" style={{ font: "var(--text-money-l)" }}>
            {discount.toFixed(1)}%
          </span>
        </div>
        <div className="grid gap-1 text-right">
          <span className="wham-label">You would receive</span>
          <MoneyAmount value={receives} size="lg" decimals={0} tone="accent" />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={discount}
        onChange={(e) => onDiscountChange?.(Number(e.target.value))}
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
