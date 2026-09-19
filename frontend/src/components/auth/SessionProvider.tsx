"use client";

import { RainbowKitAuthenticationProvider } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useAccount, useDisconnect } from "wagmi";
import { createWhamAuthAdapter } from "@/lib/auth/adapter";
import { fetchNonce, fetchSession, postLogout, postVerify } from "@/lib/auth/client";
import { postSignInNavigation, signInUrl } from "@/lib/auth/redirect";
import {
  decideSessionSync,
  deriveSessionStatus,
  nextWasConnected,
  type SessionStatus,
} from "@/lib/auth/session-sync";
import { createSingleFlight } from "@/lib/singleFlight";
import type { UserProfile } from "@/types/auth";

/*
 * The client-side session: what `/api/bff/session` says, mirrored into
 * RainbowKit, kept honest against the connected wallet, and the one place that
 * navigates after sign-in / sign-out (frontend spec §3.1, §3.3).
 */

export const SESSION_QUERY_KEY = ["session"] as const;

interface SessionContextValue {
  status: SessionStatus;
  user: UserProfile | null;
  /** End the session, disconnect the wallet and return to the homepage. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const account = useAccount();
  const { disconnect } = useDisconnect();

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => fetchSession(),
    // One quick retry absorbs a blip; after that a failed first check is
    // `unavailable` (never "signed out") and is re-tried until it recovers.
    retry: 1,
    staleTime: 60_000,
    refetchInterval: (q) => (q.state.status === "error" && q.state.data === undefined ? 10_000 : false),
  });
  const user = query.data ?? null;
  const status = deriveSessionStatus({ isPending: query.isPending, isError: query.isError, hasUser: user !== null });

  // One end-of-session at a time: RainbowKit's signOut, our own sync effect and
  // an explicit sign-out button can all fire together for a single disconnect.
  const endSession = useMemo(
    () =>
      createSingleFlight(async () => {
        try {
          // Stop an in-flight session fetch from resurrecting the old user.
          await queryClient.cancelQueries();
          // The BFF clears the cookies even if the backend is down; a network
          // failure here just means the next session check tells the truth.
          await postLogout().catch(() => undefined);
        } finally {
          // Equivalent to queryClient.clear() but keeps the session query in the
          // cache, so its mounted observers don't end up attached to a removed query.
          queryClient.setQueryData(SESSION_QUERY_KEY, null);
          queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0] });
        }
      }),
    [queryClient],
  );

  const leaving = useRef(false);
  const wasConnected = useRef(false);
  const inApp = pathname === "/app" || pathname.startsWith("/app/");

  const signOut = useCallback(async () => {
    leaving.current = true;
    await endSession();
    disconnect();
    router.push("/");
  }, [endSession, disconnect, router]);

  const adapter = useMemo(
    () =>
      createWhamAuthAdapter({
        getNonce: () => fetchNonce(),
        verify: (body) => postVerify(body),
        endSession,
        location: () => window.location,
        onSignedIn: (signedIn) => {
          leaving.current = false;
          queryClient.setQueryData(SESSION_QUERY_KEY, signedIn);
          const { to, method } = postSignInNavigation({ user: signedIn, search: window.location.search });
          router[method](to);
        },
      }),
    [endSession, queryClient, router],
  );

  useEffect(() => {
    if (!inApp) leaving.current = false;
  }, [inApp]);

  // The §3.3 account-switch / disconnect handler. Runs on every change to the
  // session, the wallet, or the route; the decision itself is a pure function.
  useEffect(() => {
    const decision = decideSessionSync({
      sessionStatus: status,
      sessionAddress: user?.address ?? null,
      wallet: { status: account.status, address: account.address },
      wasConnected: wasConnected.current,
      inApp,
      leaving: leaving.current,
    });

    wasConnected.current = nextWasConnected(wasConnected.current, account.status);

    if (decision.endSession) void endSession();
    if (decision.navigate === "home") {
      leaving.current = true;
      router.push("/");
    } else if (decision.navigate === "sign-in") {
      router.replace(signInUrl(pathname + window.location.search));
    }
  }, [status, user?.address, account.status, account.address, inApp, pathname, endSession, router]);

  const value = useMemo(() => ({ status, user, signOut }), [status, user, signOut]);

  return (
    // RainbowKit only knows three states; while the session check is unavailable
    // it should behave as signed out, so connecting still works.
    <RainbowKitAuthenticationProvider adapter={adapter} status={status === "unavailable" ? "unauthenticated" : status}>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </RainbowKitAuthenticationProvider>
  );
}
