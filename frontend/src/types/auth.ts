import type { Address, Hex, IsoDateTime } from "./common";

/*
 * Auth shapes. UserProfile is frontend spec §6.9; the /v1/auth/* shapes are
 * §7.1 verbatim, plus refresh (marked NEW), which §3.3 requires but §7.1 has
 * no mechanism for — see context/current-feature.md "Spec gaps".
 *
 * The full contract for the backend teammate lives in
 * context/backend-roadmap.md.
 */

/** Load-bearing: every later /me/* feature reads this. Nulls are emitted, never omitted. */
export interface UserProfile {
  address: Address;
  displayName: string | null;
  ensName: string | null;
  avatarSeed: string;
  email: string | null;
  emailVerified: boolean;
  telegramHandle: string | null;
  /** IANA, e.g. "Asia/Tehran". */
  timezone: string;
  locale: "en" | "fa";
  firstLogin: boolean;
  createdAt: IsoDateTime;
  preferences: {
    /** Hours before a payment is due, e.g. [72, 24, 4]. */
    notifyPaymentDueHours: number[];
    notifyBidWindow: boolean;
    notifyRoundSettled: boolean;
    channelEmail: boolean;
    channelTelegram: boolean;
    channelInApp: boolean;
  };
}

/** GET /v1/auth/nonce — public, single-use, 10-minute expiry. */
export interface NonceResponse {
  nonce: string;
  issuedAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

/** POST /v1/auth/verify — body. `message` is the raw EIP-4361 string. */
export interface VerifyRequest {
  message: string;
  signature: Hex;
}

/** POST /v1/auth/verify — response. The token never reaches browser JS; the BFF puts it in a cookie. */
export interface VerifyResponse {
  token: string;
  expiresAt: IsoDateTime;
  user: UserProfile;
}

/** NEW — POST /v1/auth/refresh. Re-issues the session token when < 24h remain (§3.3). */
export interface RefreshResponse {
  token: string;
  expiresAt: IsoDateTime;
}

/** POST /api/bff/verify — what the BROWSER gets back. The token stays in the httpOnly cookie. */
export interface BffVerifyResponse {
  user: UserProfile;
}
