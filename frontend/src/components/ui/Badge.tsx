import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const TONE_CLASSES: Record<BadgeTone, { surface: string; dot: string }> = {
  neutral: { surface: "bg-status-neutral-surface text-status-neutral-text", dot: "bg-status-neutral" },
  success: { surface: "bg-status-success-surface text-status-success-text", dot: "bg-status-success" },
  warning: { surface: "bg-status-warning-surface text-status-warning-text", dot: "bg-status-warning" },
  danger: { surface: "bg-status-danger-surface text-status-danger-text", dot: "bg-status-danger" },
  info: { surface: "bg-status-info-surface text-status-info-text", dot: "bg-status-info" },
  brand: { surface: "bg-surface-brand-quiet text-text-brand", dot: "bg-brand-primary" },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Leading state dot in the tone colour. */
  dot?: boolean;
  /** Icon name, alternative to the dot. */
  icon?: IconName;
  size?: "sm" | "md";
}

/** Status pill: paid, due soon, overdue, on-chain, open. Tone carries meaning; the word repeats it. */
export function Badge({
  tone = "neutral",
  children,
  icon,
  dot = false,
  size = "md",
  className,
  ...rest
}: BadgeProps) {
  const { surface, dot: dotClass } = TONE_CLASSES[tone];
  const small = size === "sm";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill font-core font-semibold",
        small ? "h-[22px] px-2 text-[11.5px] leading-none" : "h-[26px] px-2.5 text-[13.5px] leading-[1.2]",
        surface,
        className
      )}
      {...rest}
    >
      {dot ? <span className={cx("h-[7px] w-[7px] rounded-pill", dotClass)} /> : null}
      {icon ? <Icon name={icon} size={small ? 12 : 14} /> : null}
      {children}
    </span>
  );
}
