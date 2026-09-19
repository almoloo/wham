import { describe, expect, it } from "vitest";
import { poolFill } from "./pool";

describe("poolFill", () => {
  describe("no target to measure against", () => {
    it("is unknown when the target is missing, whatever the balance", () => {
      expect(poolFill("5000000000")).toEqual({ state: "unknown", bps: 0, healthy: false });
      expect(poolFill("0", undefined)).toEqual({ state: "unknown", bps: 0, healthy: false });
    });

    it("is unknown when the target is zero, including the empty-pool 0/0 case that used to be NaN", () => {
      expect(poolFill("0", "0")).toEqual({ state: "unknown", bps: 0, healthy: false });
      expect(poolFill("50", "0")).toEqual({ state: "unknown", bps: 0, healthy: false });
    });

    it("never reports a full or healthy bar just because the target is unknown", () => {
      // The old code fell back to `target || balance`, showing 100% and green.
      const fill = poolFill("3400000000", "0");
      expect(fill.state).not.toBe("full");
      expect(fill.healthy).toBe(false);
    });
  });

  it("is empty when the balance is zero and there is a target", () => {
    expect(poolFill("0", "5000000000")).toEqual({ state: "empty", bps: 0, healthy: false });
  });

  it("treats a negative balance as empty rather than a negative fill", () => {
    expect(poolFill("-1", "5000000000")).toEqual({ state: "empty", bps: 0, healthy: false });
  });

  it("is partial below the target, with integer basis points", () => {
    expect(poolFill("3400000000", "5000000000")).toEqual({ state: "partial", bps: 6_800, healthy: true });
    expect(poolFill("1000000000", "5000000000")).toEqual({ state: "partial", bps: 2_000, healthy: false });
  });

  it("switches to healthy at exactly 60%", () => {
    expect(poolFill("2999999999", "5000000000").healthy).toBe(false);
    expect(poolFill("3000000000", "5000000000")).toEqual({ state: "partial", bps: 6_000, healthy: true });
  });

  it("is full at the target and clamps above it", () => {
    expect(poolFill("5000000000", "5000000000")).toEqual({ state: "full", bps: 10_000, healthy: true });
    expect(poolFill("9000000000", "5000000000")).toEqual({ state: "full", bps: 10_000, healthy: true });
  });

  it("is still partial one base unit below the target", () => {
    expect(poolFill("9999999", "10000000")).toEqual({ state: "partial", bps: 9_999, healthy: true });
  });

  it("accepts bigint and is exact at uint256 scale", () => {
    expect(poolFill(3_400_000_000n, 5_000_000_000n).bps).toBe(6_800);
    const huge = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    expect(poolFill(huge, huge)).toEqual({ state: "full", bps: 10_000, healthy: true });
  });

  it("throws on an invalid amount string instead of rendering a guess", () => {
    expect(() => poolFill("12.5", "100")).toThrow();
    expect(() => poolFill("100", "abc")).toThrow();
  });

  it("always yields an integer fill in 0..10_000, never NaN, over a grid including zeros", () => {
    const values = ["-5", "0", "1", "7", "999", "1000", "5000000000", "9999999999999999999999"];
    for (const balance of values) {
      for (const target of [undefined, ...values]) {
        const { bps } = poolFill(balance, target);
        expect(Number.isInteger(bps), `integer for ${balance}/${target}`).toBe(true);
        expect(bps >= 0 && bps <= 10_000, `in range for ${balance}/${target}`).toBe(true);
      }
    }
  });
});
