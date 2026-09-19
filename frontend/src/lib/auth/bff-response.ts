import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COPY } from "@/lib/copy/auth";
import type { ApiErrorCode } from "@/types/common";
import { BackendError } from "./backend";

/*
 * Response helpers for the /api/bff/* route handlers. Every response is
 * `no-store` (auth state must never be cached) and every error is the §6.10
 * envelope, so the browser has exactly one error shape to handle.
 */

const NO_STORE = { "cache-control": "no-store" } as const;

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function empty(status = 204): NextResponse {
  return new NextResponse(null, { status, headers: NO_STORE });
}

export function envelope(status: number, code: ApiErrorCode, message: string): NextResponse {
  return json({ error: { code, message, traceId: `bff-${crypto.randomUUID()}` } }, status);
}

/** Relay a backend failure to the browser exactly as the backend (or ./backend) shaped it. */
export function fromBackendError(error: BackendError): NextResponse {
  return json(error.body, error.status);
}

/**
 * Wrap a route handler so nothing escapes as a bare 500: a `BackendError` is
 * relayed, anything else is logged server-side and shown as the calm INTERNAL
 * message — never a stack, never a status code alone (§10.5).
 */
export function guard(
  handler: (request: NextRequest) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof BackendError) return fromBackendError(error);
      console.error("[bff] unhandled error:", error);
      return envelope(500, "INTERNAL", AUTH_COPY.backendUnavailable);
    }
  };
}
