/**
 * The TanStack mutation key wagmi files every wallet signature request under.
 * `useSignInCancelled` watches it to notice a rejected signature, because
 * RainbowKit's own dialog swallows the rejection. It is a wagmi internal, so
 * wallet-errors.test.ts asserts it against wagmi itself: an upgrade that renames
 * it fails a test instead of silently dropping the "Sign-in cancelled" message.
 */
export const SIGN_MESSAGE_MUTATION_KEY = ["signMessage"] as const;

/**
 * Whether an error is the wallet's "the user rejected the request" (EIP-1193
 * code 4001), however it has been wrapped. viem's `UserRejectedRequestError`
 * carries it as `name`/`code`, and several layers wrap the original in `cause`.
 */
export function isUserRejection(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6; depth++) {
    if (typeof current !== "object" || current === null) return false;
    const { name, code, cause } = current as { name?: unknown; code?: unknown; cause?: unknown };
    if (name === "UserRejectedRequestError" || code === 4001) return true;
    current = cause;
  }
  return false; // bounded: a cyclic `cause` chain must not hang the UI
}
