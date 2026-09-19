import { createSiweMessage } from "viem/siwe";
import { AUTH_COPY } from "@/lib/copy/auth";
import type { Address } from "@/types/common";

/**
 * The EIP-4361 message the wallet is asked to sign (frontend spec §3.2). The
 * fields and the verbatim `statement` are exactly what the backend validates —
 * see context/backend-roadmap.md, "The SIWE message you will receive".
 */
export function buildSiweMessage(params: {
  address: Address;
  chainId: number;
  nonce: string;
  /** `window.location.host` — the SIWE domain the backend enforces. */
  domain: string;
  /** `window.location.origin`. */
  origin: string;
  issuedAt: Date;
  /** When the message stops being valid; the caller aligns it with the nonce's expiry. */
  expirationTime: Date;
}): string {
  return createSiweMessage({
    domain: params.domain,
    address: params.address,
    statement: AUTH_COPY.siweStatement,
    uri: params.origin,
    version: "1",
    chainId: params.chainId,
    nonce: params.nonce,
    issuedAt: params.issuedAt,
    expirationTime: params.expirationTime,
  });
}
