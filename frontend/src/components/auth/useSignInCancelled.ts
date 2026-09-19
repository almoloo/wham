"use client";

import { useMutationState } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { isUserRejection, SIGN_MESSAGE_MUTATION_KEY } from "@/lib/auth/wallet-errors";

/**
 * Whether the most recent wallet signature request was rejected by the user
 * (frontend spec §3.4: "Sign-in cancelled. Nothing was sent.").
 *
 * RainbowKit's own sign-in dialog swallows a rejection without saying anything,
 * so this watches from outside. wagmi runs signing through TanStack Query with
 * the mutation key SIGN_MESSAGE_MUTATION_KEY (guarded by a test against wagmi
 * itself), which `useMutationState` can observe from any component.
 *
 * It clears itself when a newer signing attempt starts or succeeds, and
 * `acknowledge()` clears it when the user acts again.
 */
export function useSignInCancelled(): { cancelled: boolean; acknowledge: () => void } {
  const attempts = useMutationState({
    filters: { mutationKey: [...SIGN_MESSAGE_MUTATION_KEY] },
    select: (mutation) => ({
      status: mutation.state.status,
      error: mutation.state.error,
      submittedAt: mutation.state.submittedAt,
    }),
  });
  const [acknowledgedAt, setAcknowledgedAt] = useState(0);

  const latest = attempts.at(-1);
  const cancelled =
    latest !== undefined &&
    latest.status === "error" &&
    isUserRejection(latest.error) &&
    latest.submittedAt > acknowledgedAt;

  const acknowledge = useCallback(() => {
    if (latest) setAcknowledgedAt(latest.submittedAt);
  }, [latest]);

  return { cancelled, acknowledge };
}
