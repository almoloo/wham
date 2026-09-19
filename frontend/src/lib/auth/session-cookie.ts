import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import type { NonceResponse } from "@/types/auth";
import {
  NONCE_COOKIE,
  SESSION_COOKIE,
  SESSION_EXPIRY_COOKIE,
  SLIDING_REFRESH_WINDOW_MS,
} from "./constants";

/*
 * The httpOnly session cookies (frontend spec §3.3). Only the BFF route
 * handlers read or write these; the token never reaches browser JS.
 */

// Evaluated per call so the Secure flag follows NODE_ENV at runtime.
const attributes = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

// The session token travels on every page request (middleware reads it), so it
// lives on "/". Everything else is only ever needed by the BFF itself.
const SESSION_PATH = "/";
const BFF_PATH = "/api/bff";

const secondsUntil = (isoOrMs: string | number, now: number) =>
  Math.max(0, Math.floor((new Date(isoOrMs).getTime() - now) / 1000));

export interface StoredSession {
  token: string;
  /** Epoch ms, or null when the expiry cookie is missing or unreadable. */
  expiresAt: number | null;
}

export function readSession(request: NextRequest): StoredSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const parsed = Date.parse(request.cookies.get(SESSION_EXPIRY_COOKIE)?.value ?? "");
  return { token, expiresAt: Number.isNaN(parsed) ? null : parsed };
}

export function writeSession(
  response: NextResponse,
  { token, expiresAt }: { token: string; expiresAt: string },
  now = Date.now(),
): void {
  const maxAge = secondsUntil(expiresAt, now);
  response.cookies.set(SESSION_COOKIE, token, { ...attributes(), path: SESSION_PATH, maxAge });
  response.cookies.set(SESSION_EXPIRY_COOKIE, expiresAt, { ...attributes(), path: BFF_PATH, maxAge });
}

export function clearSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { ...attributes(), path: SESSION_PATH, maxAge: 0 });
  response.cookies.set(SESSION_EXPIRY_COOKIE, "", { ...attributes(), path: BFF_PATH, maxAge: 0 });
}

/**
 * Whether the §3.3 sliding renewal is due. A missing expiry means we can't
 * tell, so renew: a refresh is harmless and re-establishes the expiry cookie.
 */
export function needsRefresh(expiresAt: number | null, now = Date.now()): boolean {
  return expiresAt === null || expiresAt - now < SLIDING_REFRESH_WINDOW_MS;
}

export function readNonce(request: NextRequest): string | undefined {
  return request.cookies.get(NONCE_COOKIE)?.value;
}

export function writeNonce(response: NextResponse, { nonce, expiresAt }: NonceResponse, now = Date.now()): void {
  response.cookies.set(NONCE_COOKIE, nonce, {
    ...attributes(),
    path: BFF_PATH,
    maxAge: secondsUntil(expiresAt, now),
  });
}

export function clearNonce(response: NextResponse): void {
  response.cookies.set(NONCE_COOKIE, "", { ...attributes(), path: BFF_PATH, maxAge: 0 });
}
