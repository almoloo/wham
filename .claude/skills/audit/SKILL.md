---
name: audit
description: Reviews code — either the whole project or a stated scope (a branch, a package, a just-built feature) — for security, money-correctness, cross-package interface drift, performance, logic errors, and pattern conformance. Classifies findings as P0/P1/P2, fixes small contained ones directly, flags or asks about large ones, re-runs the relevant package gates after any fix, and records what it found. Use when the user runs /audit, asks for a code review, asks "is this safe to ship", or after a feature is implemented and before /complete.
---

# audit — find and fix what review would catch

Where this sits in the workflow:

    build  ->  [this skill]  ->  /complete
             (catches what a human           (ships it, with the
              reviewer would catch,           audit's findings in
              before it ships)                 the history line)

Two modes, both valid:

- **`/audit`** (no argument) — full-project sweep. Use periodically, or
  before a milestone (an integration gate from `docs/wham-handoff.md` §4,
  a demo, a deploy).
- **`/audit <scope>`** — scoped, e.g. `/audit backend`, `/audit contracts`,
  `/audit the current branch`, `/audit the feature I just built`. Use this
  as the default post-build check — it's cheaper and it's what
  `context/ai-interaction.md` means by "review AI-generated code ...
  periodically and on demand."

If `context/current-feature.md` has a `(Current)` feature, an unscoped-but-
recent `/audit` should default to that feature's touched files rather than
the whole repo — ask if it's ambiguous which the user wants.

## Step 1 — establish scope and load context

1. Determine the file set: the whole repo, a named package
   (`contracts/`, `backend/`, `frontend/`), or a diff (current branch vs
   `main`, or the files listed in the current feature's spec).
2. Read `CLAUDE.md` (the canonical interface list, money rules, product
   rules) and `context/coding-standards.md` for every package in scope. Read
   the relevant `docs/` spec sections if the scope maps to a specced
   feature.
3. If nothing in scope is new since the last audit recorded in
   `context/current-feature.md`, say so and stop rather than re-reporting
   the same clean state.

## Step 2 — walk the checklist

Don't skim — read the actual code against each of these. Skip categories
that don't apply to the scope (a frontend-only diff doesn't need the
reentrancy checks).

### Security

- Every authenticated route derives identity from the JWT/session, never
  from a route param or request body.
- Input validation on every mutating endpoint; no unvalidated data reaches
  a query, a file path, or a shell/RPC call.
- Secrets: never logged, never in `appsettings.json`, never outside the
  `workers` container (`Wham__Agent__PrivateKey`, `Wham__Keeper__PrivateKey`)
  — grep the `api`/`indexer`/`frontend` environments for both.
- Contracts: checks-effects-interactions ordering on every function that
  moves state before an external call; `nonReentrant` on every
  state-changing external function; access control (`onlyCircle`,
  `onlyOwner`, agent-signature checks) present on everything that should
  have it; no unbounded loop over anything not capped at `MAX_MEMBERS`.
- Nonce/replay: agent quote nonces read from contract storage and
  incremented before the external transfer, never trusted from calldata
  alone.

### Money correctness

- No `float`, `double`, `decimal`-as-money, `long`, or JS `number` in any
  path that touches a token amount — grep for these in new/changed code
  specifically, since this is the easiest rule to violate by accident in a
  chart, a log line, or a test fixture.
- Rounding direction: up on amounts owed, down on amounts receivable.
- Any new preview/quote function (like `quotePayout`, `quoteTopUp`) shares
  its arithmetic with the settlement path it previews, via the same
  internal function — not a re-derived copy that can drift.
- New token-amount columns are `numeric(78,0)`; new TS types use `bigint`;
  new C# fields use `BigInteger`.

### Cross-package interface drift

Check each of the five canonical interfaces from `CLAUDE.md` if the scope
touches anything near them:

- `CircleParams` field order identical everywhere it's constructed or
  decoded (contract struct, backend `DeployParamsDto`, frontend
  `deployParams` type).
- Chain enums are mapped explicitly (a table, both directions) with a throw
  on unmapped values — never cast. Check `MemberState`'s `None = 0` offset
  specifically; it's the one most likely to be cast by accident.
- If the `AgentQuote` struct or its EIP-712 domain changed: does the
  digest-equality test (backend computing the same hash as the contract's
  `hashQuote()`) still exist and still pass?
- No hardcoded contract address or copied ABI fragment outside `shared/` —
  grep for bare `0x` literals in `backend/src` and `frontend/src` (test
  fixtures and `shared/` itself are fine).
- Any new or changed API error code exists in both the backend's closed
  union and the frontend spec's `ApiErrorCode` type. A code used one place
  and not the other is a finding regardless of severity elsewhere.

### Backend-specific

- No HTTP handler, background job, or admin command writes to a projected
  table (`circles`, `circle_members`, `rounds`, `contributions`, `bids`,
  `insurance_claims`) — only `Wham.Indexer` does. Grep for
  `db.Circles.Add`/`Update`/`.ExecuteUpdateAsync` etc. outside the indexer
  project.
- `docker-compose.yaml` still pins `indexer` and `workers` to one replica.
- New migrations are additive/reviewed, not edits to an already-applied
  migration file.
- New `ILogger` calls use structured properties, not string interpolation,
  and never log a private key, signature, JWT, or full quote payload.

### Frontend-specific

- New API calls are parsed through a Zod schema at the boundary, not
  trusted as `any`.
- No `localStorage`/`sessionStorage` used for app state.
- RTL: logical properties (`ms-`/`me-`/`ps-`/`pe-`), never `ml-`/`mr-`, in
  any new styled markup.
- New money-moving CTAs state the amount in their own label; new tx flows
  use the shared `useApproveAndWrite`/`<TxButton>` pattern rather than a
  one-off wallet-prompt sequence.

### Product copy

- The underwriting agent is described as "Rules-based v1" wherever named —
  no phrasing that implies a trained model.
- No yield / APY / interest / returns language anywhere new.
- Delinquent members are never hidden from a circle's public view.
- New user-facing strings exist in both `en` and `fa`.
- Any copy pulled from `docs/wham-frontend-construction-spec.pdf` §9 matches
  verbatim, not paraphrased.

### Performance

- N+1 query patterns in new list/summary endpoints.
- A new frequent query without a matching index.
- An RPC call on a hot path (e.g. per-row in a list response) that should be
  batched or cached, per the caching table in the backend spec.

### Logic errors

- Edge cases: empty circle, single-member circle, `memberTarget` at the
  cap, zero bids on a round, a bid tie attempted (should be rejected by the
  ≥0.25%-improvement rule, not silently accepted).
- Race conditions: the seat-reservation capacity check under concurrent
  `join-intent` calls, double-settle on `settleRound`, double-claim on
  `claimPayout`/`withdrawRewards`.
- Off-by-one on round indices, especially around the final round (no
  auction, single eligible bidder) and round-0 timing.

### Patterns

- Matches `context/coding-standards.md` for the package: layout, naming,
  error handling, DI style, test structure.

## Step 3 — classify

- **P0** — funds at risk, a security hole, data corruption, or anything
  that would block a deploy. Includes any canonical-interface mismatch that
  could produce a signature or transaction that reverts only after a user
  pays gas.
- **P1** — a real bug: wrong behaviour, a contract/spec violation, a
  missing check that should exist.
- **P2** — style, tech debt, or a nit worth flagging but not urgent.

When genuinely unsure whether something is P0 (especially anything
touching collateral, settlement, or the agent's signing key), classify it
P0 and say why you're unsure, rather than downgrading it to avoid the
conversation.

## Step 4 — fix, flag, or ask

- **P0/P1, small and contained** — fix it directly, matching
  `context/ai-interaction.md`'s "make minimal changes" rule: fix the
  specific thing, don't refactor around it.
- **P0/P1, large or architecturally ambiguous** — stop and describe the
  problem and the options; ask before making the change, per "ask before
  large refactors or architectural changes."
- **P2, trivial** (a one-line nit, a stale comment) — fix it.
- **P2, non-trivial** — flag it in the report; don't fix speculatively.

After any fix, re-run the gate(s) for the affected package(s) — `forge
test`, `dotnet test`, or `pnpm typecheck && pnpm build` — before moving on.
A fix that isn't verified is a new finding waiting to happen.

## Step 5 — report and record

Present a findings table: severity, area, description, status (fixed /
flagged / deferred, with the reason for anything not fixed).

If `context/current-feature.md` has a `(Current)` feature this audit was
scoped to (or clearly relates to), append the material findings to that
feature's eventual History line the way past entries in this project have
done — concise, e.g. *"a post-build audit caught (P1) X, fixed by Y; (P2) Z,
flagged"*. Don't write this into History directly — `/complete` owns the
History line — just make sure the findings are captured somewhere
`/complete` will pick up (a short "Audit findings" note under the current
spec in `current-feature.md` is the right place).

If the audit was a standalone full-project sweep with no current feature,
report to chat only; don't invent a feature entry to hang the findings on.

## Formatting

Match `context/ai-interaction.md`: concise, scannable, a table for the
findings rather than a wall of prose.
