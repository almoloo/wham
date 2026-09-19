import { describe, expect, it } from "vitest";
import { APP_CHAIN, isChainSupported } from "./chain";

describe("isChainSupported", () => {
  it("accepts exactly the configured chain", () => {
    expect(isChainSupported(APP_CHAIN.id)).toBe(true);
  });

  it("rejects mainnet, other L2s, the other Arbitrum chain, and unknown", () => {
    const other = APP_CHAIN.id === 421614 ? 42161 : 421614;
    for (const id of [1, 10, 8453, other, 0]) expect(isChainSupported(id), String(id)).toBe(false);
    expect(isChainSupported(undefined)).toBe(false);
  });
});
