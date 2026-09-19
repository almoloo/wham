/*
 * Frontend spec §6.1 primitives and §6.10 envelope. Hand-written — no codegen —
 * and mirrored by Zod schemas in src/lib/schema/common.ts, which are checked
 * against these types at compile time.
 */

export type Address = `0x${string}`;
export type Hex = `0x${string}`;

/** ISO 8601, UTC, e.g. "2026-09-20T14:00:00Z". */
export type IsoDateTime = string;

/**
 * The closed error-code union from §6.10. Owner: backend. Adding a code is a
 * two-document change (backend union + frontend spec §6.10) — never add one
 * here on its own.
 */
export const API_ERROR_CODES = [
  "UNAUTHENTICATED",
  "SESSION_EXPIRED",
  "ADDRESS_MISMATCH",
  "NONCE_INVALID",
  "SIGNATURE_INVALID",
  "CIRCLE_NOT_FOUND",
  "CIRCLE_FULL",
  "CIRCLE_ALREADY_STARTED",
  "NOT_A_MEMBER",
  "ALREADY_A_MEMBER",
  "REPUTATION_TOO_LOW",
  "OPEN_DELINQUENCY",
  "QUOTE_EXPIRED",
  "QUOTE_NOT_FOUND",
  "AGENT_UNAVAILABLE",
  "BID_WINDOW_CLOSED",
  "BID_ABOVE_MAX",
  "BID_NOT_IMPROVING",
  "ALREADY_PAID_OUT",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Every 4xx/5xx from the .NET API. `message` is user-facing copy: render it verbatim. */
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    traceId: string;
  };
}
