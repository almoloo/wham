"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { SignInIntent } from "@/components/auth/SignInIntent";
import { ChainBanner } from "@/components/layout/ChainBanner";
import { wagmiConfig } from "@/lib/wagmi";

/*
 * RainbowKit is skinned to the Wham palette (spec §2.1: "not left default").
 * Colours are CSS custom properties, not re-typed hex, so they follow the
 * [data-theme="dark"] token overrides. The modal's own surfaces stay on
 * RainbowKit's light palette until a theme switcher exists.
 */
const base = lightTheme({
  accentColor: "var(--brand-primary)",
  accentColorForeground: "var(--text-inverse)",
  borderRadius: "large",
  fontStack: "system",
});

const whamTheme = {
  ...base,
  fonts: { ...base.fonts, body: "var(--font-core)" },
};

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session; created in state so it survives re-renders
  // but is never shared between requests on the server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RainbowKitProvider theme={whamTheme}>
            <ChainBanner />
            <SignInIntent />
            {children}
          </RainbowKitProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
