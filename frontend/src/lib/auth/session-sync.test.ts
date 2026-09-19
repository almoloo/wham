import { describe, expect, it } from "vitest";
import { decideSessionSync, deriveSessionStatus, nextWasConnected, type SyncInput } from "./session-sync";

const A = "0x7A3f9C2e1B4d8A6f0C5e3D9b2a1f4e8c7d6B5A40";
const B = "0x1111111111111111111111111111111111111111";

const base: SyncInput = {
  sessionStatus: "authenticated",
  sessionAddress: A,
  wallet: { status: "connected", address: A },
  wasConnected: true,
  inApp: true,
  leaving: false,
};
const decide = (over: Partial<SyncInput>) => decideSessionSync({ ...base, ...over });

const nothing = { endSession: false, navigate: null };

describe("decideSessionSync — the stale-session bug class (§3.3)", () => {
  it("does nothing when the wallet matches the session", () => {
    expect(decide({})).toEqual(nothing);
  });

  it("compares addresses case-insensitively", () => {
    expect(decide({ wallet: { status: "connected", address: A.toLowerCase() } })).toEqual(nothing);
    expect(decide({ sessionAddress: A.toUpperCase().replace("0X", "0x") })).toEqual(nothing);
  });

  it("ends the session and re-prompts when the wallet switches account inside the app", () => {
    expect(decide({ wallet: { status: "connected", address: B } })).toEqual({
      endSession: true,
      navigate: "sign-in",
    });
  });

  it("ends the session but stays put when the mismatch happens outside the app", () => {
    expect(decide({ inApp: false, wallet: { status: "connected", address: B } })).toEqual({
      endSession: true,
      navigate: null,
    });
  });

  it("catches a wallet that comes back as a DIFFERENT account on page load", () => {
    // No change event fires here, so RainbowKit's own signOut never runs.
    // wasConnected is false: this is the first time we see the wallet.
    expect(decide({ wasConnected: false, wallet: { status: "connected", address: B } })).toEqual({
      endSession: true,
      navigate: "sign-in",
    });
  });

  it("does not judge the wallet while it is still connecting or reconnecting", () => {
    for (const status of ["connecting", "reconnecting"] as const) {
      expect(decide({ wallet: { status, address: B } })).toEqual(nothing);
      expect(decide({ wallet: { status, address: undefined } })).toEqual(nothing);
    }
  });

  it("does not treat a connected wallet with no address yet as a mismatch", () => {
    expect(decide({ wallet: { status: "connected", address: undefined } })).toEqual(nothing);
  });
});

describe("decideSessionSync — disconnect (§3.3)", () => {
  it("ends the session and returns home when a connected wallet disconnects inside the app", () => {
    expect(decide({ wallet: { status: "disconnected", address: undefined } })).toEqual({
      endSession: true,
      navigate: "home",
    });
  });

  it("ends the session but does not navigate when it disconnects on a public page", () => {
    expect(decide({ inApp: false, wallet: { status: "disconnected", address: undefined } })).toEqual({
      endSession: true,
      navigate: null,
    });
  });

  it("does NOT sign anyone out just because no wallet is connected on page load", () => {
    expect(decide({ wasConnected: false, wallet: { status: "disconnected", address: undefined } })).toEqual(nothing);
  });

  it("skips the session teardown when there is no session to end", () => {
    expect(
      decide({
        sessionStatus: "unauthenticated",
        sessionAddress: null,
        wallet: { status: "disconnected", address: undefined },
      }),
    ).toEqual({ endSession: false, navigate: "home" });
  });
});

describe("decideSessionSync — no session on an authenticated route", () => {
  it("sends a signed-out visitor on /app/* to sign-in (a stale cookie gets past the middleware)", () => {
    expect(decide({ sessionStatus: "unauthenticated", sessionAddress: null })).toEqual({
      endSession: false,
      navigate: "sign-in",
    });
  });

  it("leaves a signed-out visitor alone on a public page", () => {
    expect(decide({ sessionStatus: "unauthenticated", sessionAddress: null, inApp: false })).toEqual(nothing);
  });

  it("waits while the first session check is still loading", () => {
    expect(decide({ sessionStatus: "loading", sessionAddress: null })).toEqual(nothing);
    expect(decide({ sessionStatus: "loading", sessionAddress: null, wallet: { status: "disconnected", address: undefined } })).toEqual(
      nothing,
    );
  });

  it("does not fight an intentional sign-out that is already navigating home", () => {
    expect(decide({ sessionStatus: "unauthenticated", sessionAddress: null, leaving: true })).toEqual(nothing);
  });
});

describe("deriveSessionStatus — a failed first load is NOT a sign-out", () => {
  it("reads as loading until the first check settles", () => {
    expect(deriveSessionStatus({ isPending: true, isError: false, hasUser: false })).toBe("loading");
  });

  it("reads as authenticated when there is a user", () => {
    expect(deriveSessionStatus({ isPending: false, isError: false, hasUser: true })).toBe("authenticated");
  });

  it("reads as signed out only for a check that SUCCEEDED with no user", () => {
    expect(deriveSessionStatus({ isPending: false, isError: false, hasUser: false })).toBe("unauthenticated");
  });

  it("reads as unavailable when the first check failed (backend or BFF down)", () => {
    expect(deriveSessionStatus({ isPending: false, isError: true, hasUser: false })).toBe("unavailable");
  });

  it("keeps the last known user through a later refetch error", () => {
    expect(deriveSessionStatus({ isPending: false, isError: true, hasUser: true })).toBe("authenticated");
  });
});

describe("decideSessionSync — an unavailable session never redirects, prompts or clears", () => {
  it("does not bounce a user off /app during an outage", () => {
    expect(decide({ sessionStatus: "unavailable", sessionAddress: null })).toEqual(nothing);
  });

  it("does nothing for any wallet state while unavailable", () => {
    for (const status of ["connected", "connecting", "reconnecting", "disconnected"] as const) {
      expect(decide({ sessionStatus: "unavailable", sessionAddress: null, wallet: { status, address: B } })).toEqual(
        nothing,
      );
    }
  });
});

describe("nextWasConnected", () => {
  it("becomes true on connected and false on disconnected", () => {
    expect(nextWasConnected(false, "connected")).toBe(true);
    expect(nextWasConnected(true, "disconnected")).toBe(false);
  });

  it("holds its value while connecting or reconnecting", () => {
    for (const status of ["connecting", "reconnecting"] as const) {
      expect(nextWasConnected(true, status)).toBe(true);
      expect(nextWasConnected(false, status)).toBe(false);
    }
  });
});
