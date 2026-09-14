---
name: complete
description: Closes out a finished feature or fix — verifies every build step's done-when against the real code, runs the per-package gates, offers a final /audit pass, then (only with explicit permission at each point) commits with a conventional message, merges to main, and deletes the branch. Updates context/current-feature.md's Current entry to Completed in History, folding in any audit findings, and resets the working spec. Use when the user says a feature is done, asks to commit/merge, or runs /complete.
---

# complete — close out a finished feature

Where this sits in the workflow:

    build  ->  /audit (optional but offered)  ->  [this skill]  ->  next /feature
                                                  (verify, commit,
                                                   merge, record)

## Precondition

`context/current-feature.md` must have a spec with a `(Current)` History
line. If it doesn't, tell the user there's nothing to complete and stop —
don't guess at what "done" refers to.

## Step 1 — verify the done-whens for real

Go through the current spec's build-step checklist. For each step:

- Confirm it's checked off (`- [x]`) in `current-feature.md`.
- **Independently confirm its "done when" is actually true in the code** —
  don't trust a prior checkmark without looking. Read the relevant file, or
  run the specific command the done-when describes.

If any step is unchecked, or checked but not actually true, stop and report
exactly what's outstanding. Do not proceed to gates or commit on a feature
that isn't really finished — that's the entire point of this being a
separate step from `/feature`.

## Step 2 — run the gates

Run every gate listed in the spec's "Gates to run" field (or, if that
field is missing, infer from "Packages touched"):

```bash
# contracts
forge test
forge fmt --check

# backend
dotnet build
dotnet test
dotnet format --verify-no-changes

# frontend
pnpm typecheck
pnpm lint
pnpm build
pnpm test          # where the change has logic tests
```

If the feature touched `shared/` or any canonical interface, run **all
three** regardless of which package's files changed — that's the rule in
`context/ai-interaction.md`.

If a gate fails: stop, report the failure, fix it if it's small and
obviously part of finishing this feature, or ask if it looks like a
separate problem. Do not proceed to Step 3 on a red gate.

## Step 3 — offer a final review

If the feature touched anything in the canonical interface (see
`CLAUDE.md`), money handling, contract settlement/collateral logic, or the
agent's signing path, **recommend running `/audit` scoped to this branch**
before continuing, and explain why in one line. For smaller, contained
features, mention it's available but don't insist.

If the user declines, proceed. If `/audit` already ran earlier in this
session against this feature, don't ask again — check
`current-feature.md`'s "Audit findings" note (see the audit skill) and
carry it into Step 6 instead.

## Step 4 — commit (ask first)

Never commit without explicit go-ahead. Propose a conventional commit
message before asking:

- Scope by package: `feat(contracts): …`, `fix(backend): …`,
  `chore(frontend): …`. For a cross-package canonical-interface change that
  can't be scoped to one package, omit the scope: `feat: …`.
- Summarise from the spec's build steps, not a diff dump — one line per
  logical change, keeping it to what actually shipped.
- **Never** include an AI-attribution line ("Generated with Claude" or
  similar) — this project's `context/ai-interaction.md` forbids it
  explicitly.

Wait for explicit confirmation. If the user wants changes to the message,
revise and ask again — don't commit on an implied yes.

## Step 5 — merge and clean up (ask first, separately)

Ask before merging to `main`. On confirmation, merge.

Ask before deleting the branch. On confirmation, delete it (and the remote
branch if one exists). These are two separate yes/no moments, not one
combined assumption — a "yes, commit" is not a "yes, also merge and
delete."

## Step 6 — update `context/current-feature.md`

1. Change this feature's `## History` line from `(Current)` to
   `(Completed)`. If an "Audit findings" note exists under the spec from
   Step 3, fold its material findings concisely into this History line —
   match the project's existing pattern: *"…; a post-build audit caught
   (P1) X, fixed by Y (Completed)"*.
2. If this was one of several sub-features under a "Remaining
   sub-features" list, check it off there. If sub-features remain, name the
   next one and suggest `/feature` with it as the argument.
3. Clear the working spec body — replace everything above `## History` with
   `Nothing in progress — run /feature, /fix, or /rollback to start one.`
   The History section itself is permanent; never trim or summarise past
   entries.

## Step 7 — throwaway reference cleanup

If this feature used `reference/` screenshots or `prototypes/` mockups
(see the feature skill), check whether any other in-progress or upcoming
sub-feature still needs them. If not, ask whether to delete them — never
delete without clarification, per `context/ai-interaction.md`.

## Step 8 — summary

Print a short close-out: what shipped (the feature title + one line), which
gates passed, whether an audit ran and what it found, and — if sub-features
remain — what's next.

## Formatting

Match `context/ai-interaction.md`: concise, scannable, no unnecessary
preamble before the verification results.
