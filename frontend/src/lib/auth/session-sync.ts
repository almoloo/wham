/*
 * Keeps the session and the connected wallet honest with each other (frontend
 * spec §3.3): "Account switch in wallet ≠ session switch … A stale session bound
 * to a different address is the single nastiest bug class here."
 *
 * RainbowKit calls `adapter.signOut()` on a disconnect or a live account change,
 * but it cannot see a wallet that comes back as a DIFFERENT account on page load
 * (no event fires), and it never navigates. This pure function decides what to
 * do; the SessionProvider effect carries it out.
 */

export type WalletStatus = "connected" | "connecting" | "reconnecting" | "disconnected";
/**
 * `unavailable` is a first session check that FAILED (backend or BFF down). It is
 * not "signed out": nothing may redirect, prompt or clear anything on it, or an
 * outage would bounce every signed-in user to a sign-in they don't need.
 */
export type SessionStatus = "loading" | "unavailable" | "unauthenticated" | "authenticated";

/** Turn the session query's state into a status. A last known user always wins over an error. */
export function deriveSessionStatus(query: { isPending: boolean; isError: boolean; hasUser: boolean }): SessionStatus {
  if (query.isPending) return "loading";
  if (query.hasUser) return "authenticated";
  return query.isError ? "unavailable" : "unauthenticated";
}

/** Whether the wallet has been connected at some point this page session. */
export function nextWasConnected(previous: boolean, walletStatus: WalletStatus): boolean {
  if (walletStatus === "connected") return true;
  if (walletStatus === "disconnected") return false;
  return previous; // connecting / reconnecting: no news
}

export interface SyncInput {
  sessionStatus: SessionStatus;
  /** The address the session was issued to; null without a session. */
  sessionAddress: string | null;
  wallet: { status: WalletStatus; address: string | undefined };
  /** The wallet was `connected` earlier in this page session. */
  wasConnected: boolean;
  /** The user is on an /app/* route. */
  inApp: boolean;
  /** An intentional sign-out or disconnect is already navigating away. */
  leaving: boolean;
}

export interface SyncDecision {
  /** Clear the session server-side and drop every cached user's data. */
  endSession: boolean;
  /** `home` → "/" ; `sign-in` → "/?signin=1&next=<here>" ; null → stay. */
  navigate: "home" | "sign-in" | null;
}

const NOTHING: SyncDecision = { endSession: false, navigate: null };

export function decideSessionSync(input: SyncInput): SyncDecision {
  const { sessionStatus, sessionAddress, wallet, wasConnected, inApp, leaving } = input;
  if (sessionStatus === "loading" || sessionStatus === "unavailable") return NOTHING;

  // Disconnecting the wallet ends the session and returns home (§3.3). Only a
  // wallet that WAS connected counts: on a fresh page load it is "reconnecting"
  // or simply absent, and that alone must not sign anyone out.
  if (wallet.status === "disconnected" && wasConnected) {
    return { endSession: sessionAddress !== null, navigate: inApp ? "home" : null };
  }

  if (leaving) return NOTHING;

  // The wallet is on a different account than the session was issued to.
  if (
    sessionAddress !== null &&
    wallet.status === "connected" &&
    wallet.address !== undefined &&
    wallet.address.toLowerCase() !== sessionAddress.toLowerCase()
  ) {
    return { endSession: true, navigate: inApp ? "sign-in" : null };
  }

  // No session on an authenticated route: the middleware only checks that a
  // cookie exists, so a stale one — or a session ended by RainbowKit's own
  // signOut — lands here.
  if (sessionStatus === "unauthenticated" && inApp) {
    return { endSession: false, navigate: "sign-in" };
  }

  return NOTHING;
}
