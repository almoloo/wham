import type { HTMLAttributes } from "react";
import { Badge, type BadgeTone } from "./Badge";

type Weight = "neutral" | "positive" | "progress" | "warning" | "negative" | "accent";

/**
 * Maps the ~20 status strings used across circles, members, rounds and bids onto
 * six semantic weights, so the palette stays restrained no matter how many
 * vocabularies feed into it. Add new strings to a weight bucket, never a new color.
 */
const WEIGHTS: Record<Weight, string[]> = {
  neutral: ["forming", "upcoming", "pending", "waiting"],
  positive: ["active", "settled", "paid", "completed", "confirmed"],
  progress: ["bidding", "funding", "due soon", "checking", "sending", "confirming", "awaiting signature"],
  warning: ["delinquent", "overdue", "outbid", "covered", "stalled", "failed"],
  negative: ["defaulted", "cancelled", "unwinding"],
  accent: ["paid out", "payout ready", "leading", "won"],
};

const TONE_BY_WEIGHT: Record<Weight, BadgeTone> = {
  neutral: "neutral",
  positive: "success",
  progress: "info",
  warning: "warning",
  negative: "danger",
  accent: "brand",
};

function weightFor(status: string): Weight {
  const s = status.toLowerCase();
  for (const w of Object.keys(WEIGHTS) as Weight[]) {
    if (WEIGHTS[w].includes(s)) return w;
  }
  return "neutral";
}

export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** The raw status string, shown verbatim as the label, e.g. "delinquent", "payout ready". */
  status: string;
  /** Override automatic weight resolution if a status string isn't in the built-in map. */
  weight?: Weight;
  size?: "sm" | "md";
}

/** One visual language for every status string in the product. Maps onto six semantic weights instead of giving each string its own color. */
export function StatusChip({ status, weight, size = "md", ...rest }: StatusChipProps) {
  const w = weight ?? weightFor(status);
  return (
    <Badge tone={TONE_BY_WEIGHT[w]} dot size={size} {...rest}>
      {status}
    </Badge>
  );
}
