/**
 * Money helpers. Amounts are uint256 base units: decimal strings on the wire, bigint in memory.
 * Nothing in here touches a JS number for money, so nothing can lose a base unit.
 */

export type Rounding = "up" | "down";

/**
 * Omit `decimals` to show the exact amount. Ask for fewer digits and you must say which way to
 * round: "up" for amounts a user OWES (they must never be one base unit short), "down" for amounts
 * they will RECEIVE (the UI must never over-promise). Rounding is by magnitude, so "up" is away
 * from zero and "down" is toward zero.
 */
export type FormatMoneyOptions =
  | { tokenDecimals?: number; decimals?: undefined; round?: undefined }
  | { tokenDecimals?: number; decimals: number; round: Rounding };

const DEFAULT_TOKEN_DECIMALS = 6;
const BPS_DENOMINATOR = 10_000n;

// en-US always: money is shown in Latin numerals even in the Persian locale.
const GROUPING = new Intl.NumberFormat("en-US");

function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function assertDigits(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer, got ${value}`);
  }
}

/** Strict parse of a base-unit amount. Throws instead of guessing, so bad API data fails loudly in dev. */
export function toBigInt(value: string | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    throw new TypeError(`Invalid money amount: ${JSON.stringify(value)}`);
  }
  return BigInt(value);
}

/** "42.5" -> 42_500_000n. Throws on more fraction digits than the token has rather than rounding them away. */
export function parseUnits(value: string, tokenDecimals: number = DEFAULT_TOKEN_DECIMALS): bigint {
  assertDigits(tokenDecimals, "tokenDecimals");
  const match = typeof value === "string" ? /^(-?)(\d+)(?:\.(\d+))?$/.exec(value) : null;
  if (!match) throw new TypeError(`Invalid decimal amount: ${JSON.stringify(value)}`);
  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > tokenDecimals) {
    throw new RangeError(`"${value}" has more than ${tokenDecimals} fraction digits`);
  }
  const units = BigInt(whole + fraction.padEnd(tokenDecimals, "0"));
  return sign ? -units : units;
}

/** Formats base units for display, without a currency symbol. See {@link FormatMoneyOptions} for rounding. */
export function formatMoney(value: string | bigint, options: FormatMoneyOptions = {}): string {
  const tokenDecimals = options.tokenDecimals ?? DEFAULT_TOKEN_DECIMALS;
  assertDigits(tokenDecimals, "tokenDecimals");

  const amount = toBigInt(value);
  const negative = amount < 0n;
  const magnitude = negative ? -amount : amount;
  const scale = pow10(tokenDecimals);

  let whole: bigint;
  let fraction: string;
  let isZero: boolean;

  if (options.decimals === undefined) {
    whole = magnitude / scale;
    const digits = tokenDecimals === 0 ? "" : (magnitude % scale).toString().padStart(tokenDecimals, "0");
    const trimmed = digits.replace(/0+$/, "");
    // Whole amounts show no fraction; anything else shows at least cents, and never fewer digits than it has.
    fraction = trimmed === "" ? "" : trimmed.padEnd(2, "0");
    isZero = magnitude === 0n;
  } else {
    const { decimals, round } = options;
    assertDigits(decimals, "decimals");
    if (round !== "up" && round !== "down") {
      throw new TypeError(`round must be "up" or "down" when decimals is set, got ${JSON.stringify(round)}`);
    }

    if (decimals >= tokenDecimals) {
      // The token has no finer precision than requested: nothing to round, just pad.
      whole = magnitude / scale;
      const digits = tokenDecimals === 0 ? "" : (magnitude % scale).toString().padStart(tokenDecimals, "0");
      fraction = digits.padEnd(decimals, "0");
      isZero = magnitude === 0n;
    } else {
      const step = pow10(tokenDecimals - decimals);
      let units = magnitude / step;
      if (round === "up" && magnitude % step !== 0n) units += 1n;
      const unitScale = pow10(decimals);
      whole = units / unitScale;
      fraction = decimals === 0 ? "" : (units % unitScale).toString().padStart(decimals, "0");
      isZero = units === 0n;
    }
  }

  // "-0.00" would read as a real, tiny negative amount; a value that rounds to nothing has no sign.
  const sign = negative && !isZero ? "-" : "";
  return `${sign}${GROUPING.format(whole)}${fraction === "" ? "" : `.${fraction}`}`;
}

/**
 * numerator / denominator as integer basis points (10_000 = 100%), floored and clamped to 0..10_000.
 * A zero or negative denominator gives 0, never NaN, so a fill bar can't be handed an invalid width.
 */
export function ratioBps(numerator: string | bigint, denominator: string | bigint): number {
  const top = toBigInt(numerator);
  const bottom = toBigInt(denominator);
  if (bottom <= 0n || top <= 0n) return 0;
  const bps = (top * BPS_DENOMINATOR) / bottom;
  return bps > BPS_DENOMINATOR ? Number(BPS_DENOMINATOR) : Number(bps);
}

/**
 * amount x bps / 10_000 in integer math, floored: the same arithmetic as the contract's
 * `discountAmount = grossPot * discountBps / 10000`, so a preview can't drift from settlement.
 */
export function mulBps(amount: string | bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new RangeError(`bps must be a non-negative integer, got ${bps}`);
  }
  const value = toBigInt(amount);
  if (value < 0n) throw new RangeError("mulBps expects a non-negative amount");
  return (value * BigInt(bps)) / BPS_DENOMINATOR;
}

/**
 * Basis points as a percentage string: 450 -> "4.5". Shows at least `minFractionDigits` and up to two
 * as needed, so a 25-bps step (the contract's minimum bid increment) reads "4.25", never a rounded "4.3".
 */
export function formatBps(bps: number, minFractionDigits = 1): string {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new RangeError(`bps must be a non-negative integer, got ${bps}`);
  }
  assertDigits(minFractionDigits, "minFractionDigits");

  const remainder = bps % 100;
  const whole = (bps - remainder) / 100;
  let fraction = String(remainder).padStart(2, "0");
  while (fraction.length > minFractionDigits && fraction.endsWith("0")) {
    fraction = fraction.slice(0, -1);
  }
  fraction = fraction.padEnd(minFractionDigits, "0");
  return fraction === "" ? String(whole) : `${whole}.${fraction}`;
}
