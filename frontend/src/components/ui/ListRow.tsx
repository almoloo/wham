import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Avatar, icon circle, or date tile. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand value — MoneyAmount or Badge. */
  trailing?: ReactNode;
  /** Small muted text before the trailing slot. */
  meta?: ReactNode;
  /** Passing onClick adds the hover wash and a chevron. */
  onClick?: () => void;
  divider?: boolean;
}

/** 56px list row: leading slot, title + subtitle, trailing value. The workhorse of schedules and member lists. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  meta,
  onClick,
  divider = true,
  className,
  ...rest
}: ListRowProps) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "flex min-h-row-height items-center gap-3 py-2.5 [transition:var(--transition-control)]",
        divider ? "border-b border-border-subtle" : "border-b-0",
        onClick && "-mx-2.5 cursor-pointer rounded-sm px-2.5 hover:bg-surface-sunken",
        className
      )}
      {...rest}
    >
      {leading}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-text-strong" style={{ font: "var(--text-ui)" }}>
          {title}
        </span>
        {subtitle ? (
          <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2.5 text-right">
        {meta ? (
          <span className="text-text-subtle" style={{ font: "var(--text-body-s)" }}>
            {meta}
          </span>
        ) : null}
        {trailing}
        {onClick ? <Icon name="chevron-right" size={16} color="var(--text-subtle)" /> : null}
      </div>
    </div>
  );
}
