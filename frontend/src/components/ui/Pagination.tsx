import { Fragment, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export function pageList(page: number, count: number): number[] {
  const pages = new Set([1, count, page, page - 1, page + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= count)
    .sort((a, b) => a - b);
}

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  page: number;
  count: number;
  onChange?: (page: number) => void;
}

const BUTTON_BASE =
  "min-w-[32px] h-[32px] px-1 rounded-sm border-0 font-core font-semibold text-[13.5px] leading-none cursor-pointer [transition:var(--transition-control)]";

/** Collapses to first/last + neighbors of the current page with an ellipsis gap. */
export function Pagination({ page = 1, count = 1, onChange, className, ...rest }: PaginationProps) {
  const pages = pageList(page, count);

  return (
    <nav aria-label="Pagination" className={cx("flex items-center gap-1", className)} {...rest}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
        className={cx(BUTTON_BASE, "grid place-items-center bg-transparent text-text-muted disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <Icon name="chevron-left" size={16} />
      </button>
      {pages.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 ? (
            <span className="px-0.5 font-core text-[13.5px] font-normal leading-[1.5] text-text-subtle">…</span>
          ) : null}
          <button
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange?.(p)}
            className={cx(BUTTON_BASE, p === page ? "bg-brand-primary text-brand-on-primary" : "bg-transparent text-text-muted")}
          >
            {p}
          </button>
        </Fragment>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= count}
        onClick={() => onChange?.(page + 1)}
        className={cx(BUTTON_BASE, "grid place-items-center bg-transparent text-text-muted disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
