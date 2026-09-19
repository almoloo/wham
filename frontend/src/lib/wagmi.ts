import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { APP_CHAIN } from "./chain";

/*
 * Wallet configuration (frontend spec §2.4, §3.3). Exactly one chain is
 * supported per build — see ./chain — which is what makes RainbowKit and wagmi
 * report a wallet on any other chain as unsupported.
 */

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Fail loudly: without a project ID RainbowKit quietly shows a half-empty
// wallet list, which reads as a broken app rather than a missing variable.
if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Copy the frontend block " +
      "from .env.example into frontend/.env.local and fill it in " +
      "(free project ID at https://cloud.reown.com).",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Wham",
  projectId,
  chains: [APP_CHAIN],
  // Public marketing routes are statically rendered (§2.2). `ssr: true` lets
  // wagmi hydrate without reading cookies in the layout, which would force
  // every page dynamic.
  ssr: true,
});
