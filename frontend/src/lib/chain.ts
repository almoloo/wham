import { arbitrum, arbitrumSepolia } from "viem/chains";

/*
 * The one chain this build supports (frontend spec §2.4), chosen by
 * NEXT_PUBLIC_CHAIN_ID (inlined at build time — a build arg, not runtime env).
 * A wallet on any other chain is "unsupported" and gets the §3.3 banner.
 *
 * Deliberately free of wallet dependencies so server code (the BFF and the
 * auth stand-in) can read the chain without importing RainbowKit.
 */

const SUPPORTED = {
  [arbitrumSepolia.id]: arbitrumSepolia,
  [arbitrum.id]: arbitrum,
} as const;

// Must be a literal `process.env.NEXT_PUBLIC_*` reference so Next can inline it.
const rawChainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? String(arbitrumSepolia.id);
const chainId = Number(rawChainId);

if (!(chainId in SUPPORTED)) {
  throw new Error(
    `NEXT_PUBLIC_CHAIN_ID="${rawChainId}" is not supported. Use ${arbitrumSepolia.id} (Arbitrum Sepolia) or ${arbitrum.id} (Arbitrum One).`,
  );
}

export const APP_CHAIN = SUPPORTED[chainId as keyof typeof SUPPORTED];

/** Whether a wallet's chain is the one this build supports (§3.3). */
export function isChainSupported(chainId: number | undefined): boolean {
  return chainId === APP_CHAIN.id;
}
