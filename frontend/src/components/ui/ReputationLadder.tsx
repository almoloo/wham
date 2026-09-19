import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const BANDS = [
  { key: "thin", label: "Thin file", range: "0–399", color: "var(--score-thin)", note: "Deposit near your full pot share" },
  { key: "building", label: "Building", range: "400–599", color: "var(--score-building)", note: "Deposit around half your pot share" },
  { key: "solid", label: "Solid", range: "600–749", color: "var(--score-solid)", note: "Deposit around a quarter" },
  { key: "trusted", label: "Trusted", range: "750–900", color: "var(--score-trusted)", note: "Lowest deposits, first pick of circles" },
] as const;

export interface ReputationLadderProps extends HTMLAttributes<HTMLDivElement> {
  /** Band the user is currently in. */
  current?: (typeof BANDS)[number]["key"];
}

/** The four reputation bands with what each one buys you, current band highlighted. Explains the score's stakes. */
export function ReputationLadder({ current = "solid", className, ...rest }: ReputationLadderProps) {
  return (
    <div className={cx("grid gap-2", className)} {...rest}>
      {BANDS.map((b) => {
        const active = b.key === current;
        return (
          <div
            key={b.key}
            className={cx(
              "flex items-center gap-3 rounded-md border px-3.5 py-[11px]",
              active ? "border-border-brand bg-surface-brand-quiet" : "border-border-subtle bg-surface-card"
            )}
          >
            <span className="h-8 w-2 flex-none rounded-pill" style={{ background: b.color }} />
            <div className="grid flex-1 gap-0.5">
              <span className="text-text-strong" style={{ font: "var(--text-ui-s)" }}>
                {b.label}
              </span>
              <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
                {b.note}
              </span>
            </div>
            <span className={cx("wham-mono", active ? "text-text-brand" : "text-text-subtle")}>{b.range}</span>
          </div>
        );
      })}
    </div>
  );
}
