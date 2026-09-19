import { AUTH_COPY } from "@/lib/copy/auth";
import { bffVerifyResponseSchema, nonceResponseSchema, userProfileSchema } from "@/lib/schema/auth";
import { apiErrorSchema, parseApi } from "@/lib/schema/common";
import type { NonceResponse, UserProfile, VerifyRequest } from "@/types/auth";
import type { ApiErrorCode } from "@/types/common";

/*
 * Browser-side calls to our own BFF (/api/bff/*). The browser never talks to
 * the .NET auth endpoints and never sees the token (frontend spec §2.3).
 * Every response is parsed at the boundary. `fetchImpl` is injectable for tests.
 */

type Fetch = typeof fetch;
const defaultFetch: Fetch = (input, init) => fetch(input, init);

/** A BFF call that failed. `message` is safe to show the user, verbatim (§10.5). */
export class AuthRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: ApiErrorCode | null,
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

async function failure(res: Response): Promise<AuthRequestError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
  return parsed.success
    ? new AuthRequestError(res.status, parsed.data.error.message, parsed.data.error.code)
    : new AuthRequestError(res.status, AUTH_COPY.backendUnavailable, null);
}

/** The current user, or `null` when there is no session. Anything else throws. */
export async function fetchSession(fetchImpl: Fetch = defaultFetch): Promise<UserProfile | null> {
  const res = await fetchImpl("/api/bff/session", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw await failure(res);
  return parseApi(userProfileSchema, await res.json(), "GET /api/bff/session");
}

export async function fetchNonce(fetchImpl: Fetch = defaultFetch): Promise<NonceResponse> {
  const res = await fetchImpl("/api/bff/nonce", { cache: "no-store" });
  if (!res.ok) throw await failure(res);
  return parseApi(nonceResponseSchema, await res.json(), "GET /api/bff/nonce");
}

/** Submit a signed message. On success the BFF has set the session cookie; returns the user. */
export async function postVerify(body: VerifyRequest, fetchImpl: Fetch = defaultFetch): Promise<UserProfile> {
  const res = await fetchImpl("/api/bff/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await failure(res);
  return parseApi(bffVerifyResponseSchema, await res.json(), "POST /api/bff/verify").user;
}

export async function postLogout(fetchImpl: Fetch = defaultFetch): Promise<void> {
  const res = await fetchImpl("/api/bff/logout", { method: "POST" });
  if (!res.ok) throw await failure(res);
}
