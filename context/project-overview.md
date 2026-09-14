# wham — project overview

*This is a high-level overview for developer/AI context, not a full technical spec. The full specs live in `docs/` (contract, backend, frontend, components); refer to coding standards, AI-interaction docs, and other files under `context/` for implementation detail.*

---

## Problem Statement

Hundreds of millions of people already save through rotating savings circles — *sandogh* in Persian, also *tanda*, *iqub*, *chama*, *hui*, *susu*. A group contributes a fixed amount each round and one member takes the whole pot on rotation; after N rounds everyone has paid in exactly what they took out, but some of them got a lump sum months before they could have saved it. It works because everyone knows everyone: you know where your neighbour lives.

That breaks the moment the group grows past people who personally know each other, which is exactly where it would be most useful — diaspora communities, freelancers, and small savers in regions with weak banking infrastructure, all of whom lack easy access to formal credit. `wham` replaces the social trust that makes informal circles work with cryptographic collateral, an auction for payout order, an underwriting agent with an on-chain identity, and a shared insurance pool. Same instrument, solved trust problem.

Built for the Arbitrum Open House Singapore buildathon (Sep 13 – Oct 4, 2026), targeting Arbitrum One/Sepolia directly.

---

## Objectives

1. **Custody correctness** — members' funds live in immutable per-circle contracts with no admin pause, no upgrade path, and no owner function that can touch an active circle. All outbound transfers are pull-based; the contract's solvency and conservation invariants are enforced by fuzzed invariant tests, not by review.
2. **Default resistance** — three layers between a missed payment and anyone losing money: the defaulter's own deposit, then the shared insurance pool, then a permanent on-chain record. Plus a payout-contingent collateral top-up that converts the circle's riskiest position (the early-payout winner) from ~1% collateralised to 50%, funded from the pot they just won rather than from new capital.
3. **Legible underwriting** — the agent sizes every deposit individually from published, deterministic rules; each decision is signed, attested under its ERC-8004 identity, and later resolved against a real outcome, so its calibration is a public record rather than a claim.
4. **Rebuildable state** — the chain is the source of truth. Every row of circle state in Postgres is a projection that can be dropped and replayed from the factory deployment block.
5. **Comprehensibility** — the target user is managing household savings and may be using a wallet for the first time. Every screen states the obligation as plainly as the benefit, in English or Persian, and nothing in the product uses yield/APY framing.
6. **Single-stack deployability** — frontend, backend, workers, indexer and database ship as one Coolify project from one `docker-compose.yaml`.

---

## Features

### Circles (the core instrument)

- A circle is `N` members contributing `C` per round for `N` rounds; each round one member receives the pot. Config is fixed at deployment: token, contribution, member target, round duration, bidding window, insurance skim, max discount, payout-collateral ratio, start time, agent.
- Circles are browsable and filterable (contribution range, group size, round length, tier, eligibility, affordability), joinable publicly or by invite code.
- Lifecycle: `Forming → Active → Completed`, with `Cancelled` (never reached quorum, everyone refunded) and `Unwinding` (a default exceeded both collateral and available insurance; pro-rata settle-out) as terminal alternatives.
- Graduated sizing: starter tier caps at 8 members, standard at 12, trusted at 20. New wallets start small; bigger circles are earned.

### Deposits and underwriting

- Every member posts a refundable deposit before the circle starts. Missed contributions are deducted from it automatically at settlement — not chased, not negotiated.
- Deposit size is set **per member** by an underwriting agent registered under ERC-8004. It signs an EIP-712 quote the member submits with `join()`; the agent never transacts and pays no gas, and the contract enforces `[0.75×, 3×]` bounds independently of what the agent signs.
- Scoring is nine published, deterministic rules (completed circles, wallet age, clean streak, circle-size exposure, concurrent commitments, late payments, prior default, new wallet). Each rule that fires produces a plain-English sentence and evidence links shown to the member before they commit.
- Every decision is attested on-chain against the agent's identity and later resolved against the real outcome, producing a public predicted-vs-realised calibration scorecard per risk band.
- **The agent is a rules engine, not a learned model.** The product says so on its own transparency page.

### Payout order (discount bidding)

- Payout order is auctioned, not fixed or random. Members bid a discount — how much of the pot they'll forgo to be paid this round. Highest discount wins; bids must improve by ≥ 0.25%, which makes ties impossible on-chain.
- The forgone amount is redistributed to members who haven't been paid yet, accruing to a claimable rewards balance that also nets against future contributions.
- A member who has been paid out cannot bid. The final round has one eligible member and settles at zero discount. A round with no bids assigns the lowest-join-index unpaid member deterministically.
- **Payout-contingent top-up:** on winning, the contract raises the winner's required collateral to 50% of their remaining obligation and funds the difference from the payout itself. Early payouts are therefore smaller and better secured; the top-up returns at completion.

### Settlement and insurance

- `settleRound` is permissionless and idempotent: it determines the winner, slashes non-payers' collateral, draws from the insurance pool for any residual shortfall, computes skim/discount/net, applies the winner's top-up, credits balances, and advances the round.
- A skim (1.5%) of every pot funds a pool shared across all circles, which covers shortfalls collateral can't. The pool has a per-circle draw cap, returns partial payments rather than reverting, and **has no withdrawal function at all** — the owner cannot remove reserves.
- Members who miss a round go `Delinquent`; members whose collateral is exhausted go `Defaulted`, permanently on record.

### Reputation

- A soulbound ERC-721 bound to the wallet, with the score computed on-chain from published constants (+8 on-time, −15 late, −60 missed, +120 clean completion, −400 default), saturating at `[0, 1000]`.
- Score and completed-circle count drive tier, which drives circle-size access and deposit multipliers. Fully on-chain `tokenURI` — the token still renders if the backend is gone.
- Public per-wallet profile pages so members can check each other and share their own record.

### Notifications and scheduling

- Obligations (contributions, bid windows, payouts, deposit releases) are derived on demand from rounds and contributions, never stored — so they can't go stale after a chain event.
- Reminders scheduled at member-configurable lead times, deduplicated by key, and **cancelled the moment a payment lands**. In-app always on; email and Telegram opt-in (Telegram matters disproportionately for the target audience).
- A payment calendar across all of a member's circles, with `.ics` export.

### Transparency surfaces

- Agent page: live ERC-8004 identity read from the registry, the published rule table, the calibration chart, and a shareable page per decision showing the multiplier waterfall factor by factor.
- Insurance page: reserves over time and **every claim ever paid**, not a recent subset.
- Landing page stat strip including the number of members who have lost money, computed honestly from member ledgers.

### Planned / incomplete

- **`releaseExcessCollateral`** — mid-circle withdrawal of collateral made excess by paid-down obligation. Specified, deliberately deferred; it touches the accounting every other function depends on.
- **Collateral top-up for delinquent members** — not in contract v1; the frontend CTA is cut, not stubbed.
- **Invite-code join** — `join-intent` needs to accept and validate an invite code for private circles.
- **Learned underwriting model** — the ERC-8004 structure exists so a model can inherit the same public scorecard. Not built, not claimed.
- **Mainnet** — everything targets Arbitrum Sepolia until after judging.

---

## Technology Stack

- **Contracts:** Solidity 0.8.28, Foundry (`via_ir`, optimizer 200), OpenZeppelin 5.x. EIP-1167 minimal proxies with CREATE2, EIP-712 typed-data quotes, ERC-5192 soulbound tokens, ERC-8004 identity/reputation registries. Deployed to Arbitrum Sepolia (42161 / 421614 configs both present).
- **Backend:** .NET 9, ASP.NET Core minimal APIs with route groups and endpoint filters. PostgreSQL 16 via EF Core 9 (`numeric(78,0)` for all token amounts). Nethereum 4.x for chain access (`Nethereum.Siwe`, `Nethereum.Signer.EIP712`). Background work via `IHostedService` + a job table, not Hangfire. FluentValidation; hand-written mappers (no AutoMapper — DTO shapes are pinned to the frontend spec and must be explicit). Serilog + OpenTelemetry.
- **Frontend:** Next.js 15 App Router, TypeScript strict, Tailwind v4 with CSS-custom-property design tokens. wagmi v2 + viem v2 + RainbowKit, SIWE (EIP-4361) with the JWT in an httpOnly cookie set by a thin BFF route handler. TanStack Query v5 for server state, Zustand only for tx/toast queues. React Hook Form + Zod (schemas double as API response validators at the boundary). Recharts, date-fns, MSW for the mock layer.
- **Auth strategy:** SIWE signature → .NET verifies nonce, domain, chain, expiry and signature (with EIP-1271 fallback for smart-contract wallets) → JWT (7d) in an httpOnly cookie. Every `/me/*` endpoint derives the address from the JWT, never from a route param. There are no roles.
- **API style:** versioned REST (`/api/v1`), payload shapes fixed by the frontend spec, one error envelope with a closed code union and user-facing `message` strings.
- **Internationalisation:** English and Persian (`fa`), full RTL with Tailwind logical properties. Money always in Latin numerals. Notification templates per locale, rendered in the member's stored timezone with the UTC deadline noted.
- **Deployment:** Docker Compose to a Coolify server — `postgres`, `api`, `indexer` (single replica, always), `workers` (the only container holding signing keys), `frontend` (the only container with a public domain). Contracts deploy separately via `forge script`.
