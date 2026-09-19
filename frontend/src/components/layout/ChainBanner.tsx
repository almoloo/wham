"use client";

import { useSwitchChain } from "wagmi";
import { Banner } from "@/components/ui";
import { useWalletChainStatus } from "@/hooks/useWalletChainStatus";
import { APP_CHAIN } from "@/lib/chain";
import { AUTH_COPY } from "@/lib/copy/auth";

/**
 * Frontend spec §3.3: a wallet on an unsupported chain gets a global,
 * non-dismissable banner with a switch button. Reads keep rendering from cache;
 * writes are disabled through `useWalletChainStatus`, and sign-in refuses to
 * start (RainbowKit won't, and the adapter throws as a backstop).
 */
export function ChainBanner() {
  const { connected, supported } = useWalletChainStatus();
  const { switchChain } = useSwitchChain();

  if (!connected || supported) return null;

  return (
    <div className="sticky top-0 z-40 p-3">
      {/* No onDismiss: the banner stays until the wallet is on the right chain. */}
      <Banner
        tone="warning"
        title={AUTH_COPY.unsupportedChain}
        action={AUTH_COPY.switchNetwork}
        onAction={() => switchChain({ chainId: APP_CHAIN.id })}
      />
    </div>
  );
}
