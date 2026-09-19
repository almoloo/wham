import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface TableColumn<T> {
  key?: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** Custom cell renderer; falls back to row[key]. */
  cell?: (row: T) => ReactNode;
}

export interface TableProps<T> extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
}

/** Horizontally scrolls under its own container on narrow viewports rather than compressing columns. */
export function Table<T extends object>({
  columns,
  rows,
  onRowClick,
  className,
  ...rest
}: TableProps<T>) {
  return (
    <div className={cx("overflow-x-auto", className)} {...rest}>
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.key ?? i}
                className="wham-label whitespace-nowrap border-b border-border-default px-3 pb-2.5"
                style={{ textAlign: c.align ?? "left" }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const rowKey = (row as { id?: string | number }).id ?? ri;
            return (
              <tr
                key={rowKey}
                onClick={() => onRowClick?.(row)}
                className={cx(
                  "[transition:var(--transition-control)]",
                  onRowClick && "cursor-pointer hover:bg-surface-sunken"
                )}
              >
                {columns.map((c, ci) => (
                  <td
                    key={c.key ?? ci}
                    className="border-b border-border-subtle px-3 py-[13px] text-text-body"
                    style={{ textAlign: c.align ?? "left", font: "var(--text-body-m)" }}
                  >
                    {c.cell ? c.cell(row) : c.key ? ((row as Record<string, ReactNode>)[c.key]) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
