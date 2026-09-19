/*
 * Every user-facing auth string lives in this one file so the `fa` pass is a
 * single-file change (context/current-feature.md, Frontend 4 "Out of scope").
 * Strings from frontend spec §3.2–§3.4 are verbatim — do not paraphrase.
 * Backend-authored error copy arrives in `ApiError.message`, not here.
 *
 * The spec gives no exact sentence for `signingIsFree` ("one-line explainer that
 * signing is free", §3.4) or the `switchNetwork` button label; those two are
 * authored, worded to match the SIWE statement, and need sign-off.
 */
export const AUTH_COPY = {
  /**
   * The SIWE `statement` (§3.2). Load-bearing: the target user is nervous about
   * signing things, so it says plainly that nothing is authorised. Do not shorten.
   */
  siweStatement:
    "Sign in to Wham. This signature proves you control this wallet. It does not authorise any transaction or move any funds.",
  /** Primary CTA while no wallet is connected (§3.4). */
  connectWallet: "Connect wallet",
  /** Primary CTA once a wallet is connected but there is no session (§3.4). */
  signInToContinue: "Sign in to continue",
  /** One-line explainer under "Sign in to continue" (§3.4). AUTHORED — the spec gives no exact text. */
  signingIsFree: "Signing is free and doesn't move any funds.",
  /** A rejected signature: inline, non-alarming (§3.4). */
  signInCancelled: "Sign-in cancelled. Nothing was sent.",
  /** The non-dismissable banner on an unsupported chain (§3.3). */
  unsupportedChain: "Wham runs on Arbitrum. Switch network to continue.",
  /** The banner's switchChain button. AUTHORED — the spec names the button but not its label. */
  switchNetwork: "Switch network",
  /** Temporary homepage panel: link to the signed-in dashboard. */
  dashboardLink: "Go to dashboard",
  /** Shown when the .NET API is unreachable or answers off-contract. */
  backendUnavailable: "Something went wrong on our side. Please try again in a moment.",
  /** No session cookie on a call that needs one. */
  signInRequired: "Please sign in to continue.",
  /** The nonce in the signed message is not the one this browser was issued. */
  nonceExpired: "That sign-in request expired. Please try again.",
  /** Sign-out control. */
  signOut: "Sign out",
  /** A BFF request body that is not the shape the endpoint takes. */
  invalidRequest: "That request wasn't valid. Please try again.",
} as const;
