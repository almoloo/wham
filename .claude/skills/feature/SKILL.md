---
name: feature
description: Turn a feature the user describes as an argument into a buildable spec. Checks it against the governing docs (docs/ specs, context/project-overview.md) and current-feature.md history for duplicates, conflicts, or already-decided scope, sizes it, keeps canonical-interface changes atomic across packages while splitting everything else that's too big, writes small reviewable build steps to context/current-feature.md, then red-teams its own draft — including money handling, chain-enum mapping, and cross-package interface drift — before stopping at a review gate. Use when the user runs /feature with a feature description, asks to add and start a new feature, or asks to spec out or break down a feature they just described.
---

# feature — turn a described feature into a buildable spec

Where this sits in the workflow:

    docs/ specs + context/project-overview.md  ->  [this skill]  ->  build  ->  /audit  ->  /complete
    (governing truth)                              (the spec for                (finds       (ships
                                                      one feature)                 regressions) it)

This is a three-package monorepo (`contracts/`, `backend/`, `frontend/`, plus
machine-written `shared/`). Some features live entirely in one package; some —
anything touching the canonical interface — must move through more than one at
once. Sizing that correctly is this skill's main job.

It expects `context/project-overview.md`, `context/current-feature.md`,
`context/coding-standards.md`, `context/ai-interaction.md`, `docs/` (the four
construction specs + `wham-handoff.md`), and root `CLAUDE.md` to already exist.

## Input

A feature description passed as the argument — e.g. `/feature "invite-code join
for private circles"` or `/feature add the withdrawRewards action card`.

**An argument is required.** If `/feature` is run with nothing after it, ask the
user what feature to build (one question) rather than guessing.

## Step 1 — check the description before speccing it

Use this path for a new product capability, not a bug or small unplanned change
— those still belong in `/fix`.

1. Read `context/current-feature.md`'s `## History` section (one line per
   feature ever specced, oldest at top). Check it for a near-duplicate or
   overlapping feature. If a close match exists, surface it and confirm with
   the user whether this is genuinely new scope, a variation, or a mistaken
   re-request, before drafting anything.
2. **Check whether this is already decided.** Most of what this project needs
   is specified in `docs/wham-smart-contract-spec.pdf`,
   `docs/wham-backend-construction-spec.pdf` (§0 addendum first),
   `docs/wham-frontend-construction-spec.pdf` (§0 addendum first), and
   `docs/wham-components.md`. If the described feature is already covered
   there, don't re-decide it — cite the governing section(s) in the spec and
   build to what they already say. If the description conflicts with a spec
   decision (e.g. asks for an agent transaction instead of a signed quote, or
   a different collateral formula), say so explicitly and confirm with the
   user which wins before drafting — the specs are authoritative
   (contract → backend → frontend) and a casual request doesn't silently
   override them.
3. Check whether the feature materially changes the product direction,
   mechanism design, canonical interface, or deployment topology described in
   `context/project-overview.md` or `CLAUDE.md`. If so, propose the exact
   edits and stop for approval before writing them. An incremental feature
   that fits the existing overview needs no edits here.
4. After approval (or immediately, if none was needed), proceed to size the
   feature.

State which feature you're building, and which spec section(s) govern it (or
"not yet specified — scoping from scratch"), before going further.

## Step 2 — size it, and split if too big

Decide how big the feature is. Two different splitting rules apply depending
on whether the feature touches the **canonical interface** (see `CLAUDE.md` §
The canonical interface: `CircleParams` field order, chain enum mappings, the
EIP-712 `AgentQuote`, `shared/deployments/<chainId>.json`, or the API error
code union).

**If it touches the canonical interface:** keep it as **one feature**, even
though it spans packages. `context/ai-interaction.md` requires these to land
in one branch, one commit — splitting it into a contracts PR and a backend PR
that are briefly incompatible is exactly what that rule exists to prevent.
Size it by sequencing build steps in dependency order instead: contracts
first (ABI + tests), then `shared/` artifacts, then backend, then frontend —
each step still small and independently reviewable, just not independently
mergeable.

**If it's confined to one package (or several packages that don't share an
interface change):**
- **Small enough to build and review as one unit** → one spec. Continue to
  Step 3.
- **Too big for one reviewable spec** → split it. Propose a short list of
  sub-features in chat (title + one line each, noting which package each
  lives in), let the user adjust it, then record that breakdown at the top of
  `context/current-feature.md` under a "Remaining sub-features" list (e.g.
  `4a`, `4b`, `4c` ...). Spec only the **first** sub-feature now.

Two levels of breakdown — don't confuse them:

- **Sub-features** — each big enough to stand alone: its own branch, spec,
  review-and-merge cycle, and archive entry.
- **Build steps** (in the spec, Step 3) — small diffs *within* one feature or
  one cross-package interface change.

Worked example, confined to one package — "circle browse filters" splits:

    Remaining sub-features:
    - [ ] 7a. [frontend] Filter rail UI + URL search-param state
    - [ ] 7b. [frontend] "Only circles I can afford" balance check
    - [ ] 7c. [backend] eligibleOnly query param on GET /v1/circles

Worked example, canonical-interface change — "invite-code join" stays one
feature with ordered steps:

    - [ ] 1. [contracts] none needed — invite codes are backend-only
    - [ ] 2. [backend] accept inviteCode in join-intent, validate against
             circles.invite_code before the capacity check
    - [ ] 3. [frontend] pass inviteCode through the join flow from the invite link

This sizing call is the skill's job, not the user's one-line description —
that's exactly why the description can stay high-level.

## Step 3 — write the spec

Write a full spec to `context/current-feature.md` (create `context/` if
needed) following `reference/feature-spec-template.md`. Fill every section,
including the fields the template's own header already establishes as
required: which packages this touches, which spec sections govern it,
whether it changes the canonical interface, and which per-package gates apply
— not just goal/scope/steps/testing.

**Preserve the History section.** If `context/current-feature.md` already
exists, read it first and keep its `## History` section intact. Append one
new line at the bottom: `**title** - short description (Current)`. If the
file doesn't exist yet, create it with a `## History` section containing
just this line.

**Visual or replication features need a reference.** If the feature is "make
this screen look like X" — matching a Claude Design mockup or
`docs/wham-components.md`'s specified anatomy for a bespoke component — link
the relevant mockup or component entry from the spec's Design reference
section rather than describing it from prose alone.

This is a draft. Don't present it yet — critique it first.

## Step 4 — red-team the draft, then tighten

Before the user reads it, try to break it. Run the draft against these
questions:

- **Coverage.** What does this feature need that no step delivers? Push on
  unhappy paths: empty/missing/malformed input, error/loading/empty states,
  the first-run case, failure of anything external it calls (RPC, the agent
  quote, S3-equivalent, etc.).
- **Step size.** Would any step's diff be too big to read in one sitting? If
  so, split it.
- **Order.** Does each step leave the app working, and depend only on earlier
  steps? For a cross-package feature, does it strictly follow contracts →
  shared → backend → frontend, never the reverse?
- **Contracts (the data kind, not just the Solidity kind).** Is any type,
  route, event, or stored shape that a later feature will touch left
  undefined here? Lock it now and flag it load-bearing.
- **Canonical interface.** Does this feature touch `CircleParams` order, a
  chain enum, the `AgentQuote` struct, an address/ABI source, or an API error
  code? If yes, is it explicitly marked as such in the spec, and does the
  step sequence keep contracts/backend/frontend consistent within one commit?
- **Money handling.** Does this feature move, display, or compute a token
  amount? If so, does the spec call out base-unit decimal strings on the
  wire, `BigInteger`/`bigint` in memory, `numeric(78,0)` at rest, and the
  correct rounding direction (up on owed, down on receivable)?
- **Product copy.** Does this feature add or change user-facing text? If so,
  does the spec require both `en` and `fa`, avoid yield/APY/interest
  language, and — if it names the underwriting agent — call it "Rules-based
  v1"?
- **Scope honesty.** Is anything creeping in that belongs to a later feature?
  Is anything pushed to "out of scope" that this feature actually can't ship
  without?
- **Done-whens.** Is each one observable and checkable, or a vague "it
  works"? Make it concrete — e.g. "POST /v1/circles/{id}/join-intent returns
  QuoteExpired copy when the quote TTL is exceeded", not "join flow handles
  expiry".
- **Testing.** Does the predicted coverage match each touched package's real
  gate: `forge test` (+ invariant coverage for anything touching settlement
  or collateral), `dotnet test` (scoring/EIP-712 changes need table-driven
  tests), `pnpm typecheck && pnpm build` (+ Vitest for new logic)?

Apply the fixes to `current-feature.md`. Then stop and present the spec,
leading with a short **"what the critique changed"** note — the splits,
gaps, or scope cuts you made (or "nothing — the draft held up"). That note is
the point: it shows the gate working before a line of code is written.

Tell the user to review and adjust. This skill plans; it never starts
building.

## Rules the spec must follow

- **Small, reviewable steps.** Each step ends with something working and a
  diff small enough to read in full.
- **Build in dependency order**: contracts → shared → backend → frontend for
  anything crossing packages; each step leaves the app working.
- **Lock data contracts early**, especially anything touching the five
  canonical interfaces in `CLAUDE.md`.
- **Flag package and convention** from `context/coding-standards.md` — e.g.
  which package owns a type, whether a write belongs in the indexer only,
  whether a money field needs the `numeric(78,0)` treatment.
- **Scope honestly.** State what is deferred so the feature stays contained.

## When a (sub-)feature is done

Run `/complete` — it verifies the done-whens, runs the per-package gates,
offers a final `/audit` pass, and handles commit/merge/branch cleanup and the
`current-feature.md` history update. Don't hand-edit the History line
yourself; `/complete` owns that step so it stays consistent with what
actually shipped (including any fixes an audit pass made along the way).

## Formatting

Format the output to match `context/ai-interaction.md`: concise, scannable
markdown, with lists for enumerations and tables for matrices rather than
dense paragraphs.
