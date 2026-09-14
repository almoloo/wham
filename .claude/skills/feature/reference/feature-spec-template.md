# Feature spec template

Copy this shape into `context/current-feature.md` above the `## History`
section, with every placeholder filled in. Delete this instructional line
when done.

---

## [Feature title]

**Packages touched:** contracts / backend / frontend / shared — list only
the ones that actually change.

**Spec sections:** the `docs/` section(s) this builds to — e.g. "contract
spec §7.7 (contribute), backend spec §6.8 (obligation generation)". If
nothing in `docs/` covers this yet, say "not yet specified — scoped below".

**Canonical interface impact:** none, or which of the five (see `CLAUDE.md`
§ The canonical interface) — `CircleParams` order, a chain enum, the
`AgentQuote` struct, `shared/deployments`, or the API error code union. If
non-none, this feature stays one atomic cross-package change (see the
feature skill's Step 2).

**Gates to run:** the per-package commands from `context/ai-interaction.md`
step 4 that apply — list them explicitly so `/complete` doesn't have to
guess (e.g. "forge test; dotnet test; pnpm typecheck && pnpm build").

### Goal

One or two sentences: what this feature does and for whom.

### In scope / out of scope

- In scope: ...
- Out of scope (deferred, and why): ...

### Build steps

Small, ordered, each independently reviewable. Cross-package features follow
contracts → shared → backend → frontend. Each step gets a checkbox and an
observable "done when":

- [ ] 1. [package] Step description.
      **Done when:** concrete, checkable outcome — a command that passes, a
      response shape that matches, a screen that renders a given state.
- [ ] 2. [package] ...
      **Done when:** ...

### Files / areas

Which files or directories this touches, per package. Flag anything in
`shared/` explicitly — those changes are the ones every package must agree
on.

### Data / contracts

Any type, event, DB column, API shape, or on-chain struct this feature
defines or changes. If it's load-bearing for a later feature, say so.

### Money handling (if applicable)

Which amounts this feature moves or displays, and confirmation that they
follow the project's money rules: decimal-string wire format, `BigInteger`/
`bigint` in memory, `numeric(78,0)` at rest, rounding direction.

### Product copy (if applicable)

New or changed user-facing strings, in both `en` and `fa`. Confirm no
yield/APY/interest language and, if the agent is named, the "Rules-based v1"
framing.

### Testing

What gets covered and how, matching the "Gates to run" above — unit tests
for new logic, integration/invariant tests for anything touching settlement
or collateral, e2e/build checks for UI.

### Notes for the AI

Anything a builder needs that doesn't fit the sections above — known
gotchas, a spec ambiguity that was resolved a specific way, an explicit
non-goal worth restating so it doesn't creep back in.
