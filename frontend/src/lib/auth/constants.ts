/*
 * Cookie names and timings shared by the BFF and (step 6) the edge middleware.
 * Deliberately dependency-free — no `server-only`, no Node APIs — because the
 * middleware bundle may import it.
 */

/** The 7-day session token (frontend spec §3.3). httpOnly: never readable from browser JS. */
export const SESSION_COOKIE = "wham_session";

/**
 * When the session token expires (ISO 8601). The token itself is opaque to the
 * BFF, so this is what lets it decide when the §3.3 sliding renewal is due.
 */
export const SESSION_EXPIRY_COOKIE = "wham_session_exp";

/** The nonce issued to this browser; the signed message must carry the same one. */
export const NONCE_COOKIE = "wham_nonce";

/** §3.3: renew the session on any authenticated call within 24h of expiry. */
export const SLIDING_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;
