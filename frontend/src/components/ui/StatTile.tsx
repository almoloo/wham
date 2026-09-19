import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const TONE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-surface-sunken",
  brand: "bg-surface-brand-quiet",
  accent: "bg-surface-accent-quiet",
  agent: "bg-surface-agent",
  danger: "bg-status-danger-surface",
  plain: "bg-transparent",
};

export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Small-caps label. */
  label: string;
  /** The figure — pass a MoneyAmount for currency. */
  value: ReactNode;
  /** One clause of context under the figure. */
  sub?: string;
  icon?: IconName;
  tone?: "default" | "brand" | "accent" | "agent" | "danger" | "plain";
  align?: "left" | "center";
}

/** Labelled figure tile for card interiors — pot size, rounds left, deposit held, insurance balance. */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
  align = "left",
  className,
  ...rest
}: StatTileProps) {
  return (
    <div
      className={cx(
        "grid gap-[5px] rounded-md",
        tone === "plain" ? "p-0" : "px-[14px] py-3",
        align === "center" ? "justify-items-center text-center" : "justify-items-start text-left",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      <span className="flex items-center gap-1.5">
        {icon ? <Icon name={icon} size={14} color="var(--text-subtle)" /> : null}
        <span className="wham-label">{label}</span>
      </span>
      <span className="wham-tnum text-text-strong" style={{ font: "var(--text-title-m)" }}>
        {value}
      </span>
      {sub ? (
        <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
          {sub}
        </span>
      ) : null}
    </div>
  );
}
