import "server-only";
import type { z } from "zod";
import { AUTH_COPY } from "@/lib/copy/auth";
import {
  nonceResponseSchema,
  refreshResponseSchema,
  userProfileSchema,
  verifyResponseSchema,
} from "@/lib/schema/auth";
import { ApiContractError, apiErrorSchema, parseApi } from "@/lib/schema/common";
import type {
  NonceResponse,
  RefreshResponse,
  UserProfile,
  VerifyRequest,
  VerifyResponse,
} from "@/types/auth";
import type { ApiError, ApiErrorCode } from "@/types/common";

/*
 * The seam between the BFF route handlers and the .NET auth API (frontend spec
 * §7.1). Everything above this file talks to `AuthBackend`; whether it is the
 * real HTTP API or the in-process stand-in is decided once, in ./index.
 *
 * Server-only: the session token passes through here and must never reach
 * browser JS (§2.1).
 */

/** Context the BFF knows and the real backend already has from its own config. */
export interface VerifyContext {
  /** The host the browser saw (`window.location.host`) — the SIWE `domain` to enforce. */
  expectedDomain: string;
}

export interface AuthBackend {
  getNonce(): Promise<NonceResponse>;
  verify(request: VerifyRequest, context: VerifyContext): Promise<VerifyResponse>;
  session(token: string): Promise<UserProfile>;
  /** NEW — see context/backend-roadmap.md. Re-issues the token; the BFF decides when (< 24h left). */
  refresh(token: string): Promise<RefreshResponse>;
  logout(token: string): Promise<void>;
}

/**
 * Any failure from the backend, already in the §6.10 envelope so the BFF can
 * relay it to the browser as-is. Network faults and off-contract responses are
 * mapped to `INTERNAL` here, so callers only ever see this one type.
 */
export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.error.message);
    this.name = "BackendError";
  }
}

function internalError(status = 502): BackendError {
  const code: ApiErrorCode = "INTERNAL";
  return new BackendError(status, {
    error: { code, message: AUTH_COPY.backendUnavailable, traceId: `bff-${crypto.randomUUID()}` },
  });
}

function logFault(what: string, cause: unknown): void {
  // Server log only — the browser gets the calm INTERNAL message. Never logs
  // tokens or signatures; a contract violation names paths, not values.
  console.error(`[auth-backend] ${what}:`, cause instanceof Error ? cause.message : cause);
}

interface CallOptions {
  method: "GET" | "POST";
  token?: string;
  body?: unknown;
}

/** The real implementation: server-side fetch to `${WHAM_API_URL}/v1/auth/*`. */
export function createHttpAuthBackend(baseUrl: string, fetchImpl: typeof fetch = fetch): AuthBackend {
  const root = baseUrl.replace(/\/+$/, "");

  async function send(path: string, { method, token, body }: CallOptions): Promise<Response> {
    let res: Response;
    try {
      res = await fetchImpl(`${root}/v1/auth/${path}`, {
        method,
        headers: {
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          // §7: the cookie becomes a Bearer header, injected server-side.
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });
    } catch (cause) {
      logFault(`${method} ${path} unreachable`, cause);
      throw internalError();
    }
    if (res.ok) return res;

    // Prefer the backend's own §6.10 envelope; its `message` is product copy.
    const parsed = await res
      .json()
      .then((data: unknown) => apiErrorSchema.safeParse(data))
      .catch(() => null);
    if (parsed?.success) throw new BackendError(res.status, parsed.data);
    logFault(`${method} ${path} returned ${res.status} without a valid error envelope`, "");
    throw internalError();
  }

  async function read<T>(res: Response, schema: z.ZodType<T>, label: string): Promise<T> {
    try {
      return parseApi(schema, await res.json(), label);
    } catch (cause) {
      logFault(label, cause instanceof ApiContractError ? cause : "response was not valid JSON");
      throw internalError();
    }
  }

  return {
    async getNonce() {
      return read(await send("nonce", { method: "GET" }), nonceResponseSchema, "GET /v1/auth/nonce");
    },
    // The real backend enforces its own domain (WHAM_PUBLIC_DOMAIN), so the context is unused.
    async verify(request) {
      const res = await send("verify", { method: "POST", body: request });
      return read(res, verifyResponseSchema, "POST /v1/auth/verify");
    },
    async session(token) {
      return read(await send("session", { method: "GET", token }), userProfileSchema, "GET /v1/auth/session");
    },
    async refresh(token) {
      const res = await send("refresh", { method: "POST", token });
      return read(res, refreshResponseSchema, "POST /v1/auth/refresh");
    },
    async logout(token) {
      await send("logout", { method: "POST", token }); // 204, no body
    },
  };
}
