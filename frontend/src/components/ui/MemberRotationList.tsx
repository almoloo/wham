import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Avatar, type AvatarBand } from "./Avatar";
import { Badge } from "./Badge";
import { MoneyAmount } from "./MoneyAmount";

export interface RotationMember {
  name: string;
  /** Rotation position / round number. */
  round?: number;
  /** done = already took the pot, current = this round, upcoming = waiting. */
  state?: "done" | "current" | "upcoming";
  /** Amount they received (after any bid discount). */
  received?: string;
  /** Month of their payout, e.g. "Sep". */
  month?: string;
  /** Free-text clause, e.g. "Took a 4% discount". */
  note?: string;
  band?: AvatarBand;
  /** Marks the current user. */
  you?: boolean;
}

export interface MemberRotationListProps extends HTMLAttributes<HTMLDivElement> {
  members: RotationMember[];
}

/** Who takes the pot when, in rotation order — the circle's spine. */
export function MemberRotationList({ members, className, ...rest }: MemberRotationListProps) {
  return (
    <div className={cx("grid", className)} {...rest}>
      {members.map((m, i) => {
        const state = m.state ?? "upcoming";
        const isNow = state === "current";
        return (
          <div
            key={i}
            className={cx(
              "flex items-center gap-3 py-3",
              i < members.length - 1 && "border-b border-border-subtle",
              state === "done" && "opacity-[0.72]"
            )}
          >
            <span
              className={cx(
                "wham-tnum grid h-[26px] w-[26px] flex-none place-items-center rounded-pill font-core font-bold text-[12px] leading-none",
                state === "done" ? "bg-turq-100 text-turq-700" : isNow ? "bg-accent-saffron text-on-accent-saffron" : "bg-surface-sunken text-text-subtle"
              )}
            >
              {m.round ?? i + 1}
            </span>
            <Avatar name={m.name} size="sm" band={m.band ?? "none"} />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <span className="text-text-strong" style={{ font: "var(--text-ui-s)" }}>
                {m.you ? "You" : m.name}
              </span>
              <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
                {m.note || (m.month ? `Payout ${m.month}` : "")}
              </span>
            </div>
            {m.received != null ? <MoneyAmount value={m.received} size="sm" tone={isNow ? "accent" : "muted"} decimals={0} round="down" /> : null}
            {isNow ? (
              <Badge tone="warning" size="sm">
                This round
              </Badge>
            ) : state === "done" ? (
              <Badge tone="success" size="sm" dot>
                Paid out
              </Badge>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
