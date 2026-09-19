import type { SessionStatus, WalletStatus } from "./session-sync";

/*
 * What to do about `/?signin=1&next=…` — the URL the middleware and the
 * account-switch handler send people to (frontend spec §3.3). Pure, so the
 * ordering of the waits is testable; SignInIntent carries it out.
 */

export type SignInIntentAction = "open-modal" | "redirect" | "wait" | "none";

export function decideSignInIntent(input: {
  hasSignInParam: boolean;
  sessionStatus: SessionStatus;
  walletStatus: WalletStatus;
  /** RainbowKit's `openConnectModal` exists (it is undefined while loading or fully signed in). */
  modalAvailable: boolean;
  /** This URL has already been acted on; never reopen a modal the user closed. */
  alreadyHandled: boolean;
}): SignInIntentAction {
  const { hasSignInParam, sessionStatus, walletStatus, modalAvailable, alreadyHandled } = input;
  if (!hasSignInParam || alreadyHandled) return "none";
  // Loading, or the check failed: don't ask a possibly signed-in user to sign in.
  if (sessionStatus === "loading" || sessionStatus === "unavailable") return "wait";
  // Already signed in (an old link): just go where they were headed.
  if (sessionStatus === "authenticated") return "redirect";
  // A remembered wallet is about to reconnect; opening the wallet chooser now
  // would flash it in front of a wallet that then connects by itself.
  if (walletStatus === "connecting" || walletStatus === "reconnecting") return "wait";
  return modalAvailable ? "open-modal" : "wait";
}
