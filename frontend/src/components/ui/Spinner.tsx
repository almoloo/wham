import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const SIZE_PX = { sm: 16, md: 22, lg: 32 } as const;

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg" | number;
  /** Any CSS color or token; defaults to the brand primary. */
  color?: string;
  /** Optional caption shown beside the ring (e.g. "Placing bid…"); also used as the a11y label if set. */
  label?: string;
}

export function Spinner({ size = "md", color = "var(--brand-primary)", label, className, style, ...rest }: SpinnerProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size];
  const borderWidth = Math.max(2, px / 9);

  return (
    <span
      role="status"
      aria-label={label || "Loading"}
      className={cx("inline-flex items-center gap-2.5", className)}
      style={style}
      {...rest}
    >
      <span
        className="flex-none rounded-pill animate-[spin_0.7s_linear_infinite] motion-reduce:animate-[spin_1.4s_linear_infinite]"
        style={{
          width: px,
          height: px,
          border: `${borderWidth}px solid color-mix(in oklab, ${color} 22%, transparent)`,
          borderTopColor: color,
        }}
      />
      {label ? <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{label}</span> : null}
    </span>
  );
}
