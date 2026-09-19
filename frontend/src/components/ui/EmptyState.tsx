import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon name in a sunken circle. */
  icon?: IconName;
  title: string;
  body?: string;
  /** Usually a single Button. */
  action?: ReactNode;
}

/** Empty list treatment. States the next action; never apologises, never uses an illustration (none exist in this system). */
export function EmptyState({ icon = "users", title, body, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cx("grid justify-items-center gap-2.5 py-10 px-5 text-center", className)} {...rest}>
      <span className="grid h-13 w-13 place-items-center rounded-pill bg-surface-sunken">
        <Icon name={icon} size={24} color="var(--text-muted)" />
      </span>
      <span className="font-core text-[18px] font-semibold leading-[1.3] text-text-strong">{title}</span>
      {body ? <p className="max-w-[38ch] font-core text-[15px] font-normal leading-[1.5] text-text-muted">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
