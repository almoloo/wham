"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

function parts(ms: number): [number, number, number] {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export interface AuctionCountdownProps extends HTMLAttributes<HTMLDivElement> {
  /** Date or ISO string when bidding closes. */
  endsAt: string | Date;
  label?: string;
  /** "urgent" forces the pomegranate treatment; it also turns on automatically under one hour. */
  tone?: "default" | "urgent";
}

/** Live countdown to the close of a round's bidding. Ticks in mono tabular numerals — never pulses or flashes. */
export function AuctionCountdown({ endsAt, label = "Bidding closes in", tone = "default", className, ...rest }: AuctionCountdownProps) {
  const target = endsAt instanceof Date ? endsAt.getTime() : new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [h, m, s] = parts(target - now);
  const urgent = tone === "urgent" || target - now < 3_600_000;

  return (
    <div
      className={cx(
        "flex items-center gap-2.5 rounded-md px-3.5 py-2.5",
        urgent ? "bg-status-danger-surface" : "bg-surface-sunken",
        className
      )}
      {...rest}
    >
      <Icon name="gavel" size={16} color={urgent ? "var(--status-danger)" : "var(--text-muted)"} />
      <span className={cx("flex-1", urgent ? "text-status-danger-text" : "text-text-muted")} style={{ font: "var(--text-body-s)" }}>
        {label}
      </span>
      <span
        className={cx("wham-tnum", urgent ? "text-status-danger-text" : "text-text-strong")}
        style={{ font: "var(--weight-bold) 18px/1 var(--font-mono)", letterSpacing: "var(--tracking-mono)" }}
      >
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}
