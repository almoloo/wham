import { getAuthBackend, BackendError } from "@/lib/auth";
import { clearSession, needsRefresh, readSession, writeSession } from "@/lib/auth/session-cookie";
import { envelope, fromBackendError, guard, json } from "@/lib/auth/bff-response";
import { AUTH_COPY } from "@/lib/copy/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/bff/session — the current user, or 401. Also where the §3.3 sliding
// renewal happens: within 24h of expiry, the token is re-issued and the cookie
// re-set, so an active user is never signed out mid-use.
export const GET = guard(async (request) => {
  const session = readSession(request);
  if (!session) return envelope(401, "UNAUTHENTICATED", AUTH_COPY.signInRequired);

  const backend = getAuthBackend();
  try {
    const response = json(await backend.session(session.token));

    if (needsRefresh(session.expiresAt)) {
      // Best effort: the current token is still valid, so a failed renewal must
      // not fail the request — the next call will try again.
      try {
        writeSession(response, await backend.refresh(session.token));
      } catch (error) {
        console.error("[bff] session refresh failed:", error);
      }
    }
    return response;
  } catch (error) {
    // A dead session is cleared so the browser stops presenting it; a transient
    // backend fault (INTERNAL) leaves the cookie alone.
    if (error instanceof BackendError && error.status === 401) {
      const response = fromBackendError(error);
      clearSession(response);
      return response;
    }
    throw error;
  }
});
