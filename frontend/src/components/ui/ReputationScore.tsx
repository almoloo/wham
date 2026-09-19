import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

const BANDS = [
  { min: 750, label: "Trusted", color: "var(--score-trusted)" },
  { min: 600, label: "Solid", color: "var(--score-solid)" },
  { min: 400, label: "Building", color: "var(--score-building)" },
  { min: 0, label: "Thin file", color: "var(--score-thin)" },
] as const;

export interface ReputationScoreProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–900. */
  score: number;
  max?: number;
  /** Change attributable to the current circle, signed in the caption row. */
  delta?: number;
  /** Completed circles — the evidence for the number. */
  circles?: number;
  /** Gauge width in px. */
  size?: number;
  /** One clause under the gauge explaining what moves the score. */
  caption?: string;
}

/** The portable trust score: a half-ring gauge, the band name, and the track record behind it. */
export function ReputationScore({
  score = 0,
  max = 900,
  delta,
  circles,
  size = 200,
  caption,
  className,
  ...rest
}: ReputationScoreProps) {
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[3];
  const pct = Math.max(0, Math.min(1, score / max));
  const height = size * 0.62;
  const r = (size - 16) / 2;
  const circumference = Math.PI * r;

  return (
    <div className={cx("grid justify-items-center gap-2.5", className)} {...rest}>
      <div className="relative" style={{ width: size, height }}>
        <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
          <path
            d={`M 8 ${r + 8} A ${r} ${r} 0 0 1 ${size - 8} ${r + 8}`}
            fill="none"
            stroke="var(--surface-sunken)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M 8 ${r + 8} A ${r} ${r} 0 0 1 ${size - 8} ${r + 8}`}
            fill="none"
            stroke={band.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: "stroke-dashoffset var(--duration-count) var(--ease-out)" }}
          />
        </svg>
        <div
          className="absolute inset-0 grid content-center place-items-center gap-0.5"
          style={{ paddingTop: size * 0.1 }}
        >
          <span
            className="wham-tnum text-text-strong"
            style={{
              font: `var(--weight-black) ${Math.round(size * 0.24)}px/1 var(--font-core)`,
              letterSpacing: "var(--tracking-display)",
            }}
          >
            {score}
          </span>
          <span style={{ font: "var(--text-ui-s)", color: band.color }}>{band.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {typeof delta === "number" ? (
          <span
            className={cx("flex items-center gap-1", delta >= 0 ? "text-status-success-text" : "text-status-danger-text")}
            style={{ font: "var(--text-ui-s)" }}
          >
            <Icon name={delta >= 0 ? "trending-up" : "trending-down"} size={15} />
            {(delta >= 0 ? "+" : "") + delta} this circle
          </span>
        ) : null}
        {typeof circles === "number" ? (
          <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
            {circles} circles completed
          </span>
        ) : null}
      </div>
      {caption ? (
        <span className="max-w-[40ch] text-center text-text-muted" style={{ font: "var(--text-body-s)" }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}
