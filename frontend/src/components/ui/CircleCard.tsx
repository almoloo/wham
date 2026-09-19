import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { toBigInt } from "@/lib/money";
import { AvatarStack, type StackMember } from "./AvatarStack";
import { Button } from "./Button";
import { Card } from "./Card";
import { FillMeter } from "./FillMeter";
import { MoneyAmount } from "./MoneyAmount";
import { StatusChip } from "./StatusChip";
import { TierChip, type TierChipProps } from "./TierChip";

interface CircleCardCta {
  state: "join" | "lowScore" | "lowBalance" | "full" | "member" | "guest";
  /** How much the member is short by, in base units (decimal string). */
  amount?: string;
  needScore?: number;
  onClick?: () => void;
  onDetail?: () => void;
}

/**
 * CTA states are the whole point of this card: it has to communicate the obligation
 * (you will pay X, N times) as clearly as the benefit (you get Y once), or it produces
 * members who default.
 */
function Cta({ cta }: { cta?: CircleCardCta }): ReactNode {
  if (!cta) return null;
  const { state, amount, needScore, onClick, onDetail } = cta;

  if (state === "join") {
    return (
      <Button full variant="primary" onClick={onClick}>
        Join circle
      </Button>
    );
  }
  if (state === "lowScore") {
    return (
      <div className="grid gap-1.5">
        <Button full variant="secondary" disabled>
          Needs a score of {needScore}
        </Button>
        <a href="#" className="text-center text-text-link" style={{ font: "var(--text-body-s)" }}>
          How reputation works
        </a>
      </div>
    );
  }
  if (state === "lowBalance") {
    return (
      <Button full variant="secondary" onClick={onDetail ?? onClick}>
        You&apos;d need <MoneyAmount value={amount ?? "0"} unit="USDC" decimals={2} round="up" role="inline" className="ms-1" />
      </Button>
    );
  }
  if (state === "full") {
    return (
      <Button full variant="ghost" onClick={onDetail ?? onClick}>
        Full — view circle
      </Button>
    );
  }
  if (state === "member") {
    return (
      <div
        className="grid h-11 place-items-center rounded-pill bg-surface-brand-quiet text-text-brand"
        style={{ font: "var(--text-ui-s)" }}
      >
        You&apos;re in this circle
      </div>
    );
  }
  if (state === "guest") {
    return (
      <Button full variant="secondary" onClick={onClick}>
        Connect wallet to see your deposit
      </Button>
    );
  }
  return null;
}

export interface CircleCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  /** Fixed contribution per member per round, in base units (decimal string). */
  contribution: string;
  /** "Weekly" | "Fortnightly" | "Monthly". */
  cadence?: string;
  members?: Array<string | StackMember>;
  /** Full group size when the members array is only a sample. */
  size?: number;
  rounds?: number;
  /** Confirmed members so far, for the FillMeter. Defaults to members.length. */
  filled?: number;
  /** Pot per round; computed as contribution × size when omitted. */
  pot?: string;
  /** Status string, rendered via StatusChip, e.g. "forming" / "active" / "full". */
  status?: string;
  /** Required (browse) or earned (profile) tier — same visual either way. */
  tier?: TierChipProps["tier"];
  /** Signed-in personalised deposit estimate. */
  deposit?: string;
  /** Shown instead of deposit when signed out, e.g. 1.5 → "Deposit from 1.5× contribution". */
  depositMultiplier?: number;
  /** Relative start date string, e.g. "in 6 days". */
  startDate?: string;
  /** Drives the state-dependent CTA area. */
  cta?: CircleCardCta;
  onClick?: () => void;
}

/**
 * The browse-grid unit: pot per round first, then terms, deposit, seat fill, and a
 * state-dependent CTA. Makes an unfamiliar financial instrument legible in ~4 seconds.
 */
export function CircleCard({
  name,
  contribution,
  cadence = "Monthly",
  members = [],
  size,
  rounds = 12,
  filled,
  pot,
  status,
  tier,
  deposit,
  depositMultiplier,
  startDate,
  cta,
  onClick,
  className,
  ...rest
}: CircleCardProps) {
  const seats = size ?? rounds;
  const seatsFilled = filled ?? members.length;

  return (
    <Card interactive={!!onClick} onClick={onClick} className={cx("grid gap-3.5", className)} {...rest}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1.5">
          <span className="text-text-strong" style={{ font: "var(--text-title-s)" }}>
            {name}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {tier ? <TierChip tier={tier} /> : null}
            {status ? <StatusChip status={status} /> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-0.5 rounded-md bg-surface-sunken px-3.5 py-3">
        <span className="wham-label">Pot per round</span>
        <MoneyAmount value={pot ?? toBigInt(contribution) * BigInt(seats)} unit="USDC" decimals={2} round="down" role="hero" />
      </div>

      <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
        <MoneyAmount value={contribution} unit="USDC" decimals={2} round="up" role="inline" /> / round · {seats} members ·{" "}
        {cadence}
      </span>

      {deposit != null ? (
        <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
          Your deposit: ~<MoneyAmount value={deposit} unit="USDC" decimals={2} round="up" role="inline" tone="accent" />
        </span>
      ) : depositMultiplier ? (
        <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
          Deposit from {depositMultiplier}× contribution
        </span>
      ) : null}

      <FillMeter filled={seatsFilled} target={seats} />

      <div className="flex items-center justify-between gap-3">
        <AvatarStack members={members} total={seats} max={4} />
        {startDate ? (
          <span className="text-text-subtle" style={{ font: "var(--text-body-s)" }}>
            Starts {startDate}
          </span>
        ) : null}
      </div>

      <Cta cta={cta} />
    </Card>
  );
}
