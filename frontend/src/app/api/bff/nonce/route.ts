import { getAuthBackend } from "@/lib/auth";
import { guard, json } from "@/lib/auth/bff-response";
import { writeNonce } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/bff/nonce — frontend spec §3.1 steps 2–3. Returns the §7.1 nonce
// JSON and remembers it in an httpOnly cookie, so /verify can insist the signed
// message carries the nonce *this browser* was issued.
export const GET = guard(async () => {
  const nonce = await getAuthBackend().getNonce();
  const response = json(nonce);
  writeNonce(response, nonce);
  return response;
});
