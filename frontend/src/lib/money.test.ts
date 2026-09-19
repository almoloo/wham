import { describe, expect, it } from "vitest";
import { formatBps, formatMoney, mulBps, parseUnits, ratioBps, toBigInt } from "./money";

describe("toBigInt", () => {
  it("accepts base-unit strings and bigints, including negatives", () => {
    expect(toBigInt("250000000")).toBe(250_000_000n);
    expect(toBigInt("-6000000")).toBe(-6_000_000n);
    expect(toBigInt(5n)).toBe(5n);
  });

  it("keeps uint256-scale values exact", () => {
    // 2^53 + 1: the first integer a JS number cannot represent.
    expect(toBigInt("9007199254740993")).toBe(9_007_199_254_740_993n);
    expect(String(toBigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"))).toBe(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    );
  });

  it.each(["", " ", "1.5", "1e6", "abc", "0x10", "12 ", "--1", "+1", "1_000"])("throws on %j", (bad) => {
    expect(() => toBigInt(bad)).toThrow();
  });

  it("throws on a JS number that slipped past the types", () => {
    expect(() => toBigInt(250 as unknown as string)).toThrow();
  });
});

describe("parseUnits", () => {
  it("scales a decimal string to base units", () => {
    expect(parseUnits("200", 6)).toBe(200_000_000n);
    expect(parseUnits("42.5", 6)).toBe(42_500_000n);
    expect(parseUnits("0.000001", 6)).toBe(1n);
    expect(parseUnits("-6", 6)).toBe(-6_000_000n);
    expect(parseUnits("5", 0)).toBe(5n);
  });

  it("throws rather than rounding away excess precision", () => {
    expect(() => parseUnits("0.0000001", 6)).toThrow();
    expect(() => parseUnits("5.1", 0)).toThrow();
  });

  it.each(["", ".5", "1.", "1,5", "1e3", "abc"])("throws on %j", (bad) => {
    expect(() => parseUnits(bad, 6)).toThrow();
  });
});

describe("formatMoney (exact by default)", () => {
  it("shows whole amounts without a fraction", () => {
    expect(formatMoney("950000000")).toBe("950");
    expect(formatMoney("0")).toBe("0");
  });

  it("shows at least two fraction digits and never rounds", () => {
    expect(formatMoney("250400000")).toBe("250.40");
    expect(formatMoney("42500000")).toBe("42.50");
    expect(formatMoney("5000")).toBe("0.005");
    expect(formatMoney("1")).toBe("0.000001");
  });

  it("groups thousands with Latin numerals", () => {
    expect(formatMoney("1000000000000")).toBe("1,000,000");
    expect(formatMoney("1234567890000")).toBe("1,234,567.89");
  });

  it("does not lose precision above 2^53", () => {
    expect(formatMoney("9007199254740993")).toBe("9,007,199,254.740993");
    expect(formatMoney("123456789012345678901234567890")).toBe("123,456,789,012,345,678,901,234.56789");
  });

  it("honours tokenDecimals", () => {
    expect(formatMoney("42", { tokenDecimals: 0 })).toBe("42");
    expect(formatMoney("1500000000000000000", { tokenDecimals: 18 })).toBe("1.50");
  });

  it("keeps the sign on negative values", () => {
    expect(formatMoney("-250400000")).toBe("-250.40");
  });
});

describe("formatMoney (explicit rounding direction)", () => {
  it("rounds an amount OWED up so the user is never short", () => {
    // 250.4 USDC owed: showing $250 would leave the user 0.4 short.
    expect(formatMoney("250400000", { decimals: 0, round: "up" })).toBe("251");
  });

  it("rounds an amount RECEIVABLE down so the UI never over-promises", () => {
    expect(formatMoney("250400000", { decimals: 0, round: "down" })).toBe("250");
  });

  it("does not move a value that is already exact at that precision", () => {
    expect(formatMoney("250000000", { decimals: 0, round: "up" })).toBe("250");
    expect(formatMoney("250000000", { decimals: 0, round: "down" })).toBe("250");
    expect(formatMoney("250400000", { decimals: 2, round: "up" })).toBe("250.40");
  });

  it("separates 0.005 the way nearest-rounding cannot", () => {
    expect(formatMoney("5000", { decimals: 2, round: "up" })).toBe("0.01");
    expect(formatMoney("5000", { decimals: 2, round: "down" })).toBe("0.00");
  });

  it("carries across the integer boundary and grouping", () => {
    expect(formatMoney("999999999", { decimals: 0, round: "up" })).toBe("1,000");
    expect(formatMoney("999999999", { decimals: 0, round: "down" })).toBe("999");
  });

  it("rounds by magnitude: up is away from zero, down is toward zero", () => {
    expect(formatMoney("-250400000", { decimals: 0, round: "up" })).toBe("-251");
    expect(formatMoney("-250400000", { decimals: 0, round: "down" })).toBe("-250");
  });

  it("never prints negative zero", () => {
    expect(formatMoney("-5000", { decimals: 2, round: "down" })).toBe("0.00");
  });

  it("pads with zeros when asked for more digits than the token has", () => {
    expect(formatMoney("500000", { decimals: 8, round: "down" })).toBe("0.50000000");
  });

  it("formats zero", () => {
    expect(formatMoney("0", { decimals: 2, round: "up" })).toBe("0.00");
  });

  it("brackets the true value: down <= exact <= up, at most one display unit apart", () => {
    const samples = [
      "1", "5000", "9999", "10000", "10001", "250400000", "999999999", "1000000", "1234567",
      "9007199254740993", "123456789012345678", "7", "499999", "500000", "500001", "0",
    ];
    for (const v of samples) {
      for (const decimals of [0, 1, 2, 3]) {
        const up = parseUnits(formatMoney(v, { decimals, round: "up" }).replaceAll(",", ""), 6);
        const down = parseUnits(formatMoney(v, { decimals, round: "down" }).replaceAll(",", ""), 6);
        const exact = BigInt(v);
        expect(down <= exact, `down<=exact for ${v}@${decimals}`).toBe(true);
        expect(up >= exact, `up>=exact for ${v}@${decimals}`).toBe(true);
        expect(up - down <= 10n ** BigInt(6 - decimals), `spread for ${v}@${decimals}`).toBe(true);
      }
    }
  });

  it("throws on invalid digit counts", () => {
    expect(() => formatMoney("1", { decimals: -1, round: "up" })).toThrow();
    expect(() => formatMoney("1", { decimals: 1.5, round: "up" })).toThrow();
    expect(() => formatMoney("1", { tokenDecimals: -1 })).toThrow();
    expect(() => formatMoney("1", { tokenDecimals: 2.5 })).toThrow();
  });

  it("throws on an invalid amount string", () => {
    expect(() => formatMoney("12.5")).toThrow();
  });
});

describe("ratioBps", () => {
  it("returns an integer number of basis points, floored", () => {
    expect(ratioBps("50", "100")).toBe(5_000);
    expect(ratioBps("1", "3")).toBe(3_333);
    expect(ratioBps(340_000_000n, "2000000000")).toBe(1_700);
  });

  it("clamps above 100%", () => {
    expect(ratioBps("200", "100")).toBe(10_000);
  });

  it("never yields NaN: a zero or negative denominator gives 0", () => {
    expect(ratioBps("0", "0")).toBe(0);
    expect(ratioBps("50", "0")).toBe(0);
    expect(ratioBps("50", "-100")).toBe(0);
  });

  it("gives 0 for a zero or negative numerator", () => {
    expect(ratioBps("0", "100")).toBe(0);
    expect(ratioBps("-5", "100")).toBe(0);
  });

  it("is exact for uint256-scale inputs", () => {
    const big = "9007199254740993000000";
    expect(ratioBps(big, big)).toBe(10_000);
    expect(ratioBps("9007199254740993", "18014398509481986")).toBe(5_000);
  });
});

describe("mulBps", () => {
  it("matches the contract's discountAmount = grossPot * discountBps / 10000", () => {
    // Contract spec worked example: 400 USDC pot, 11% bid -> 44 USDC.
    expect(mulBps("400000000", 1_100)).toBe(44_000_000n);
  });

  it("floors, exactly like Solidity integer division", () => {
    expect(mulBps("1", 5_000)).toBe(0n);
    expect(mulBps("3", 3_333)).toBe(0n);
    expect(mulBps("10001", 1)).toBe(1n);
  });

  it("is exact for uint256-scale amounts", () => {
    expect(mulBps("9007199254740993", 10_000)).toBe(9_007_199_254_740_993n);
  });

  it("handles 0 bps and zero amounts", () => {
    expect(mulBps("400000000", 0)).toBe(0n);
    expect(mulBps("0", 1_100)).toBe(0n);
  });

  it("throws on non-integer or negative bps, and on a negative amount", () => {
    expect(() => mulBps("100", 1.5)).toThrow();
    expect(() => mulBps("100", Number.NaN)).toThrow();
    expect(() => mulBps("100", -1)).toThrow();
    expect(() => mulBps("-100", 100)).toThrow();
  });

  it("never lets the amount given up shrink as the bid rises, or exceed the pot", () => {
    const pot = 2_000_000_000n;
    let previous = -1n;
    for (let bps = 0; bps <= 10_000; bps += 25) {
      const forgone = mulBps(pot, bps);
      expect(forgone >= previous, `monotonic at ${bps} bps`).toBe(true);
      expect(forgone <= pot, `<= pot at ${bps} bps`).toBe(true);
      previous = forgone;
    }
    expect(mulBps(pot, 10_000)).toBe(pot);
  });
});

describe("formatBps", () => {
  it("formats whole basis points as a percentage with at least one fraction digit", () => {
    expect(formatBps(450)).toBe("4.5");
    expect(formatBps(300)).toBe("3.0");
    expect(formatBps(0)).toBe("0.0");
    expect(formatBps(10_000)).toBe("100.0");
  });

  it("never hides precision: a 25-bps step shows both digits", () => {
    expect(formatBps(425)).toBe("4.25");
    expect(formatBps(5)).toBe("0.05");
  });

  it("respects a different minimum number of fraction digits", () => {
    expect(formatBps(450, 2)).toBe("4.50");
    expect(formatBps(400, 0)).toBe("4");
    expect(formatBps(450, 0)).toBe("4.5");
  });

  it("throws on non-integer, non-finite or negative bps", () => {
    expect(() => formatBps(4.5)).toThrow();
    expect(() => formatBps(Number.NaN)).toThrow();
    expect(() => formatBps(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => formatBps(-1)).toThrow();
  });
});
