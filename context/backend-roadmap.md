# Backend roadmap — work the frontend is waiting on

Durable hand-off from the frontend to the backend. Unlike
`context/current-feature.md` this file is **not** reset between features; each
item below stays until it is built, then gets marked done.

Authority, per `CLAUDE.md`: contract spec → backend spec → frontend spec, with
each spec's §0 addendum overriding its body. API payload *shapes* are fixed by
frontend spec §7. Where this file adds to or differs from §7 it says so under
**Deviations**, and it acts as the addendum to §7 until the spec PDF is
regenerated.

| # | Item | Backend sub-feature | Status |
|---|---|---|---|
| 1 | SIWE authentication — `/v1/auth/*` | 1g | Frontend in progress against a stand-in; backend not started |

---

## 1. SIWE authentication — `/v1/auth/*`

The frontend side (Frontend 4) is in progress: the BFF that calls these
endpoints and an in-process stand-in
(`frontend/src/lib/auth/backend.mock.ts`) already exist, and the sign-in UI
lands in the following steps. The stand-in enforces the checks below on real
signatures. When these endpoints exist, switching is: set
`WHAM_API_URL`, build with `NEXT_PUBLIC_USE_MOCKS=false`, delete the stand-in
(`grep -r "TODO(backend)" frontend/src`).

### How the frontend calls you

```
browser ──► Next.js BFF  /api/bff/*  ──► .NET  /v1/auth/*
            (holds the token in            (you)
             httpOnly cookies)
```

- The browser **never** talks to `/v1/auth/*` and **never** sees the token. A
  Next.js route handler (the BFF) calls you server-to-server and keeps the
  token in an httpOnly cookie.
- Authenticated endpoints receive `Authorization: Bearer <token>`. **The BFF
  does not forward cookies to you.** Do not rely on cookies for anything here.
- Every auth response must carry `Cache-Control: no-store`.

### Endpoints

All bodies are JSON, camelCase. Timestamps are ISO 8601 UTC; the frontend
accepts both `…Z` and `…+00:00`, so .NET's default `DateTimeOffset`
serialisation is fine.

#### `GET /v1/auth/nonce` — public

→ `200 NonceResponse`

- Cryptographically random, **alphanumeric, ≥ 8 characters** (the frontend
  rejects anything else — it's an EIP-4361 requirement).
- Stored server-side, keyed by the nonce value. **Single use**, **10-minute
  expiry** (`expiresAt = issuedAt + 10 min`).
- Consumed only by a *successful* `verify`. A failed attempt must not burn it
  (the wallet may retry against the same nonce).
- Rate-limit it: it is public and allocates state.
- Errors: `RATE_LIMITED` (429), `INTERNAL` (500).

#### `POST /v1/auth/verify` — public

Body `VerifyRequest` → `200 VerifyResponse`

`message` is the raw EIP-4361 text the wallet signed (example below).
Check, in this order:

1. Body is `{ message, signature }` → else `VALIDATION_FAILED` (400).
2. Message parses as EIP-4361 → else `SIGNATURE_INVALID`.
3. **Nonce** was issued by you, is unexpired, and unused → else `NONCE_INVALID`.
4. **Domain** equals `WHAM_PUBLIC_DOMAIN` (host, with port if non-default).
5. **Chain ID** equals `WHAM_CHAIN_ID`.
6. **Expiration Time** is present and in the future; `Not Before`, if present,
   has passed. A message without an expiry is refused — the frontend always
   sends one.
7. **Signature** verifies for the address in the message: `ecrecover` for
   EOAs, falling back to **EIP-1271** (and ERC-6492) via `WHAM_RPC_URL` for
   smart-contract wallets. Signer ≠ message address → `ADDRESS_MISMATCH`.
   Any other failure → `SIGNATURE_INVALID`.

Then, atomically: consume the nonce, upsert the user, issue the token.

- **Nonce consumption must be atomic.** Two parallel `verify` calls with the
  same nonce → exactly one succeeds. (Same shape as the `join-intent`
  concurrency test — write it.)
- **User upsert** keyed by lower-cased address; return the **EIP-55
  checksummed** address.
- **Token**: JWT, HS256, signed with `Wham__Auth__JwtSigningKey`, **7-day**
  expiry, `sub` = the address, no roles. Every `/me/*` endpoint derives the
  address from this token, never from a route param. The frontend treats the
  token as opaque.
- **`expiresAt`** = the token's `exp`.
- Errors: `VALIDATION_FAILED` (400), `NONCE_INVALID` / `SIGNATURE_INVALID` /
  `ADDRESS_MISMATCH` (401), `RATE_LIMITED` (429), `INTERNAL` (500).

New-user defaults for `UserProfile`:

| Field | Value |
|---|---|
| `displayName`, `ensName`, `email`, `telegramHandle` | `null` (ENS lookup optional) |
| `avatarSeed` | first 8 hex chars of the address after `0x` (`address[2..10]`) |
| `emailVerified` | `false` |
| `timezone` | `"UTC"` until onboarding sets it |
| `locale` | `"en"` |
| `firstLogin` | `true`; **stays `true` until onboarding completes** (`PATCH /v1/me`, frontend spec §9.11) |
| `createdAt` | the first successful `verify` |
| `preferences` | `notifyPaymentDueHours: [72, 24, 4]`, `notifyBidWindow: true`, `notifyRoundSettled: true`, `channelEmail: false`, `channelTelegram: false`, `channelInApp: true` |

The frontend redirects a `firstLogin: true` user to `/app/onboarding` and
everyone else to `/app`, reading the flag from `GET /v1/auth/session` (frontend
spec §3.1 step 9).

#### `GET /v1/auth/session` — Bearer

→ `200 UserProfile`

- `401 SESSION_EXPIRED` when the token is well-formed and correctly signed but
  past `exp`.
- `401 UNAUTHENTICATED` for a missing, malformed or badly-signed token.
- **The BFF clears the user's cookies on any 401 from here**, so use 401 only
  for a genuinely dead session. A transient fault must be a 5xx
  (`INTERNAL`), which leaves the user signed in.
- Expect it often (every app load, and TanStack Query's default refetch on
  window focus): keep it to a JWT check plus one profile read.

#### `POST /v1/auth/refresh` — Bearer — **NEW, not in frontend spec §7.1**

→ `200 RefreshResponse`

Issues a fresh 7-day token for the same address.

- The BFF calls this when the current token has **< 24 h** left (frontend spec
  §3.3, "sliding refresh"). You do not need to enforce the window.
- **Do not revoke the old token.** A stateless JWT can't be revoked, and two
  browser tabs can refresh at the same moment. The old token simply expires on
  its own.
- An already-expired token → `401 SESSION_EXPIRED`; the user signs in again.
- Errors: `UNAUTHENTICATED` / `SESSION_EXPIRED` (401), `RATE_LIMITED` (429),
  `INTERNAL` (500).

#### `POST /v1/auth/logout` — Bearer

→ `204`, no body.

- Idempotent. A missing, invalid or expired token is still `204`: the BFF
  clears the user's cookies regardless of what you answer.
- Revoking the token server-side (e.g. a `jti` denylist) is your call; the
  frontend does not depend on it.

### Types

The executable version of this contract is `frontend/src/lib/schema/auth.ts`
(Zod, with `common.ts`). The frontend parses every response against it and
**fails the user-facing request if a field is missing or mistyped** — so a
missing key is a bug, not a soft difference.

**Nulls are emitted, never omitted.** Configure `System.Text.Json` with
`DefaultIgnoreCondition = JsonIgnoreCondition.Never` for these DTOs.

```ts
interface NonceResponse {
  nonce: string;
  issuedAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

interface VerifyRequest {
  message: string;
  signature: Hex;
}

interface VerifyResponse {
  token: string;
  expiresAt: IsoDateTime;
  user: UserProfile;
}

interface RefreshResponse {
  token: string;
  expiresAt: IsoDateTime;
}

interface UserProfile {
  address: Address;
  displayName: string | null;
  ensName: string | null;
  avatarSeed: string;
  email: string | null;
  emailVerified: boolean;
  telegramHandle: string | null;
  timezone: string;
  locale: "en" | "fa";
  firstLogin: boolean;
  createdAt: IsoDateTime;
  preferences: {
    notifyPaymentDueHours: number[];
    notifyBidWindow: boolean;
    notifyRoundSettled: boolean;
    channelEmail: boolean;
    channelTelegram: boolean;
    channelInApp: boolean;
  };
}

interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    traceId: string;
  };
}
```

`Address` and `Hex` are `0x`-prefixed strings; `IsoDateTime` is a string.
`ApiErrorCode` is the closed union from frontend spec §6.10 — **no new codes
are added by this work**:

```
UNAUTHENTICATED  SESSION_EXPIRED  ADDRESS_MISMATCH  NONCE_INVALID  SIGNATURE_INVALID
CIRCLE_NOT_FOUND  CIRCLE_FULL  CIRCLE_ALREADY_STARTED  NOT_A_MEMBER  ALREADY_A_MEMBER
REPUTATION_TOO_LOW  OPEN_DELINQUENCY  QUOTE_EXPIRED  QUOTE_NOT_FOUND  AGENT_UNAVAILABLE
BID_WINDOW_CLOSED  BID_ABOVE_MAX  BID_NOT_IMPROVING  ALREADY_PAID_OUT
VALIDATION_FAILED  RATE_LIMITED  INTERNAL
```

Starting point for the .NET DTOs (records, hand-written mappers per
`coding-standards.md`):

```csharp
public sealed record NonceResponse(string Nonce, DateTimeOffset IssuedAt, DateTimeOffset ExpiresAt);
public sealed record VerifyRequest(string Message, string Signature);
public sealed record VerifyResponse(string Token, DateTimeOffset ExpiresAt, UserProfile User);
public sealed record RefreshResponse(string Token, DateTimeOffset ExpiresAt);
public sealed record UserPreferences(
    int[] NotifyPaymentDueHours, bool NotifyBidWindow, bool NotifyRoundSettled,
    bool ChannelEmail, bool ChannelTelegram, bool ChannelInApp);
public sealed record UserProfile(
    string Address, string? DisplayName, string? EnsName, string AvatarSeed,
    string? Email, bool EmailVerified, string? TelegramHandle, string Timezone,
    string Locale, bool FirstLogin, DateTimeOffset CreatedAt, UserPreferences Preferences);
```

Example `POST /v1/auth/verify` response (**do not reuse the address from
frontend spec §7.1 as a test vector — it is not a valid EIP-55 checksum**):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "expiresAt": "2026-09-27T09:14:38+00:00",
  "user": {
    "address": "0x7A3f9C2e1B4d8A6f0C5e3D9b2a1f4e8c7d6B5A40",
    "displayName": null,
    "ensName": null,
    "avatarSeed": "7A3f9C2e",
    "email": null,
    "emailVerified": false,
    "telegramHandle": null,
    "timezone": "UTC",
    "locale": "en",
    "firstLogin": true,
    "createdAt": "2026-09-20T09:14:38+00:00",
    "preferences": {
      "notifyPaymentDueHours": [72, 24, 4],
      "notifyBidWindow": true,
      "notifyRoundSettled": true,
      "channelEmail": false,
      "channelTelegram": false,
      "channelInApp": true
    }
  }
}
```

### The SIWE message you will receive (frontend spec §3.2)

Built by `viem`'s `createSiweMessage`, so this is byte-exact:

```
wham.example.com wants you to sign in with your Ethereum account:
0x7A3f9C2e1B4d8A6f0C5e3D9b2a1f4e8c7d6B5A40

Sign in to Wham. This signature proves you control this wallet. It does not authorise any transaction or move any funds.

URI: https://wham.example.com
Version: 1
Chain ID: 421614
Nonce: 8jK2mQ9pXvR4tN7wZ3bL
Issued At: 2026-09-20T09:14:02.000Z
Expiration Time: 2026-09-20T09:24:02.000Z
```

- `Issued At` / `Expiration Time` carry **milliseconds** (`.000Z`); parse RFC 3339
  with fractional seconds.
- `Expiration Time` = `Issued At` + 10 min. No `Not Before`, `Request ID` or
  `Resources`.
- The statement is verbatim product copy. Checking that it matches exactly is
  worthwhile: it stops a page from getting a wallet to sign a different
  sentence that still satisfies the other checks.
- The message is signed with `personal_sign` (EIP-191) — hash it that way.

### Errors and their copy

`message` is **user-facing product copy** and ships untouched (`CLAUDE.md`).
The audience is nervous about signing things: calm, plain, no jargon, never
blame. The stand-in's placeholder strings, as a starting point — the wording is
yours to finalise:

| Code | Status | Meaning here | Placeholder copy |
|---|---|---|---|
| `VALIDATION_FAILED` | 400 | Body isn't `{ message, signature }` | *(the BFF answers this itself; you rarely will)* |
| `NONCE_INVALID` | 401 | Unknown, expired or already-used nonce | "That sign-in request expired. Please try again." |
| `SIGNATURE_INVALID` | 401 | Malformed message/signature, wrong domain or chain, expired message, EIP-1271 rejects | "We couldn't verify that signature. Nothing was sent. Please try again." |
| `ADDRESS_MISMATCH` | 401 | Valid signature, but not from the address in the message | "That signature came from a different wallet than the one you connected. Please try again." |
| `UNAUTHENTICATED` | 401 | Missing/invalid token | "Please sign in to continue." |
| `SESSION_EXPIRED` | 401 | Well-formed token past `exp` | "Your session has expired. Please sign in again." |
| `RATE_LIMITED` | 429 | | |
| `INTERNAL` | 500 | | |

If the API is unreachable, or answers off-contract (a non-JSON body, a missing
field, an error body that isn't the §6.10 envelope), the user sees the
frontend's own "Something went wrong on our side. Please try again in a
moment." and the detail goes to the frontend server log.

### The cookies (frontend-owned — for context, you don't set these)

| Cookie | Holds | Attributes |
|---|---|---|
| `wham_session` | the token | httpOnly, `Secure` in production, `SameSite=Lax`, `Path=/`, 7 days |
| `wham_session_exp` | the token's `expiresAt` | as above, `Path=/api/bff` |
| `wham_nonce` | the nonce issued to this browser | as above, `Path=/api/bff`, ~10 min |

`wham_nonce` is how the frontend satisfies frontend spec §7.1's "nonce bound to
the caller's session cookie": the BFF refuses to forward a message whose nonce
isn't the one it issued to that browser. You only need the server-side
single-use nonce store.

### Configuration you need

From the `CLAUDE.md` env table: `WHAM_PUBLIC_DOMAIN` (the SIWE domain),
`WHAM_CHAIN_ID`, `Wham__Auth__JwtSigningKey` (32+ bytes), and
`Wham__RpcUrl` for the EIP-1271 fallback. The `api` container holds no private
key; the JWT key is symmetric.

### Suggested tests

Mirror the frontend stand-in's suite (`frontend/src/lib/auth/backend.mock.test.ts`):

- accepts a correctly signed message
- rejects: nonce never issued · nonce reused · nonce > 10 min old · signature
  from a different key · expired message · missing expiry · wrong domain ·
  wrong chain · malformed signature
- a failed `verify` does not burn the nonce
- **N parallel `verify` calls on one nonce → exactly one `200`**
- `session`: live token → profile; unknown token → `UNAUTHENTICATED`; token past
  `exp` → `SESSION_EXPIRED`
- `refresh`: new token, later `expiresAt`, old token still valid
- `logout`: `204`, idempotent, `204` even for a bad token
- every success body parses against the frontend Zod schemas
  (`frontend/src/lib/schema/auth.ts`) — run your response fixtures through them
  — and `Cache-Control: no-store` is present

### Deviations from frontend spec §7.1 — need a yes/no from the backend owner

| # | Deviation | Why | If you'd rather not |
|---|---|---|---|
| 1 | **New** `POST /v1/auth/refresh` | §3.3 requires sliding refresh, but `GET /v1/auth/session` returns only `UserProfile`, and the BFF owns the cookie — there is no way to deliver a re-issued token | Return the new token in a response header (e.g. `X-Wham-Refreshed-Token`) on any authenticated call; the BFF would read it instead. Tell the frontend which |
| 2 | Nonce is bound by the BFF's `wham_nonce` cookie, not by a cookie you set | The BFF doesn't forward cookies, by design | Have the BFF relay your `Set-Cookie`/`Cookie` — more plumbing, and two cookies to keep in step |
| 3 | Error-code mapping and statuses in the table above | §7.1 lists three codes for `verify` with no mapping or status | Propose another mapping; the frontend only branches on `code` |
| 4 | `firstLogin` stays `true` until onboarding completes | Matches §9.11; the stand-in approximates it with "until the second sign-in" | — |
| 5 | Old token stays valid after `refresh` | Stateless JWT; concurrent tabs | Track a `jti` and accept a short grace window |

Adding an error code is a two-document change (backend union + frontend spec
§6.10) — none is proposed here.
