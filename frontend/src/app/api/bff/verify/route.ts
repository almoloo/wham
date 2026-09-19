import { parseSiweMessage } from "viem/siwe";
import { getAuthBackend } from "@/lib/auth";
import { envelope, guard, json } from "@/lib/auth/bff-response";
import { clearNonce, readNonce, writeSession } from "@/lib/auth/session-cookie";
import { AUTH_COPY } from "@/lib/copy/auth";
import { verifyRequestSchema } from "@/lib/schema/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bff/verify — frontend spec §3.1 steps 5–7. Forwards the signed
// message, and on success puts the token in the httpOnly `wham_session` cookie.
// The browser gets the profile back, never the token.
export const POST = guard(async (request) => {
  const body = verifyRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return envelope(400, "VALIDATION_FAILED", AUTH_COPY.invalidRequest);

  // The nonce in the signed message must be the one issued to this browser.
  const messageNonce = parseSiweMessage(body.data.message).nonce;
  if (!messageNonce || messageNonce !== readNonce(request)) {
    return envelope(401, "NONCE_INVALID", AUTH_COPY.nonceExpired);
  }

  const result = await getAuthBackend().verify(body.data, {
    // Only the in-process stand-in reads this; the real backend enforces its
    // own WHAM_PUBLIC_DOMAIN. Prefer the configured domain over the Host header,
    // which a caller controls.
    expectedDomain: process.env.WHAM_PUBLIC_DOMAIN || request.nextUrl.host,
  });

  const response = json({ user: result.user });
  writeSession(response, result);
  clearNonce(response); // single-use, retired on success
  return response;
});
