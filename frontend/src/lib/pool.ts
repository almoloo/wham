import { ratioBps, toBigInt } from "./money";

/**
 * - `unknown`: no usable target, so there is nothing to measure the balance against. Show the balance
 *   but make no claim about how full or healthy the pool is.
 * - `empty`: there is a target and nothing in the pool.
 * - `partial` / `full`: balance below / at-or-above the target.
 */
export type PoolFillState = "unknown" | "empty" | "partial" | "full";

export interface PoolFill {
  state: PoolFillState;
  /** Fill as integer basis points, 0..10_000. Always 0 for `unknown` and `empty`. */
  bps: number;
  /** True only when there is a target and the pool is at least 60% of it. Never true for `unknown`. */
  healthy: boolean;
}

/** The pool reads as healthy from this fill upwards (60%). */
const HEALTHY_BPS = 6_000;

/** How full the insurance pool is against its target, in integer math. */
export function poolFill(balance: string | bigint, target?: string | bigint): PoolFill {
  const targetAmount = target === undefined ? 0n : toBigInt(target);
  const balanceAmount = toBigInt(balance);

  // Validate both before branching so a bad balance can't hide behind a missing target.
  if (targetAmount <= 0n) return { state: "unknown", bps: 0, healthy: false };
  if (balanceAmount <= 0n) return { state: "empty", bps: 0, healthy: false };

  const bps = ratioBps(balanceAmount, targetAmount);
  return {
    state: balanceAmount >= targetAmount ? "full" : "partial",
    bps,
    healthy: bps >= HEALTHY_BPS,
  };
}
