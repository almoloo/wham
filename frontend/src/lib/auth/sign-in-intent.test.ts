import { describe, expect, it } from "vitest";
import { decideSignInIntent } from "./sign-in-intent";

const base = {
  hasSignInParam: true,
  sessionStatus: "unauthenticated" as const,
  walletStatus: "disconnected" as const,
  modalAvailable: true,
  alreadyHandled: false,
};
const decide = (over: Partial<Parameters<typeof decideSignInIntent>[0]>) => decideSignInIntent({ ...base, ...over });

describe("decideSignInIntent — /?signin=1", () => {
  it("opens the connect modal for a signed-out visitor", () => {
    expect(decide({})).toBe("open-modal");
  });

  it("opens it for a connected-but-unsigned wallet too (the modal shows the sign-in step)", () => {
    expect(decide({ walletStatus: "connected" })).toBe("open-modal");
  });

  it("does nothing without the signin param", () => {
    expect(decide({ hasSignInParam: false })).toBe("none");
  });

  it("never reopens a modal for a URL it already handled (the user may have closed it)", () => {
    expect(decide({ alreadyHandled: true })).toBe("none");
  });

  it("waits for the first session check before deciding", () => {
    expect(decide({ sessionStatus: "loading" })).toBe("wait");
  });

  it("waits while a remembered wallet is reconnecting, rather than flashing the wallet chooser", () => {
    expect(decide({ walletStatus: "reconnecting" })).toBe("wait");
    expect(decide({ walletStatus: "connecting" })).toBe("wait");
  });

  it("waits until RainbowKit's modal is available", () => {
    expect(decide({ modalAvailable: false })).toBe("wait");
  });

  it("redirects a user who is already signed in instead of showing a sign-in prompt", () => {
    expect(decide({ sessionStatus: "authenticated", walletStatus: "connected" })).toBe("redirect");
  });

  it("checks the session before the wallet: a signed-in user redirects even mid-reconnect", () => {
    expect(decide({ sessionStatus: "authenticated", walletStatus: "reconnecting" })).toBe("redirect");
  });
});

describe("decideSignInIntent — when the session check failed", () => {
  it("waits rather than asking a possibly signed-in user to sign in", () => {
    expect(decide({ sessionStatus: "unavailable" })).toBe("wait");
    expect(decide({ sessionStatus: "unavailable", walletStatus: "connected" })).toBe("wait");
  });
});
