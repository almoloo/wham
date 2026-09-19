"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { resolvePostSignInRoute } from "@/lib/auth/redirect";
import { decideSignInIntent } from "@/lib/auth/sign-in-intent";
import { useSession } from "./SessionProvider";

/**
 * Acts on `/?signin=1&next=…` (frontend spec §3.3): opens RainbowKit's connect
 * modal — which shows the wallet chooser, or the sign-in dialog if a wallet is
 * already connected. `next` needs no carrying here: it stays in the URL and is
 * read when sign-in succeeds (see SessionProvider).
 *
 * Reads `window.location` in an effect rather than `useSearchParams`, which
 * would force every statically-rendered page dynamic.
 */
export function SignInIntent() {
  const { status, user } = useSession();
  const account = useAccount();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const hasSignInParam = params.get("signin") === "1";
    if (!hasSignInParam) {
      handled.current = null;
      return;
    }

    const action = decideSignInIntent({
      hasSignInParam,
      sessionStatus: status,
      walletStatus: account.status,
      modalAvailable: openConnectModal !== undefined,
      alreadyHandled: handled.current === search,
    });

    if (action === "open-modal") {
      handled.current = search;
      openConnectModal?.();
    } else if (action === "redirect" && user) {
      handled.current = search;
      router.replace(resolvePostSignInRoute({ user, next: params.get("next") }));
    }
  }, [status, user, account.status, openConnectModal, pathname, router]);

  return null;
}
