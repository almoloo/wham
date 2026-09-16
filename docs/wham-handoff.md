# Wham — Build Handoff

How to take the three construction specs from zero to a working system with Claude Code. This file is the map; the specs are the territory. Drop it in the repo root.

---

## 1. The documents and their authority

| Doc | Governs | Authority |
|---|---|---|
| `wham-smart-contract-spec.pdf` (v1.0) | Contracts, mechanism design, on-chain interfaces | **Highest.** Written last; its §1 corrections and §2.5 mechanism supersede the others |
| `wham-backend-construction-spec.pdf` (v1.1) | .NET services, DB, indexer, agent, keeper | Its §0 addendum aligns it with the contract spec |
| `wham-frontend-construction-spec.pdf` (v1.1) | Next.js app, pages, UX copy, tx flows | Its §0 addendum aligns it with the contract spec |
| `wham-components.md` | Bespoke UI components (feeds Claude Design) | Visual authority for component anatomy |

Reading rule for any agent: **addendum (§0) beats body; contract spec beats everything.** API payload *shapes* remain fixed by Frontend §7 — the backend implements those shapes with the addendum's reinterpretations.

---

## 2. Repository layout

One monorepo. Claude Code works dramatically better when it can see the contract ABI, the backend DTOs, and the frontend types in one context — cross-package drift is the failure mode of this project, and a monorepo makes it visible.

```
wham/
├── CLAUDE.md                    ← §6 of this file
├── docs/                        ← the four documents above
├── contracts/                   ← Foundry        (Solidity teammate + Claude Code)
├── backend/                     ← .NET 9         (teammate + Claude Code)
├── frontend/                    ← Next.js 15     (you + Claude Code)
├── shared/
│   ├── abi/                     ← built by `forge build`, committed, consumed by both apps
│   └── deployments/
│       ├── 421614.json          ← written by the deploy script, read by both apps
│       └── 42161.json
└── .github/workflows/           ← contracts: forge test · backend: dotnet test · frontend: typecheck + build
```

`shared/` is machine-written, human-read, and the only sanctioned way addresses and ABIs cross package boundaries. Nobody hand-copies an address into a config file, ever.

---

## 3. The canonical interface — the five things that must never drift

These cross all three packages. Each has one owner; the others consume.

### 3.1 `CircleParams` — owner: contracts

Field order is the wire format. Backend emits `deployParams` in this order; frontend passes it through verbatim.

```
token, contributionPerRound, memberTarget, roundDuration, biddingDuration,
baseCollateralBps, insuranceSkimBps, maxDiscountBps, payoutCollateralBps,
biddingEnabled, startsAt, agent          (+ salt, passed separately to createCircle)
```

### 3.2 Enums — owner: contracts; backend and frontend map explicitly

```
CircleState:  0 Forming · 1 Active · 2 Completed · 3 Unwinding · 4 Cancelled
MemberState:  0 None · 1 PendingCollateral · 2 Active · 3 PaidOut · 4 Delinquent
              · 5 Defaulted · 6 Completed · 7 Exited      ← None=0 shifts everything
RoundState:   0 Upcoming · 1 Bidding · 2 Funding · 3 Settled · 4 Covered
```

Never cast a chain ordinal into an app enum. Map, and throw on unmapped values (Backend §0.4).

### 3.3 The EIP-712 `AgentQuote` — owner: contracts

```
Domain:  name "WhamAgent" · version "1" · chainId · verifyingContract = circle address
Struct:  AgentQuote(address subject, address circle, uint256 collateralRequired,
                    uint8 riskBand, uint256 nonce, uint64 expiresAt)
```

The contract exposes `hashQuote(AgentQuote) → bytes32`. The backend's integration suite asserts digest equality against it (Backend §0.8); the contract suite asserts a backend-format signature joins successfully (Contract §9.2). **Both tests exist before anything else depends on quotes.**

### 3.4 `deployments/<chainId>.json` — owner: contracts deploy script

```json
{
  "chainId": 421614,
  "circleFactory": "0x…", "circleImplementation": "0x…",
  "reputation": "0x…", "insurancePool": "0x…",
  "agentIdentity": "0x…", "agentReputation": "0x…",
  "usdc": "0x…", "agentAddress": "0x…",
  "startBlock": 91450000
}
```

Frontend's `CONTRACTS[chainId]` and backend's `Wham:Contracts` + `Indexer:StartBlock` are generated or loaded from this file.

### 3.5 API error codes — owner: backend, fixed by Frontend §6.10

Adding a code is a two-document change. `message` is user-facing copy, always.

### The money rules (all packages, no owner because no exceptions)

Amounts are uint256 base-unit **decimal strings** on the wire, `BigInteger`/`bigint` in memory, `numeric(78,0)` at rest. Round **up** on amounts owed, **down** on amounts receivable. No floats, no `long`, anywhere, ever.

---

## 4. Build sequencing and integration gates

The three packages build in parallel against mocks; the gates are where they meet. A gate is binary — it passed or the next phase doesn't start.

**Gate 0 · Day 1 — interface freeze.**
Contracts publish the full ABI (types/errors/events compiled, bodies may revert). `shared/abi/` commits. Frontend runs `wagmi generate`; backend generates event DTOs. From this moment interface changes are PRs that touch all three packages at once.

**Gate 1 · End of week 1 — quotes verify.**
Contract test: backend-format signature joins on Anvil. Backend test: digest equality via `hashQuote`. This is the highest-risk integration in the project (a mismatch reverts only after the user pays gas), which is why it is week 1 and not week 3.

**Gate 2 · Mid week 2 — Sepolia deployment.**
`deployments/421614.json` exists; both apps boot against it; backend indexer replays from `startBlock` and `reindex` produces identical state twice.

**Gate 3 · End of week 2 — one real circle end to end.**
Join (real quote) → contribute → bid → settle → claim, driven through the real frontend against the real backend against Sepolia. Frontend drops MSW for circle flows.

**Gate 4 · Week 3 — the seeded demo chain.**
`SeedDemo.s.sol` (Contract §13.3) has run; the frontend demo checklist (Frontend §11.1) passes against it; `/agent` shows real calibration data from resolved decisions.

Weekly plans within each package: Frontend §11 · Backend §14 · Contract §14.

---

## 5. Claude Code kickoff prompts

Paste one per package to start each build. Each assumes the monorepo layout and `docs/` in place.

### 5.1 Contracts

> Read `docs/wham-smart-contract-spec.pdf` in full. Build the contract system in `contracts/` with Foundry exactly as specified: §4 types/errors/events first, then WhamReputation (§8), WhamInsurancePool (§10), WhamCircleFactory (§5), then WhamCircle (§6–7) with settleRound implemented in the §7.8 order. Every function follows its preconditions/effects/events/reverts block; the constants in §4.3 and the invariants in §11.2 are non-negotiable. Write the §9.2 EIP-712 compatibility test before any other test that touches quotes, and expose `hashQuote` as specified. Commit built ABIs to `../shared/abi/` and make the deploy script write `../shared/deployments/<chainId>.json` in the §3.4 handoff shape. Work through the §14 build order; run `forge test` after every task; do not proceed past a failing test. Test matrix §12 rows 1–58 all exist before you call this done.

### 5.2 Backend

> Read `docs/wham-backend-construction-spec.pdf` in full — §0 addendum first, it overrides parts of the body — plus §7 of `docs/wham-frontend-construction-spec.pdf`, which fixes every payload shape you must return, and §4 + §9 of the contract spec for the on-chain interfaces. Build in `backend/` per the §2.3 solution layout, in the §14 order. Hard rules: the indexer is the only writer of projected circle state (§6.6); amounts are BigInteger/`numeric(78,0)` end to end; enums map explicitly per addendum §0.4; error responses use the §3.1 envelope with codes from Frontend §6.10 only. Consume ABIs from `../shared/abi/` and addresses from `../shared/deployments/`. The scoring engine (§7) is built table-driven with its tests before anything consumes it, and the EIP-712 digest-equality test (addendum §0.8) passes at Gate 1. Seed data must match the Frontend §7 mock fixtures.

### 5.3 Frontend

> Read `docs/wham-frontend-construction-spec.pdf` in full — §0 addendum first, it changes the join flow, adds the payout top-up to three components, and adds `withdrawRewards`. Build in `frontend/` per §5, in the §11 order: types and Zod schemas (§6) before any UI, then the MSW mock layer from every §7/§8 fixture so the whole app runs before the backend exists (`NEXT_PUBLIC_USE_MOCKS` switches). Page copy in §9 is written product copy — use it verbatim, don't paraphrase it. Contract types come from `wagmi generate` against `../shared/abi/`; addresses from `../shared/deployments/`. The §10 cross-cutting rules (tx lifecycle, money formatting, empty/error states, no auto-chained wallet prompts) apply to every surface. For visual components, `docs/wham-components.md` defines anatomy and states — follow its conventions table. SIWE per §3, including the account-switch handler before any page work.

### 5.4 Standing review prompt (either of you, weekly)

> Cross-check `contracts/`, `backend/`, and `frontend/` against docs §3 canonical interface in `CLAUDE.md`: CircleParams field order everywhere it is serialized, enum mapping tables vs the Solidity enums, EIP-712 struct vs `AgentQuoteMessage` vs the frontend's typed-data builder, and every address/ABI import traceable to `shared/`. Report drift as a table: file, what drifted, which document wins.

---

## 6. `CLAUDE.md` for the repo root

```markdown
# Wham

On-chain rotating savings circles (ROSCA) with collateral, discount-bid payout
auctions, an ERC-8004 underwriting agent, and a shared insurance pool.
Arbitrum buildathon project — three weeks, two developers.

## Authority order
1. docs/wham-smart-contract-spec.pdf        (mechanism + on-chain truth)
2. docs/wham-backend-construction-spec.pdf  (§0 addendum overrides its body)
3. docs/wham-frontend-construction-spec.pdf (§0 addendum overrides its body)
Payload shapes: frontend spec §7. UI component anatomy: docs/wham-components.md.

## Hard rules — apply to every change
- Money: base-unit decimal strings on the wire, BigInteger/bigint in memory,
  numeric(78,0) at rest. Round up on amounts owed, down on amounts receivable.
  No floats, no long/number for money, anywhere.
- Chain enums are mapped explicitly, never cast (MemberState has None=0).
- The backend indexer is the ONLY writer of projected circle state.
- Addresses/ABIs enter apps only via shared/deployments/ and shared/abi/.
- API errors use the fixed envelope; `message` is user-facing product copy.
- All outbound token transfers in contracts are pull-based.
- The agent is "Rules-based v1" everywhere it is named. Never imply a trained
  model. Never use yield/APY/interest language anywhere in the product.
- CircleParams field order is the wire format across all three packages.

## Layout
contracts/ (Foundry) · backend/ (.NET 9) · frontend/ (Next.js 15) ·
shared/{abi,deployments} (machine-written) · docs/ (the specs)

## Verify before claiming done
contracts: forge test    backend: dotnet test    frontend: pnpm typecheck && pnpm build
Integration gates and weekly sequencing: docs/wham-handoff.md §4.
```

---

## 7. What is deliberately *not* in the specs

So nobody goes hunting: the homepage visual design lives in Claude Design (only its copy is in Frontend §9.1); the pitch deck and submission video are unwritten; secrets/keys are env-only per Backend §2.4; and mainnet deployment is out of scope — everything targets Arbitrum Sepolia until after judging.
