import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface RotationRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of rounds / members. */
  total: number;
  /** How many rounds have paid out. */
  completed: number;
  /** Index of the live round; defaults to the completed count. */
  current?: number;
  /** 28 inline, 88 on cards, 220 as a screen hero. */
  size?: number;
  /** Stroke width; derived from size when omitted. */
  thickness?: number;
  /** Centre figure, e.g. "4/12". */
  label?: string;
  /** Centre caption under the figure. */
  sublabel?: string;
}

/**
 * The Wham rotation motif: one arc segment per round. Completed segments are turquoise,
 * the live round is saffron and slightly thicker, future rounds are warm-200.
 */
export function RotationRing({
  total,
  completed,
  current,
  size = 88,
  thickness,
  label,
  sublabel,
  className,
  style,
  ...rest
}: RotationRingProps) {
  const t = thickness ?? Math.max(4, Math.round(size * 0.09));
  const r = (size - t) / 2;
  const c = size / 2;
  // Gap widens with fewer segments but never exceeds 16deg, so a 2-member circle
  // doesn't render two near-touching semicircles.
  const gap = total > 1 ? Math.min(16, (360 / total) * 0.45) : 0;
  const step = 360 / total;
  const activeIndex = typeof current === "number" ? current : completed;

  const segments = Array.from({ length: total }, (_, i) => {
    const start = -90 + i * step + gap / 2;
    const end = start + step - gap;
    const a1 = (start * Math.PI) / 180;
    const a2 = (end * Math.PI) / 180;
    const x1 = c + r * Math.cos(a1);
    const y1 = c + r * Math.sin(a1);
    const x2 = c + r * Math.cos(a2);
    const y2 = c + r * Math.sin(a2);
    const large = end - start > 180 ? 1 : 0;
    const done = i < completed;
    const isCurrent = i === activeIndex;

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        stroke={done ? "var(--brand-primary)" : isCurrent ? "var(--accent-saffron)" : "var(--warm-200)"}
        strokeWidth={isCurrent ? t + 2 : t}
        strokeLinecap="round"
        fill="none"
      />
    );
  });

  return (
    <div className={cx("relative flex-none", className)} style={{ width: size, height: size, ...style }} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        {segments}
      </svg>
      {label || sublabel ? (
        <div className="absolute inset-0 grid place-items-center gap-px text-center">
          {label ? (
            <span
              className="wham-tnum text-text-strong"
              style={{ font: size > 140 ? "var(--text-title-l)" : size > 70 ? "var(--text-ui)" : "var(--weight-bold) 11px/1 var(--font-core)" }}
            >
              {label}
            </span>
          ) : null}
          {sublabel ? (
            <span
              className="text-text-muted"
              style={{ font: size > 140 ? "var(--text-body-s)" : "var(--weight-medium) 10px/1.2 var(--font-core)" }}
            >
              {sublabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
