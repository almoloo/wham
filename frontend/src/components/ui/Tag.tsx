import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: IconName;
  /** Mono face for chain data and codes. */
  mono?: boolean;
  /** Filter-chip selected state. */
  selected?: boolean;
}

/** Neutral metadata chip — cadence, size, region, chain. Square-ish (6px radius) so it never reads as a status Badge. */
export function Tag({ children, icon, mono = false, selected = false, onClick, className, ...rest }: TagProps) {
  return (
    <span
      onClick={onClick}
      className={cx(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-xs border px-2.5 [transition:var(--transition-control)]",
        selected ? "border-border-brand bg-surface-brand-quiet text-text-brand" : "border-border-subtle bg-surface-card text-text-muted",
        mono ? "wham-mono" : "font-core text-[13.5px] font-semibold leading-[1.2]",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}
