import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { formatMoney, toBigInt, type FormatMoneyOptions, type Rounding } from "@/lib/money";

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

interface MoneyAmountBaseProps extends HTMLAttributes<HTMLSpanElement> {
  /** Base units (uint256): a decimal string as sent over the wire, or a bigint. Never a JS number. */
  value: string | bigint;
  /** Token decimals used to turn base units into a figure. Default 6 (USDC). */
  tokenDecimals?: number;
  /** Symbol before the figure. Default "$". */
  currency?: string;
  /** Trailing unit in small muted type, e.g. "USDC". */
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Semantic role — sets size for you. "hero" largest on the page, "primary" acting-on amount, "inline" matches body text, "ledger" right-aligned tabular for table columns. */
  role?: "hero" | "primary" | "inline" | "ledger";
  tone?: "default" | "muted" | "positive" | "negative" | "accent" | "inverse";
  /** Show a leading + / − for deltas. */
  sign?: boolean;
  /** Shorthand for tone="muted" — informational rather than actionable amounts. */
  muted?: boolean;
  /** Gross amount being reduced, e.g. in a pot breakdown. */
  strikethrough?: boolean;
}

/**
 * Shows the exact amount by default. To show fewer digits, pass `decimals` together with `round`:
 * "up" for amounts a member owes (never show less than they must pay), "down" for amounts they
 * receive (never promise more than they get). The pair is enforced by the type.
 */
export type MoneyAmountProps = MoneyAmountBaseProps &
  ({ decimals?: undefined; round?: undefined } | { decimals: number; round: Rounding });

/** Currency figure with tabular lining numerals — the only sanctioned way to render money in Wham. */
export function MoneyAmount({
  value,
  tokenDecimals,
  currency = "$",
  unit,
  size = "md",
  role,
  decimals,
  round,
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
  const amount = toBigInt(value);
  const magnitude = amount < 0n ? -amount : amount;
  // decimals/round are a pair at the type level; formatMoney re-checks it at runtime.
  const text = formatMoney(magnitude, { tokenDecimals, decimals, round } as FormatMoneyOptions);
  // A negative that rounds to nothing shows no sign: "−$0.00" would read as a real amount.
  const prefix = !sign ? "" : amount > 0n ? "+" : amount < 0n && /[1-9]/.test(text) ? "−" : "";

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
      {text}
      {unit ? <span className="ms-[5px] text-text-muted" style={{ font: "var(--text-ui-s)" }}>{unit}</span> : null}
    </span>
  );
}
