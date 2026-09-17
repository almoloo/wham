import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  radius?: string;
}

/** Static loading placeholder in --surface-sunken. Wham skeletons never shimmer or pulse. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = "var(--radius-xs)",
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("block bg-surface-sunken", className)}
      style={{ width, height, borderRadius: radius, ...style }}
      {...rest}
    />
  );
}
