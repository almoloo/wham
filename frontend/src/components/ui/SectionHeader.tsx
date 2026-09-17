import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  /** One clause of context — counts, totals, or the rule that applies. */
  caption?: string;
  /** Text link on the right, e.g. "See all". */
  action?: string;
  onAction?: () => void;
  icon?: IconName;
}

/** Titles a group of cards or rows. Sentence case, optional caption, optional single text action. */
export function SectionHeader({ title, caption, action, onAction, icon, className, ...rest }: SectionHeaderProps) {
  return (
    <div className={cx("flex items-end justify-between gap-4", className)} {...rest}>
      <div className="grid gap-[3px]">
        <div className="flex items-center gap-2">
          {icon ? <Icon name={icon} size={18} color="var(--text-muted)" /> : null}
          <h3>{title}</h3>
        </div>
        {caption ? <span className="font-core text-[13.5px] leading-[1.5] text-text-muted">{caption}</span> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="cursor-pointer border-0 bg-transparent p-0 font-core text-[13.5px] font-semibold leading-[1.2] text-text-link"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
