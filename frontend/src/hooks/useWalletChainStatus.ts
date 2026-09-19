import { useAccount } from "wagmi";
import { isChainSupported } from "@/lib/chain";

/**
 * Whether the connected wallet is on the chain this build supports (§3.3).
 * `supported` is true while no wallet is connected or one is still connecting,
 * so nothing flashes a warning before the real chain is known. Writes go through
 * this too, when they exist: reads keep rendering, writes are disabled.
 */
export function useWalletChainStatus(): { connected: boolean; supported: boolean } {
  const { status, chainId } = useAccount();
  const connected = status === "connected";
  return { connected, supported: !connected || isChainSupported(chainId) };
}
