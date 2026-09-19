# Current Feature

Nothing in progress — run `/feature`, `/fix`, or `/rollback` to start one. (A
rollback is a spec *type*, not a separate command: `/fix` can write a rollback
spec, which `/implement` then applies as a guarded reverse patch.)

## Roadmap position

The project builds against four integration gates (`docs/wham-handoff.md` §4). Note which gate the current work sits before:

- **Gate 0 — interface freeze.** Full contract ABI committed to `shared/abi/`; frontend and backend generate against it.
- **Gate 1 — quotes verify.** Backend-format EIP-712 signature joins on Anvil; backend digest matches `hashQuote()`.
- **Gate 2 — Sepolia deployed.** `shared/deployments/421614.json` exists; both apps boot against it; `reindex` is idempotent.
- **Gate 3 — one real circle end to end.** Join → contribute → bid → settle → claim through the real UI, real API, real chain.
- **Gate 4 — seeded demo chain.** `SeedDemo.s.sol` has run; the demo checklist passes; `/agent` shows real calibration data.

## Remaining sub-features — "Backend — .NET 9 API"

Recorded so this breakdown isn't lost; pass each as the argument to a later
`/feature` run, in order. Note: the backend build itself belongs to a
teammate — check with them before starting the next one.

- [x] 1a. Empty solution boilerplate (Completed — see History)
- [ ] 1b. Host & config — `WHAM_ROLE` switch, `WhamOptions`, `/health/ready`,
      Serilog, `backend/Dockerfile` matching `docker-compose.yaml`
- [ ] 1c. Domain entities + EF Core persistence (schema, migrations,
      `DbContext`, naming convention, `numeric(78,0)` money columns)
- [ ] 1d. Chain indexer (event polling → projections, idempotency via
      `(chain_id, tx_hash, log_index)`, `reindex --truncate-projections`)
- [ ] 1e. Underwriting agent (scoring engine, EIP-712 quote signing,
      ERC-8004 identity/attestation)
- [ ] 1f. Keeper workers (`SettlementKeeper`, `CircleStarter`)
- [ ] 1g. REST API + SIWE auth (endpoints per frontend spec §7, error
      envelope, JWT-in-httpOnly-cookie flow)
- [ ] 1h. Notifications (email/Telegram, on-demand-derived reminders)

## Remaining sub-features — "Frontend — Design system"

Recorded so this breakdown isn't lost; pass each as the argument to a later
`/feature` run, in order. Source: Claude Design project "Wham Design System"
(`e202fb25-80ed-4ed5-a4dd-9cab854ba2d4`), read via the `DesignSync` tool.

- [x] 2b. Design tokens, Tailwind theme & fonts (Completed — see History)
- [x] 2c. Brand assets & favicons (Completed — see History)
- [x] 2d. Core primitives (Completed — see History)
- [x] 2e. Form components (Completed — see History)
- [x] 2f. Feedback components (Completed — see History)
- [x] 2g. Navigation components (Completed — see History)
- [ ] 2h. Data display components — `MoneyAmount`, `OnChainRef`, `StatTile`,
      `ListRow`, `ProgressBar`, `Table`
- [ ] 2i. Wham circle/bidding primitives — `RotationRing`, `CircleCard`,
      `ContributionSchedule`, `BidRow`, `BidTicket`, `AuctionCountdown`,
      `CollateralMeter`
- [ ] 2j. Wham agent/reputation/status primitives — `AgentRationale`,
      `ReputationScore`, `ReputationLadder`, `InsurancePoolBar`,
      `MemberRotationList`, `DueDateTile`, `RiskCallout`, `StatusChip`,
      `RiskBandChip`, `MemberIdentity`, `TierChip`, `CountdownPill`,
      `FillMeter`

## Template

Every feature entry should carry, before implementation starts:

- **Packages touched:** contracts / backend / frontend / shared
- **Spec sections:** which parts of `docs/` govern this (e.g. contract §7.8, backend §6.5, frontend §9.9)
- **Canonical interface impact:** none, or which of the five (see `CLAUDE.md`)
- **Gates to run:** per package, per `context/ai-interaction.md` step 4
- **Build steps:** small, reviewable, ordered

## History

**Backend — 1a. Empty solution boilerplate** - stand up the empty `backend/`
.NET 9 solution: six projects, wired references, no behavior yet (Completed)

**Frontend — 2a. Empty Next.js boilerplate** - stand up a clean `frontend/`
Next.js 15 App Router project, stripped of `create-next-app`'s default
content (Completed)

**Frontend — 2b. Design tokens, Tailwind theme & fonts** - port the Wham
Design System's token CSS into the app, mirror it into a Tailwind v4 `@theme`
layer, self-host Manrope/IBM Plex Mono/Kdam Thmor Pro via `next/font`, and
install `radix-ui` + `lucide-react` for the component sub-features that
follow (Completed)

**Frontend — 2c. Brand assets & favicons** - import the three brand SVGs and
generate the full browser-chrome icon set (tab favicon, Apple touch icon,
Safari pinned-tab mask icon, theme color) via Next.js metadata file
conventions (Completed)

**Frontend — 2d. Core primitives** - build the 11 `components/core/`
primitives (Icon, Divider, Skeleton, Badge, Tag, IconButton, Button, Avatar,
AvatarStack, Card, SectionHeader) as typed, Tailwind + token-driven
components with a curated static icon set (Completed)

**Frontend — 2e. Form components** - build Input, Textarea, Select,
Checkbox, RadioGroup/RadioGroupItem, and Switch, using Radix UI for
Checkbox/RadioGroup/Switch to fix a real keyboard-focus gap in the source
prototype, keeping Select native per the design system's own stated intent
(Completed)

**Frontend — 2f. Feedback components** - build Dialog, Toast, Banner,
Spinner, Tooltip, and EmptyState, using Radix UI for Dialog and Tooltip to
fix real focus-trap/escape/aria-describedby gaps, keeping Toast
presentational-only since no toast-triggering system exists yet (Completed)

**Frontend — 2g. Navigation components** - build Tabs, SegmentedControl,
Breadcrumbs, Pagination, and Menu, using Radix UI (Tabs, ToggleGroup for
SegmentedControl, DropdownMenu) to fix real keyboard-navigation gaps in
the source prototype (Completed)
