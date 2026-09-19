# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`wham` is an on-chain rotating savings circle (ROSCA) platform — the digitised version of a *sandogh* / *tanda* / *iqub* / *chama*. A group contributes a fixed amount each round; one member takes the whole pot on rotation. Wham makes that work between strangers with four mechanisms: a per-member refundable deposit, a discount-bid auction for payout order, an ERC-8004-registered underwriting agent that sizes each deposit individually, and a shared insurance pool.

Three packages in one repo: **Solidity contracts** (Foundry, Arbitrum), a **.NET 9 backend** (indexer + underwriting agent + keeper + REST API), and a **Next.js 15 frontend** (SIWE, wagmi). Deployed as a single Coolify project via `docker-compose.yaml`, Postgres included.

Built for the Arbitrum Open House Singapore buildathon — three weeks, two developers. Everything targets **Arbitrum Sepolia** until after judging.

## The specs are the source of truth

Four documents in `docs/` define this project completely. They are not background reading — they are the build instructions, and they contain decisions you must not re-litigate.

| Doc | Governs |
|---|---|
| `docs/wham-smart-contract-spec.pdf` (v1.0) | Contracts, mechanism design, on-chain interfaces |
| `docs/wham-backend-construction-spec.pdf` (v1.1) | .NET services, DB schema, indexer, agent, keeper |
| `docs/wham-frontend-construction-spec.pdf` (v1.1) | Next.js pages, UX copy, tx flows, API payload shapes |
| `docs/wham-components.md` | Bespoke UI component anatomy and states |

**Authority order when they disagree:** contract spec → backend spec → frontend spec. Within the backend and frontend specs, the **§0 addendum overrides the body** — the addendum aligns each doc with contract decisions made after it was written. API payload *shapes* remain fixed by frontend spec §7.

`docs/wham-handoff.md` is the build map: integration gates, canonical interfaces, weekly sequencing.

## Repository layout

```
contracts/          Foundry — Solidity, tests, deploy + seed scripts
backend/            .NET 9 — src/Wham.{Api,Domain,Infrastructure,Underwriting,Indexer,Workers}
frontend/           Next.js 15 App Router
shared/
  abi/              written by `script/export-abi.sh` after `forge build`, committed, consumed by backend + frontend
  deployments/      <chainId>.json written by the deploy script, read by both apps
context/            project-overview, coding-standards, ai-interaction, current-feature
docs/               the four specs above + handoff
docker-compose.yaml single-stack deploy (Coolify)
```

`shared/` is **machine-written, human-read**. It is the only sanctioned way contract addresses and ABIs cross a package boundary. Never hand-copy an address into a config file, an env var, or a constant — if you find yourself typing `0x`, you are doing it wrong.

## Commands

```bash
# ── Contracts (cd contracts) ────────────────────────────────────────────
forge build                        # compile (does NOT touch ../shared/abi)
forge build && ./script/export-abi.sh   # compile + refresh ../shared/abi (CI runs it with --check)
forge test                         # all tests
forge test --match-test testJoin -vvv
forge test --match-path test/Settlement.t.sol
forge fmt                          # format
forge coverage
forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify
forge script script/SeedDemo.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast
anvil                              # local chain for integration tests

# ── Backend (cd backend) ────────────────────────────────────────────────
dotnet run --project src/Wham.Api           # WHAM_ROLE=all in dev
dotnet build
dotnet test                                  # all tests
dotnet test tests/Wham.Underwriting.Tests    # one project
dotnet test --filter "FullyQualifiedName~ScoringEngine"
dotnet format                                # lint/format gate
dotnet ef migrations add <Name> --project src/Wham.Infrastructure --startup-project src/Wham.Api
dotnet ef database update  --project src/Wham.Infrastructure --startup-project src/Wham.Api
dotnet run --project src/Wham.Api -- reindex --from <block> --truncate-projections
dotnet run --project src/Wham.Api -- seed-demo

# ── Frontend (cd frontend) ──────────────────────────────────────────────
pnpm dev
pnpm build
pnpm typecheck                     # tsc --noEmit
pnpm lint
pnpm test                          # vitest
pnpm wagmi generate                # regenerate contract types from ../shared/abi

# ── Whole stack ─────────────────────────────────────────────────────────
docker compose up --build          # postgres + api + indexer + workers + frontend
docker compose logs -f indexer
```

There is no root-level task runner and no workspace tool spanning all three packages — each has its own toolchain and you `cd` into it. Don't introduce Turborepo/Nx for three packages in three languages.

## Architecture

### Contracts (`contracts/`)

Five contracts. `WhamCircleFactory` deploys one EIP-1167 minimal-proxy `WhamCircle` per group; `WhamReputation` is a soulbound ERC-721 that computes scores on-chain; `WhamInsurancePool` holds the shared reserve; plus `MockUSDC` on testnet.

**The contracts are the source of truth for all circle state.** Every row in Postgres describing a circle, a member, a round, a bid, or a contribution is a *projection* of contract events. The database can always be rebuilt by replaying from the factory deployment block, and `reindex --truncate-projections` does exactly that. If you ever need to write circle state from an HTTP handler, you have found a design error, not a shortcut.

A deployed circle is **immutable**: no upgradeability, no admin pause, no owner function that can touch an active circle's funds or members. The factory owner can pause *new* deployments and manage the token allowlist, nothing more. Don't add an escape hatch.

The underwriting agent never transacts against a circle. It signs an **EIP-712 `AgentQuote`** off-chain that the member submits with `join()`; the contract enforces collateral bounds (`MIN_COLLATERAL_BPS` / `MAX_COLLATERAL_BPS`) independently, so a compromised agent key cannot zero a deposit or drain anything.

All outbound token transfers are **pull-based** (`claimPayout` / `withdrawRewards` / `withdrawCollateral`). `settleRound` credits balances; it never transfers to members.

### Backend (`backend/`)

Six projects: `Wham.Api` (minimal APIs, host), `Wham.Domain` (entities, no dependencies), `Wham.Infrastructure` (EF Core, Nethereum, notification senders, SIWE/JWT), `Wham.Underwriting` (the agent: rules, scoring, EIP-712 signing, attestation), `Wham.Indexer`, `Wham.Workers`.

One image, three roles selected by `WHAM_ROLE` (`api` / `indexer` / `workers`, or `all` in dev). In production they run as separate containers so a slow indexer can't stall requests, and **only the `workers` container holds signing keys**. The `api` container has no private key at all.

`ChainIndexer` polls logs by topic across all addresses and filters to known circles, writes projections inside the same transaction as a `chain_events` row, and is guarded for idempotency by a unique index on `(chain_id, tx_hash, log_index)`. **Never run more than one indexer replica.**

The underwriting agent's scoring is a set of enumerable `IScoringRule` implementations — deterministic, versioned (`heuristic-v1.2.0`), published verbatim on `/v1/agent/identity`. It is a rules engine, not a model, and every surface that names it says so.

Keeper (`SettlementKeeper`, `CircleStarter`) sends real transactions with its own key, separate from the agent's. Monitor its gas balance; an empty keeper stalls every circle at once.

### Frontend (`frontend/`)

Next.js 15 App Router. Public marketing/browse routes are server-rendered with ISR; everything under `/app/*` is client-side with TanStack Query behind a SIWE session.

SIWE: nonce and verification live in the .NET backend; Next.js route handlers under `/api/bff/*` exist **only** to put the resulting JWT in an httpOnly cookie. All other data goes browser → .NET directly via a same-origin rewrite (`/api/v1/*` → `$WHAM_API_URL/v1/*`) so cookies stay first-party and CORS never becomes an issue.

`src/mocks/` holds MSW handlers built from every fixture in the frontend spec §7 and §8, switched by `NEXT_PUBLIC_USE_MOCKS`. The entire app must run and demo with the backend and contracts absent.

Contract types come from `wagmi generate` against `shared/abi/`. Never hand-write a contract call signature.

## The canonical interface

Five things cross package boundaries. Each has one owner; drift in any of them is the failure mode of this project.

1. **`CircleParams` field order** — owner: contracts. Backend emits `deployParams` in exactly this order; frontend passes it through verbatim to `createCircle`.
   `token, contributionPerRound, memberTarget, roundDuration, biddingDuration, baseCollateralBps, insuranceSkimBps, maxDiscountBps, payoutCollateralBps, biddingEnabled, startsAt, agent`
2. **Chain enums** — owner: contracts. `MemberState` has `None = 0`, which shifts every ordinal relative to the app enums. **Map explicitly, never cast**, and throw on unmapped values.
3. **EIP-712 `AgentQuote`** — owner: contracts. Domain `WhamAgent` / `1` / chainId / circle address. The contract exposes `hashQuote()`; the backend asserts digest equality against it and the contract suite asserts a backend-format signature joins. Both tests exist before anything depends on quotes.
4. **`shared/deployments/<chainId>.json`** — owner: contracts deploy script. Frontend `CONTRACTS[chainId]` and backend `Wham:Contracts` + `Indexer:StartBlock` load from it.
5. **API error codes** — owner: backend, fixed by frontend spec §6.10. Adding one is a two-document change.

## Money handling

Non-negotiable, all three packages:

- Wire format: uint256 base units as **decimal strings** (`"250000000"` = 250 USDC).
- In memory: `BigInteger` (C#), `bigint` (TS), `uint256` (Solidity).
- At rest: `numeric(78,0)`.
- Round **up** on amounts owed, **down** on amounts receivable — a user who sends the displayed amount must never be one base unit short.
- Never a float, never a `long`, never a JS `number`. Not in a DTO, not in a log line, not in a test fixture.
- Basis points are integers; `10_000 = 100%`.

## Environment variables

See `.env.example`. Never commit a key.

| Var | Used by | Note |
|---|---|---|
| `DATABASE_URL` / `ConnectionStrings__Wham` | backend | compose sets `ConnectionStrings__Wham` directly from the Postgres vars below |
| `WHAM_ROLE` | backend | `api` \| `indexer` \| `workers` \| `all` |
| `WHAM_CHAIN_ID` | backend, frontend | defaults to `421614` (Arbitrum Sepolia) |
| `Wham__RpcUrl` / `WHAM_RPC_URL`, `Wham__RpcUrlFallback` / `WHAM_RPC_URL_FALLBACK` | backend | paid RPC primary, public as fallback |
| `WHAM_PUBLIC_DOMAIN` | backend, frontend | SIWE domain/issuer; frontend's public FQDN |
| `Wham__Agent__PrivateKey` / `WHAM_AGENT_PRIVATE_KEY` | **workers only** | signs EIP-712 quotes + attestations |
| `Wham__Keeper__PrivateKey` / `WHAM_KEEPER_PRIVATE_KEY` | **workers only** | sends `settleRound` / `start` / `cancel` |
| `Wham__Auth__JwtSigningKey` / `WHAM_JWT_SIGNING_KEY` | backend | 32+ bytes |
| `Wham__Email__ApiKey` / `WHAM_EMAIL_API_KEY`, `Wham__Telegram__BotToken` / `WHAM_TELEGRAM_BOT_TOKEN` | workers | optional |
| `WHAM_API_URL` | frontend | internal container URL. Needed at **build time** (the `/api/v1` rewrite is baked in by `next build`; a production build fails without it unless mocks are on) **and** at runtime (the BFF route handlers call it) |
| `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_USE_MOCKS`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | frontend | **build args, not runtime env** — inlined into the client bundle. The frontend throws at startup if the WalletConnect ID is missing |
| `SERVICE_USER_POSTGRES`, `SERVICE_PASSWORD_POSTGRES` | postgres | Coolify-generated in production; set in `.env` for local compose |
| `DEPLOYER_PK`, `AGENT_ADDRESS`, `ARB_SEPOLIA_RPC`, `ARBISCAN_API_KEY` | contracts | local only, never in compose |

Contract addresses are **not** environment variables — they come from `shared/deployments/`.

## Deployment (Coolify)

`docker-compose.yaml` is the single source of truth for the deployed stack: `postgres`, `api`, `indexer`, `workers`, `frontend`. Contracts are not deployed as a service — they live on Arbitrum.

Coolify specifics:
- No `ports:` mappings. Coolify's proxy routes by domain; services use `expose:` and talk to each other over the compose network.
- **Only `frontend` gets a public domain** (`SERVICE_FQDN_FRONTEND_3000`). The API is reached through the frontend's same-origin rewrite, which is also what keeps the session cookie first-party.
- Postgres credentials use Coolify's generated `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_POSTGRES` magic variables; every service referencing them gets the same value.
- Anything `${VAR}` in the compose file appears as an editable variable in the Coolify UI. Secrets go there, never in the file.
- `indexer` must stay at one replica. Scaling it corrupts the projection.

Migrations run on `api` startup. If a migration is destructive, run it manually before deploying — there is no rollback automation.

## Testing and CI

Per-package gates, run before every commit:

| Package | Gate |
|---|---|
| contracts | `forge test` |
| backend | `dotnet test` |
| frontend | `pnpm typecheck && pnpm build` |

CI runs all three on push. A change touching `shared/` runs all three regardless of which package the diff sits in.

The two tests that catch the most real bugs are the backend's **concurrency test** (20 parallel `join-intent` calls on a one-seat circle → exactly one reservation) and the contracts' **invariant suite** (solvency and conservation under fuzzed call sequences). Write them early, keep them green.

## Product rules that constrain code

These are not styling preferences — they are the product's positioning, and violating them in a string literal undermines the whole pitch.

- The agent is **"Rules-based v1"** wherever it is named. Never imply a trained model exists.
- Never use yield / APY / interest / returns language anywhere. Wham pays no interest and must never look like it does.
- Never hide a delinquent member from a circle's public view.
- Every CTA that moves money states the amount in its own label.
- `message` fields in API errors are user-facing product copy and ship to production untouched.
- Page copy in the frontend spec §9 is written copy — use it verbatim, don't paraphrase it.
