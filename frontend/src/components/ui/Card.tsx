import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const PADDING_CLASSES = {
  none: "p-0",
  compact: "p-[var(--card-pad-compact)]",
  default: "p-[var(--card-pad)]",
  loose: "p-6",
} as const;

const TONE_CLASSES = {
  default: "bg-surface-card border-border-subtle text-text-body",
  sunken: "bg-surface-sunken border-transparent text-text-body shadow-none",
  brand: "bg-surface-brand-quiet border-border-brand text-text-body",
  agent: "bg-surface-agent border-lapis-100 text-text-body",
  accent: "bg-surface-accent-quiet border-saffron-100 text-text-body",
  inverse: "bg-surface-inverse border-border-inverse text-text-inverse",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING_CLASSES;
  /** sunken/brand/agent/accent/inverse tones map to the semantic surfaces; agent is the only lapis surface. */
  tone?: keyof typeof TONE_CLASSES;
  /** Adds hover lift and pointer — use only when the whole card navigates. */
  interactive?: boolean;
}

/** The Wham surface: white, 20px radius, 1px hairline, --shadow-1. Hairline first, shadow second. */
export function Card({
  padding = "default",
  tone = "default",
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        "rounded-lg border [transition:var(--transition-surface),border-color_var(--duration-fast)_var(--ease-out)]",
        tone !== "sunken" && "shadow-[var(--shadow-1)]",
        interactive && "cursor-pointer hover:border-border-default",
        interactive && tone !== "sunken" && "hover:shadow-[var(--shadow-2)]",
        PADDING_CLASSES[padding],
        TONE_CLASSES[tone],
        !interactive && "cursor-default",
        className
      )}
      {...rest}
    />
  );
}
