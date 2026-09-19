import { getAuthBackend } from "@/lib/auth";
import { empty, guard } from "@/lib/auth/bff-response";
import { clearNonce, clearSession, readSession } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bff/logout — clears the session. Signing out must always work for
// the user, so a backend failure is logged but never blocks clearing cookies.
export const POST = guard(async (request) => {
  const session = readSession(request);
  if (session) {
    await getAuthBackend()
      .logout(session.token)
      .catch((error: unknown) => console.error("[bff] backend logout failed:", error));
  }

  const response = empty(204);
  clearSession(response);
  clearNonce(response);
  return response;
});
