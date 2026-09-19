import "server-only";
import { getAddress, isAddressEqual, recoverMessageAddress, type Address } from "viem";
import { generateSiweNonce, parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { APP_CHAIN } from "@/lib/chain";
import type { NonceResponse, RefreshResponse, UserProfile, VerifyResponse } from "@/types/auth";
import type { ApiErrorCode } from "@/types/common";
import { BackendError, type AuthBackend } from "./backend";

/*
 * TEMPORARY stand-in for the .NET `/v1/auth/*` endpoints (frontend 4, step 3).
 * Switched on by NEXT_PUBLIC_USE_MOCKS. The real contract is specified in
 * context/backend-roadmap.md; when that backend exists this file is deleted.
 *
 * It is a stand-in, NOT a bypass: it really does check the nonce (issued,
 * unexpired, single-use), the domain, the chain, the expiry, and that the
 * signature recovers to the address in the message. If a signature fails here,
 * the mismatch is the bug — never loosen this to make a sign-in pass.
 *
 * Known gaps vs the real backend (TODO(backend)):
 *  - EOA signatures only; the real one adds the EIP-1271 fallback for
 *    smart-contract wallets.
 *  - State is in memory: a server restart signs everyone out and forgets who
 *    has logged in before (so `firstLogin` is true again).
 *  - The profile is derived from the address; there is no ENS lookup and no
 *    PATCH /v1/me, so `firstLogin` flips false on the second sign-in instead
 *    of when onboarding completes.
 *  - Error `message` strings are placeholders for the backend's product copy.
 */

// TODO(backend): real TTLs per context/backend-roadmap.md §1 (nonce 10 min, JWT 7 days).
const NONCE_TTL_MS = 10 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;

export interface MockAuthOptions {
  /** Injectable clock so expiry is testable without waiting. */
  now?: () => Date;
  chainId?: number;
}

interface Session {
  address: Address;
  expiresAt: number;
}

// TODO(backend): every `message` passed to fail() is placeholder copy; the real
// backend ships its own product copy (context/backend-roadmap.md, "Errors and their copy").
function fail(code: ApiErrorCode, message: string): never {
  throw new BackendError(401, { error: { code, message, traceId: `mock-${crypto.randomUUID()}` } });
}

export function createMockAuthBackend({
  now = () => new Date(),
  chainId = APP_CHAIN.id,
}: MockAuthOptions = {}): AuthBackend {
  const nonces = new Map<string, number>(); // nonce -> expiresAt (ms)
  const sessions = new Map<string, Session>(); // token -> session
  const profiles = new Map<string, UserProfile>(); // lowercased address -> profile

  const iso = (ms: number) => new Date(ms).toISOString();

  function issueSession(address: Address, at: number) {
    const token = `mock.${crypto.randomUUID()}`;
    const expiresAt = at + SESSION_TTL_MS;
    sessions.set(token, { address, expiresAt });
    return { token, expiresAt: iso(expiresAt) };
  }

  /** Resolve a live session, or throw the same errors the real API would. */
  function requireSession(token: string): Session {
    const found = sessions.get(token);
    if (!found) fail("UNAUTHENTICATED", "Please sign in to continue.");
    if (found.expiresAt <= now().getTime()) {
      sessions.delete(token);
      fail("SESSION_EXPIRED", "Your session has expired. Please sign in again.");
    }
    return found;
  }

  return {
    async getNonce(): Promise<NonceResponse> {
      const issuedAt = now().getTime();
      for (const [nonce, expiresAt] of nonces) if (expiresAt <= issuedAt) nonces.delete(nonce);

      const nonce = generateSiweNonce();
      nonces.set(nonce, issuedAt + NONCE_TTL_MS);
      return { nonce, issuedAt: iso(issuedAt), expiresAt: iso(issuedAt + NONCE_TTL_MS) };
    },

    async verify({ message, signature }, { expectedDomain }): Promise<VerifyResponse> {
      const at = now();
      const parsed = parseSiweMessage(message);
      const claimed = parsed.address;
      if (!claimed || !parsed.nonce) {
        fail("SIGNATURE_INVALID", "We couldn't verify that signature. Nothing was sent. Please try again.");
      }

      const nonceExpiry = nonces.get(parsed.nonce);
      if (nonceExpiry === undefined || nonceExpiry <= at.getTime()) {
        fail("NONCE_INVALID", "That sign-in request expired. Please try again.");
      }

      // Domain, expiry and not-before come from viem's EIP-4361 validator. A
      // message with no expiry is refused: ours always carries one.
      const acceptable =
        parsed.expirationTime !== undefined &&
        parsed.chainId === chainId &&
        validateSiweMessage({ domain: expectedDomain, message: parsed, time: at });
      if (!acceptable) {
        fail("SIGNATURE_INVALID", "We couldn't verify that signature. Nothing was sent. Please try again.");
      }

      // TODO(backend): EOA-only ecrecover; the real backend adds the EIP-1271 fallback.
      let signer: Address;
      try {
        signer = await recoverMessageAddress({ message, signature });
      } catch {
        fail("SIGNATURE_INVALID", "We couldn't verify that signature. Nothing was sent. Please try again.");
      }
      if (!isAddressEqual(signer, claimed)) {
        fail(
          "ADDRESS_MISMATCH",
          "That signature came from a different wallet than the one you connected. Please try again.",
        );
      }

      nonces.delete(parsed.nonce); // single use — consumed only on success

      const address = getAddress(claimed);
      const key = address.toLowerCase();
      const known = profiles.get(key);
      // TODO(backend): real `firstLogin` stays true until onboarding completes.
      // `firstLogin` stays true until this address signs in a second time —
      // the real backend keeps it true until onboarding completes (PATCH /v1/me).
      const profile: UserProfile = known ? { ...known, firstLogin: false } : newProfile(address, at);
      profiles.set(key, profile);

      return { ...issueSession(address, at.getTime()), user: structuredClone(profile) };
    },

    async session(token): Promise<UserProfile> {
      const { address } = requireSession(token);
      return structuredClone(profiles.get(address.toLowerCase())!);
    },

    async refresh(token): Promise<RefreshResponse> {
      // TODO(backend): real POST /v1/auth/refresh is a NEW endpoint (backend-roadmap §1).
      // The old token is NOT revoked: a stateless JWT can't be, and two tabs
      // refreshing near expiry would otherwise race each other.
      const { address } = requireSession(token);
      return issueSession(address, now().getTime());
    },

    async logout(token): Promise<void> {
      sessions.delete(token); // idempotent, like the real 204
    },
  };
}

// TODO(backend): temp profile values. The real defaults (timezone "UTC", ENS lookup,
// preferences) are in context/backend-roadmap.md §1, "New-user defaults".
function newProfile(address: Address, at: Date): UserProfile {
  return {
    address,
    displayName: null,
    ensName: null,
    avatarSeed: address.slice(2, 10),
    email: null,
    emailVerified: false,
    telegramHandle: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    locale: "en",
    firstLogin: true,
    createdAt: at.toISOString(),
    preferences: {
      notifyPaymentDueHours: [72, 24, 4],
      notifyBidWindow: true,
      notifyRoundSettled: true,
      channelEmail: false,
      channelTelegram: false,
      channelInApp: true,
    },
  };
}
