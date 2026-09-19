import { describe, expect, it } from "vitest";
import { AUTH_COPY } from "./auth";

describe("AUTH_COPY — frontend spec §3.2–§3.4 strings are verbatim", () => {
  // These are written product copy. A failing test here means someone
  // paraphrased it: restore the spec's wording, don't update the test.
  it("uses the spec's exact wording", () => {
    expect(AUTH_COPY.siweStatement).toBe(
      "Sign in to Wham. This signature proves you control this wallet. It does not authorise any transaction or move any funds.",
    );
    expect(AUTH_COPY.connectWallet).toBe("Connect wallet");
    expect(AUTH_COPY.signInToContinue).toBe("Sign in to continue");
    expect(AUTH_COPY.signInCancelled).toBe("Sign-in cancelled. Nothing was sent.");
    expect(AUTH_COPY.unsupportedChain).toBe("Wham runs on Arbitrum. Switch network to continue.");
  });

  it("never uses yield / APY / interest / returns language (§10.6, CLAUDE.md product rules)", () => {
    for (const [key, value] of Object.entries(AUTH_COPY)) {
      expect(value, key).not.toMatch(/\b(yield|apy|apr|interest|returns?|earn(s|ing)?|farming|degen|moon|alpha)\b/i);
    }
  });

  it("has no empty strings", () => {
    for (const [key, value] of Object.entries(AUTH_COPY)) expect(value.trim().length, key).toBeGreaterThan(0);
  });

  it("keeps the explainer short enough to be one line", () => {
    expect(AUTH_COPY.signingIsFree.length).toBeLessThan(80);
  });
});
