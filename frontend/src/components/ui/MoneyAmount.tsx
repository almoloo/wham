import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const SIZE_FONT: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: "var(--weight-semibold) var(--size-body-s)/1.2 var(--font-core)",
  md: "var(--text-money-m)",
  lg: "var(--text-money-l)",
  xl: "var(--text-display-m)",
};

/** Role is the semantic entry point (hero/primary/inline/ledger); size is a lower-level override. */
const ROLE_SIZE: Partial<Record<NonNullable<MoneyAmountProps["role"]>, keyof typeof SIZE_FONT>> = {
  hero: "xl",
  primary: "lg",
  ledger: "sm",
};

const TONE_COLOR: Record<NonNullable<MoneyAmountProps["tone"]>, string> = {
  default: "var(--text-strong)",
  muted: "var(--text-muted)",
  positive: "var(--status-success-text)",
  negative: "var(--status-danger-text)",
  accent: "var(--saffron-600)",
  inverse: "var(--text-inverse)",
};

function format(value: number, decimals: number) {
  if (!isFinite(value)) return String(value);
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export interface MoneyAmountProps extends HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  /** Symbol before the figure. Default "$". */
  currency?: string;
  /** Trailing unit in small muted type, e.g. "USDC". */
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Semantic role — sets size for you. "hero" largest on the page, "primary" acting-on amount, "inline" matches body text, "ledger" right-aligned tabular for table columns. */
  role?: "hero" | "primary" | "inline" | "ledger";
  decimals?: number;
  tone?: "default" | "muted" | "positive" | "negative" | "accent" | "inverse";
  /** Show a leading + / − for deltas. */
  sign?: boolean;
  /** Shorthand for tone="muted" — informational rather than actionable amounts. */
  muted?: boolean;
  /** Gross amount being reduced, e.g. in a pot breakdown. */
  strikethrough?: boolean;
}

/** Currency figure with tabular lining numerals — the only sanctioned way to render money in Wham. */
export function MoneyAmount({
  value,
  currency = "$",
  unit,
  size = "md",
  role,
  decimals = 0,
  tone = "default",
  sign = false,
  muted = false,
  strikethrough = false,
  className,
  style,
  ...rest
}: MoneyAmountProps) {
  const resolvedSize = role && role !== "inline" ? ROLE_SIZE[role] ?? size : size;
  const resolvedTone = muted ? "muted" : tone;
  const n = Number(value);
  const prefix = sign && n > 0 ? "+" : sign && n < 0 ? "−" : "";

  const spanStyle: CSSProperties = {
    font: SIZE_FONT[resolvedSize],
    color: TONE_COLOR[resolvedTone],
    letterSpacing: "var(--tracking-title)",
    textAlign: role === "ledger" ? "right" : undefined,
    textDecorationColor: strikethrough ? "var(--text-subtle)" : undefined,
    opacity: strikethrough ? 0.6 : 1,
    ...style,
  };

  return (
    <span
      className={cx("wham-tnum whitespace-nowrap", strikethrough && "line-through", className)}
      style={spanStyle}
      {...rest}
    >
      {prefix}
      {currency}
      {format(Math.abs(n), decimals)}
      {unit ? <span className="ms-[5px] text-text-muted" style={{ font: "var(--text-ui-s)" }}>{unit}</span> : null}
    </span>
  );
}
