import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Centered uppercase label with hairlines on both sides, instead of a plain line. */
  label?: string;
  /** A stretching vertical hairline for toolbars and inline groups, instead of a horizontal rule. */
  vertical?: boolean;
}

export function Divider({ label, vertical = false, className, ...rest }: DividerProps) {
  if (vertical) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cx("w-px flex-none self-stretch bg-border-subtle", className)}
        {...rest}
      />
    );
  }

  if (label) {
    return (
      <div role="separator" className={cx("flex items-center gap-3", className)} {...rest}>
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="wham-label">{label}</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
    );
  }

  return <div role="separator" className={cx("h-px bg-border-subtle", className)} {...rest} />;
}
