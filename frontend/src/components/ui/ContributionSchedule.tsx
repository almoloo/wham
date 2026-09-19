import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Badge, type BadgeTone } from "./Badge";
import { DueDateTile, type DueDateTileProps } from "./DueDateTile";
import { ListRow } from "./ListRow";
import { MoneyAmount } from "./MoneyAmount";

export interface ScheduleRound {
  round: number;
  day: number | string;
  month: string;
  /** Base units (decimal string). */
  amount: string;
  /** paid | due | overdue | upcoming | payout */
  state?: "paid" | "due" | "overdue" | "upcoming" | "payout";
  /** Who receives the pot that round. */
  recipient?: string;
  /** Extra clause — e.g. "Won with a 4% bid". */
  note?: ReactNode;
  /** Override the badge word. */
  label?: string;
}

const STATE: Record<NonNullable<ScheduleRound["state"]>, { tone: BadgeTone; label: string; tile: DueDateTileProps["tone"] }> = {
  paid: { tone: "success", label: "Paid", tile: "paid" },
  due: { tone: "warning", label: "Due", tile: "due" },
  overdue: { tone: "danger", label: "Overdue", tile: "overdue" },
  upcoming: { tone: "neutral", label: "Upcoming", tile: "default" },
  payout: { tone: "brand", label: "Your payout", tile: "payout" },
};

export interface ContributionScheduleProps extends HTMLAttributes<HTMLDivElement> {
  rounds: ScheduleRound[];
}

/** Round-by-round schedule for one circle: date, round, recipient, amount, state. */
export function ContributionSchedule({ rounds, className, ...rest }: ContributionScheduleProps) {
  return (
    <div className={cx("grid", className)} {...rest}>
      {rounds.map((r, i) => {
        const s = STATE[r.state ?? "upcoming"];
        return (
          <ListRow
            key={i}
            divider={i < rounds.length - 1}
            leading={<DueDateTile day={r.day} month={r.month} tone={s.tile} size="sm" />}
            title={`Round ${r.round}${r.recipient ? ` · ${r.recipient}` : ""}`}
            subtitle={r.note}
            trailing={
              <div className="flex items-center gap-2.5">
                <MoneyAmount value={r.amount} size="sm" tone={r.state === "payout" ? "accent" : "default"} sign={r.state === "payout"} />
                <Badge tone={s.tone} size="sm" dot>
                  {r.label ?? s.label}
                </Badge>
              </div>
            }
          />
        );
      })}
    </div>
  );
}
