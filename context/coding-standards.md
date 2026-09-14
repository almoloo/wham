# Coding Standards — wham

*This project is greenfield. Unlike a standards doc written against an existing codebase, the conventions below are **prescriptive on day one and descriptive from week two** — once code exists, if the code and this doc disagree, that's a bug in one of them, and you should say which. Anything derived from `docs/` (the four specs) is not negotiable here; this doc covers the conventions the specs don't reach.*

---

## Cross-cutting — all three packages

These override anything language-specific below.

### Money

- Wire format: uint256 base units as **decimal strings**. In memory: `BigInteger` / `bigint` / `uint256`. At rest: `numeric(78,0)`.
- No float, no `double`, no `decimal` as a money type, no `long`, no JS `number`. Not in a DTO, not in a test fixture, not in a log line, not in a chart data point.
- Round **up** on amounts owed, **down** on amounts receivable.
- Basis points are integers, `10_000 = 100%`. Never store a percentage as a float.
- Formatting happens only at the render layer. A service, a handler, or a contract never returns a formatted string.

### Chain enums

Map explicitly with a table, in both directions, and throw on an unmapped value. Never cast an ordinal. `MemberState` has `None = 0` on-chain and the app enums don't, so a cast is silently wrong for every member.

### Addresses

Store lowercase, index lowercase, compare lowercase, **return checksummed**. One value object per package does the round-trip (`EvmAddress` in C#, a branded `Address` type in TS, native in Solidity). Never hand-lowercase at a call site.

### Contract artifacts

ABIs and addresses enter the apps from `shared/abi/` and `shared/deployments/<chainId>.json` only. No hardcoded address, no address in an env var, no copy-pasted ABI fragment. Contract call signatures are generated (`wagmi generate`, Nethereum event DTOs), never hand-written.

### Time

Store and compare UTC. Render in the user's stored IANA timezone. The contract's `roundStart` / `biddingClosesAt` / `contributionDueAt` formulas are the source of truth for every deadline — the backend derives, it does not independently compute.

### Comments

Explain *why*, not *what*. A one-line docstring restating the method name is fine and conventional; a paragraph explaining logic that's already obvious is noise. Non-obvious invariants, ordering requirements, and "this looks wrong but isn't" cases get a comment — those are exactly where this project's bugs will live. Delete dead code rather than commenting it out.

---

## Solidity (`contracts/`)

- **Version:** `pragma solidity 0.8.28;` exactly, no carets. `via_ir = true` (settlement is stack-heavy without it), optimizer 200 runs.
- **Layout per contract:** type declarations → constants → immutables/storage → events → errors → modifiers → constructor/initializer → external → public → internal → private, views last within each group. Keep it consistent; reviewers navigate by position.
- **Errors:** custom errors only, never `require` with a string. Every error carries exactly the data its user-facing message template needs (`BidNotImproving(uint16 leading)`, not a bare `BidNotImproving()`). Error names map 1:1 to copy in the frontend spec §8.3 — adding an error means adding a mapping there.
- **Events:** index the parameters the indexer filters on (member address, round), leave the rest in data. Every state mutation that the backend projects emits an event; if there's no event, the backend can't see it, and the backend is not allowed to infer.
- **Storage:** pack small fields contiguously and in declaration order — the `Member` struct's four-slot packing is deliberate and easy to break by inserting a `uint256` in the middle. Add a comment above any struct whose field order is load-bearing.
- **Checks-effects-interactions, always.** State changes before external calls, nonce increments before transfers, `nonReentrant` on every state-changing external function. All member-facing token movement is pull-based.
- **Loops** over `memberList` are fine (`memberTarget ≤ 20`) and preferred to accumulator math. Auditability beats cleverness here; gas is cheap on Arbitrum. Never introduce an unbounded loop.
- **Shared math is extracted once.** `quotePayout` / `quoteTopUp` and `settleRound` must call the same internal pure functions. A preview that can disagree with settlement by one base unit is a lying UI, and there's a fuzz test asserting they agree.
- **External calls that aren't load-bearing are wrapped.** Reputation calls inside settlement go in `try/catch` with a failure event — the savings mechanism must never be hostage to the scoring one.
- **NatSpec** on every external/public function: `@notice` in plain language (it surfaces in wallets), `@param`/`@return` where non-obvious, `@dev` for the invariant it relies on.
- **Naming:** `PascalCase` contracts/structs/enums/events/errors, `camelCase` functions/variables, `SCREAMING_SNAKE_CASE` constants and immutables, `_leadingUnderscore` for internal/private functions and storage that isn't public. Test files `<Contract>.t.sol`, tests `test_<Behaviour>` and `test_Revert_<Condition>`.
- **No upgradeability on circles, no admin pause on an active circle, no owner path to member funds.** These are product commitments stated publicly. Don't add an escape hatch "just in case" — that's the feature.

## C# / .NET (`backend/`)

- **Nullable reference types on, warnings as errors.** `<Nullable>enable</Nullable>` + `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in `Directory.Build.props`. Unlike some codebases, this one does not tolerate loose typing — the wire contracts are pinned to another team's document and the compiler is the cheapest place to catch drift.
- **Minimal APIs with route groups**, one file per resource group under `Wham.Api/Endpoints/`. Handlers stay thin: parse, authorise, delegate, map. Business logic lives in services in `Wham.Infrastructure` / `Wham.Underwriting`, never in an endpoint lambda.
- **Hand-written mappers** in `Api/Mapping/`, one per DTO. No AutoMapper. The response shapes are fixed by the frontend spec §7 and must be explicit enough that a field rename breaks the build.
- **Constructor injection via primary constructors** (`public sealed class ScoringEngine(IEnumerable<IScoringRule> rules, IOptions<WhamOptions> opts)`). No service locator, no `IServiceProvider` injection outside composition roots and hosted services.
- **Options pattern** for all config (`WhamOptions` bound from `Wham:*`), validated at startup with `ValidateOnStart()`. No `Environment.GetEnvironmentVariable` scattered through services. Secrets are env-only; `appsettings.json` holds non-secret defaults.
- **Sealed by default.** `sealed class` unless something derives from it. `readonly record struct` for value objects.
- **Errors:** every failure is a `WhamException` subclass carrying a `Code` from the closed union, an HTTP status, and a **user-facing `message` that ships to production untouched**. One exception middleware renders the envelope. Never put an address, a SQL fragment, a stack trace, or a revert string in `message` — that goes in `details`. No generic `Exception` throws.
- **Async all the way**, `CancellationToken` threaded through every async signature including repository-level ones. No `.Result`, no `.Wait()`, no `async void` outside event handlers.
- **EF Core:** `AsNoTracking()` on every read path. Explicit `Include`/`Select` projections, never lazy loading. Migrations are generated, reviewed, and committed — never edited by hand after they've been applied anywhere.
- **The indexer is the only writer of projected circle state.** No HTTP handler, background job, or admin command writes to `circles`, `circle_members`, `rounds`, `contributions`, `bids`, or `insurance_claims`. This rule is what makes `reindex --truncate-projections` correct, and breaking it once produces a divergence you find during the demo.
- **Naming:** `PascalCase` types/methods/properties/constants, `camelCase` locals/parameters, `_camelCase` private fields, `I`-prefixed interfaces. Files match the type name. Async methods end in `Async`.
- **Layout:** `Endpoints/`, `Contracts/` (DTOs), `Mapping/`, `Filters/` in `Wham.Api`; `Entities/`, `Enums/`, `ValueObjects/` in `Wham.Domain`; `Persistence/{Configurations,Migrations}`, `Chain/`, `Notifications/`, `Auth/` in `Wham.Infrastructure`; `Rules/` + engine + signer + publisher in `Wham.Underwriting`. Hosted services live in `Wham.Indexer` / `Wham.Workers`, one file per service.
- **Logging:** `ILogger<T>` with structured properties (`log.LogWarning("Reorg at {Block}", n)`), never string interpolation into the message template. Never log a private key, a signature, a JWT, or a full quote payload.

## TypeScript / Next.js (`frontend/`)

- **`strict: true`, no `any`.** `@typescript-eslint/no-explicit-any` is an error. `unknown` + a Zod parse at every boundary instead. This is the opposite of a permissive setup and it's deliberate: three teams are generating against shared contracts on a three-week clock.
- **Types before UI.** `src/types/` mirrors the frontend spec §6 by hand (no codegen), and `src/lib/schema/` holds a Zod schema per type. **Every API response is parsed at the boundary** — the .NET service and the frontend will drift, and you want that to fail loudly in dev rather than render `undefined` in a money field.
- **Server components by default**, `'use client'` only on the leaf that needs interactivity. Wallet interaction, forms, and live-updating panels are client islands inside server-rendered pages.
- **Server state is TanStack Query, full stop.** Zustand holds only the transaction queue, the toast queue, and filter drafts. No global store for server data, no `useEffect`-driven fetching. Query keys follow `['circle', id]` / `['round', id, n]` / `['me', 'summary']`; every write invalidates a documented key set.
- **Filters and browse state live in URL search params**, not component state — results have to be shareable.
- **Contract reads/writes via generated hooks only.** `simulateContract` before every `writeContract`; a revert caught before the wallet prompt is a far better experience than a failed transaction, and it's where the error mapping actually fires. Never auto-chain two wallet prompts.
- **One `useApproveAndWrite` hook and one `<TxButton>`** wrap every value-moving action. Don't hand-roll an approval flow per screen.
- **Components:** `src/components/ui/` primitives, then domain folders (`circle/`, `agent/`, `reputation/`, `tx/`, `money/`, `layout/`). Anatomy and states for the bespoke ones are defined in `docs/wham-components.md` — build from there, don't invent a parallel vocabulary.
- **Tailwind logical properties only** (`ms-`, `me-`, `ps-`, `pe-`), never `ml-`/`mr-`. RTL is a shipping requirement, not a stretch goal. Colours come from CSS custom properties, never a raw hex in a component.
- **Every data surface defines loading, empty, error, and partial states before it ships.** Skeletons matching final layout dimensions; empty states with a sentence and one action, never "No data"; errors render `ApiError.message` verbatim with a retry.
- **No browser storage in artifacts or components** — `localStorage` / `sessionStorage` are not used for app state. Session lives in an httpOnly cookie; everything else is React state or server state.
- **Naming:** `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils/lib, `use*` for hooks, kebab-case route segments. Types `PascalCase`, no `I` prefix.
- **Copy from the spec is verbatim.** `docs/wham-frontend-construction-spec.pdf` §9 contains written product copy, not placeholder text. Paraphrasing it is a regression.

---

## Database

- PostgreSQL 16. `snake_case` tables and columns (EF Core naming convention configured once, not per-entity).
- Every table: `created_at timestamptz not null default now()`; `updated_at` where the row mutates. Soft delete only where a spec calls for it — most tables here are projections and get truncated, not soft-deleted.
- Token amounts `numeric(78,0)`. Addresses `varchar(42)` lowercase. Tx hashes `varchar(66)`.
- **Indexes are added for actual query patterns**, not by default. The partial index on live seat reservations and the unique index on `(chain_id, tx_hash, log_index)` are load-bearing — the first makes the capacity check cheap under contention, the second is the entire idempotency guard for the indexer.
- Every model gets a short `//` comment in its EF configuration explaining its purpose and whether it's a projection (rebuildable) or backend-owned (not).
- **Multi-step writes that must be atomic use an explicit transaction.** Seat reservation (serializable + `FOR UPDATE`) and every indexer event projection (same transaction as the `chain_events` insert) are non-negotiable. Retry once on `40001` before surfacing.

## API design

- All routes under `/api/v1`. Payload shapes are **fixed by the frontend spec §7** — implementing a different shape is a bug even if it's nicer.
- Error envelope is universal: `{ error: { code, message, details?, traceId } }`. `code` comes from the closed union in frontend spec §6.10; adding one is a change to two documents.
- Enums serialise as `snake_case` strings matching the TS unions exactly. Nulls are emitted, never omitted — the Zod schemas distinguish absent from null and `viewer.quotedCollateral: null` is load-bearing.
- Pagination is page-based (`page`, `pageSize`), default 12 for circles and 20 for lists, capped at 100. The datasets are small and shareable URLs matter more than deep-scroll performance.
- Authenticated responses are `Cache-Control: no-store`. The anonymous/authenticated split on `/v1/circles` is a real trap — cache it naively and one user sees another's `viewer` block. There's a test for it.

## Testing

- **Contracts:** Foundry. Unit tests per function including every revert path; integration tests simulating a full circle; **invariant tests with a handler including a malicious reentrant actor and a lazy never-pays actor** — most real bugs surface from their interaction with an honest majority. Gas benchmarks committed and tracked.
- **Backend:** xUnit + FluentAssertions. Scoring engine tests are table-driven and the highest-value tests in the repo (determinism, bounds, every rule boundary, non-empty copy for every fireable rule). Integration via `WebApplicationFactory` + Testcontainers Postgres; chain integration against Anvil. The concurrency test (parallel `join-intent` on a one-seat circle) and the idempotency test (process the same log twice, assert identical state) catch more than everything else combined.
- **Frontend:** Vitest for lib/format/schema logic. Component tests only where behaviour is non-trivial (the bid composer's live math, the approval state machine). `pnpm typecheck && pnpm build` is the real gate.
- **Cross-package:** the EIP-712 digest-equality test exists on both sides before anything depends on quotes. A field-type mismatch produces a signature that reverts only after the user pays gas.
- No coverage threshold gates anything. Coverage on the scoring engine and settlement math should nonetheless be complete — those two are where money is decided.
