import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Last item renders as the current page (bold, no link) regardless of href. */
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items, className, ...rest }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cx("flex items-center gap-1.5", className)} {...rest}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {item.href && !last ? (
              <a href={item.href} className="font-core text-[13.5px] font-semibold leading-[1.2] text-text-muted no-underline">
                {item.label}
              </a>
            ) : (
              <span
                className={cx(
                  "overflow-hidden text-ellipsis whitespace-nowrap font-core text-[13.5px] font-semibold leading-[1.2]",
                  last ? "text-text-strong" : "text-text-muted"
                )}
              >
                {item.label}
              </span>
            )}
            {!last ? <Icon name="chevron-right" size={14} color="var(--text-subtle)" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
