"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

function fmtAbs(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const TONE_CLASSES: Record<"quiet" | "raised" | "urgent" | "settled", string> = {
  quiet: "bg-surface-sunken text-text-muted",
  raised: "bg-surface-accent-quiet text-saffron-600",
  urgent: "bg-status-warning-surface text-status-warning-text",
  settled: "bg-warm-100 text-text-subtle",
};

export interface CountdownPillProps extends HTMLAttributes<HTMLSpanElement> {
  endsAt: string | Date;
}

/**
 * Live time-remaining pill with a gentle urgency ramp: static date beyond 7
 * days, "in N days"/"in N hours", then a ticking mm:ss under an hour. Used
 * for bid windows, seat holds, contribution deadlines.
 */
export function CountdownPill({ endsAt, className, ...rest }: CountdownPillProps) {
  const target = endsAt instanceof Date ? endsAt.getTime() : new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const diff = target - now;
  const tickMs = diff < 3_600_000 ? 1_000 : 60_000;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  let text: string;
  let tone: keyof typeof TONE_CLASSES = "quiet";

  if (diff <= 0) {
    text = "Expired";
    tone = "settled";
  } else if (diff > 7 * 86_400_000) {
    text = fmtAbs(new Date(target));
  } else if (diff > 86_400_000) {
    const days = Math.round(diff / 86_400_000);
    text = `in ${days} ${days === 1 ? "day" : "days"}`;
  } else if (diff > 3_600_000) {
    const hours = Math.round(diff / 3_600_000);
    text = `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
    tone = "raised";
  } else {
    const s = Math.max(0, Math.floor(diff / 1000));
    text = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    tone = "urgent";
  }

  return (
    <span
      className={cx(
        "wham-tnum inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-core font-semibold text-[12.5px] leading-none",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      <Icon name="clock" size={12} />
      {text}
    </span>
  );
}
