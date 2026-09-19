import type { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { getAddress } from "viem";
import { isChainSupported } from "@/lib/chain";
import { hexSchema } from "@/lib/schema/common";
import type { NonceResponse, UserProfile, VerifyRequest } from "@/types/auth";
import { buildSiweMessage } from "./siwe";

/*
 * RainbowKit's authentication adapter (frontend spec §3.1 steps 1–7). Built from
 * injected dependencies so it can be exercised against the auth stand-in in
 * plain Node; SessionProvider supplies the real browser ones.
 *
 * Type-only import of RainbowKit: `createAuthenticationAdapter` is an identity
 * function, so this file needs no runtime dependency on it.
 */

type RainbowKitAdapter = Parameters<typeof createAuthenticationAdapter<string>>[0];

const MESSAGE_LIFETIME_MS = 10 * 60_000;

export interface AdapterDeps {
  getNonce: () => Promise<NonceResponse>;
  /** Submits the signed message; resolves to the signed-in user, rejects on any failure. */
  verify: (body: VerifyRequest) => Promise<UserProfile>;
  /** Sign-in succeeded: cache the user, then navigate. */
  onSignedIn: (user: UserProfile) => void;
  /** Sign the user out server-side and drop cached data. Must be safe to call when signed out. */
  endSession: () => Promise<void>;
  location: () => { host: string; origin: string };
  now?: () => Date;
}

export class UnsupportedChainError extends Error {
  constructor(readonly chainId: number) {
    super(`Refusing to build a sign-in message for unsupported chain ${chainId}`);
    this.name = "UnsupportedChainError";
  }
}

export function createWhamAuthAdapter(deps: AdapterDeps): RainbowKitAdapter {
  const now = deps.now ?? (() => new Date());
  // RainbowKit's getNonce() returns only the nonce string, so remember when each
  // one expires: the message must not outlive the nonce it carries.
  const nonceExpiry = new Map<string, number>();

  return {
    async getNonce() {
      const issued = await deps.getNonce();
      const t = now().getTime();
      for (const [nonce, expiresAt] of nonceExpiry) if (expiresAt <= t) nonceExpiry.delete(nonce);
      nonceExpiry.set(issued.nonce, Date.parse(issued.expiresAt));
      return issued.nonce;
    },

    createMessage({ nonce, address, chainId }) {
      // §3.3: never ask a wallet to sign in on a chain we don't support. RainbowKit
      // already declines to start sign-in there; this is the backstop.
      if (!isChainSupported(chainId)) throw new UnsupportedChainError(chainId);
      const issuedAt = now();
      const known = nonceExpiry.get(nonce);
      const expirationTime =
        known !== undefined && known > issuedAt.getTime()
          ? new Date(known)
          : new Date(issuedAt.getTime() + MESSAGE_LIFETIME_MS);
      const { host, origin } = deps.location();
      // The wallet may hand back any casing; getAddress validates it and returns
      // the EIP-55 checksummed form the backend expects.
      return buildSiweMessage({
        address: getAddress(address),
        chainId,
        nonce,
        domain: host,
        origin,
        issuedAt,
        expirationTime,
      });
    },

    async verify({ message, signature }) {
      try {
        // RainbowKit types the signature as a plain string; refuse anything that isn't hex.
        deps.onSignedIn(await deps.verify({ message, signature: hexSchema.parse(signature) }));
        return true;
      } catch (error) {
        // RainbowKit can only be told yes/no; the reason goes to the console.
        console.error("[auth] sign-in failed:", error instanceof Error ? error.message : error);
        return false;
      }
    },

    // RainbowKit calls this on any wallet disconnect and on an account change
    // while signed in, but it does NOT change the auth status itself — ending
    // the session is what flips it.
    async signOut() {
      await deps.endSession();
    },
  };
}
