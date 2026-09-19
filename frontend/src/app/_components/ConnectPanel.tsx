"use client";

/**
 * TEMPORARY connect / sign-in control for the homepage (Frontend 4). It exists
 * so the whole SIWE flow can be exercised before the real landing page and nav
 * (frontend spec §9.1) are built, and is replaced wholesale by them — like the
 * design-token gallery around it, it is not a permanent part of the page.
 *
 * Renders the §3.4 auth states: not connected, connected-not-signed-in (with the
 * "signing is free" line), signed in, and — after a rejected signature — the
 * inline "Sign-in cancelled" note. The wrong-chain state is the global
 * ChainBanner; here it just disables sign-in.
 */

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useSignInCancelled } from "@/components/auth/useSignInCancelled";
import { Button, Skeleton } from "@/components/ui";
import { useWalletChainStatus } from "@/hooks/useWalletChainStatus";
import { AUTH_COPY } from "@/lib/copy/auth";

export function ConnectPanel() {
  const { cancelled, acknowledge } = useSignInCancelled();
  const { supported } = useWalletChainStatus();

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, authenticationStatus, mounted }) => {
        // `mounted` is false during SSR/hydration; `loading` while the first
        // session check is in flight. Either way, don't flash the wrong CTA.
        if (!mounted || authenticationStatus === "loading") {
          return <Skeleton width={160} height={44} radius="var(--radius-md)" />;
        }

        if (authenticationStatus === "authenticated" && account) {
          return (
            <div className="flex flex-wrap items-center gap-3">
              <span className="wham-mono text-text-muted">{account.displayName}</span>
              <Link href="/app">{AUTH_COPY.dashboardLink}</Link>
              <SignOutButton />
            </div>
          );
        }

        // Connected with no session (e.g. after an account switch) vs. no wallet.
        const connectedWithoutSession = Boolean(account);
        return (
          <div className="flex flex-col items-start gap-2">
            <Button
              // On an unsupported chain sign-in can't start; the banner says why.
              disabled={connectedWithoutSession && !supported}
              onClick={() => {
                acknowledge();
                openConnectModal?.();
              }}
            >
              {connectedWithoutSession ? AUTH_COPY.signInToContinue : AUTH_COPY.connectWallet}
            </Button>
            {connectedWithoutSession ? <p className="text-text-muted">{AUTH_COPY.signingIsFree}</p> : null}
            {cancelled ? (
              <p role="status" className="text-text-muted">
                {AUTH_COPY.signInCancelled}
              </p>
            ) : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
