# Current Feature

Nothing in progress — run `/feature`, `/fix`, or `/rollback` to start one.

## Template

Every feature entry should carry, before implementation starts:

- **Packages touched:** contracts / backend / frontend / shared
- **Spec sections:** which parts of `docs/` govern this (e.g. contract §7.8, backend §6.5, frontend §9.9)
- **Canonical interface impact:** none, or which of the five (see `CLAUDE.md`)
- **Gates to run:** per package, per `context/ai-interaction.md` step 4
- **Build steps:** small, reviewable, ordered

## Roadmap position

The project builds against four integration gates (`docs/wham-handoff.md` §4). Note which gate the current work sits before:

- **Gate 0 — interface freeze.** Full contract ABI committed to `shared/abi/`; frontend and backend generate against it.
- **Gate 1 — quotes verify.** Backend-format EIP-712 signature joins on Anvil; backend digest matches `hashQuote()`.
- **Gate 2 — Sepolia deployed.** `shared/deployments/421614.json` exists; both apps boot against it; `reindex` is idempotent.
- **Gate 3 — one real circle end to end.** Join → contribute → bid → settle → claim through the real UI, real API, real chain.
- **Gate 4 — seeded demo chain.** `SeedDemo.s.sol` has run; the demo checklist passes; `/agent` shows real calibration data.

## History

*(empty — first entry goes here)*
