# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Read the specs before you write code

`docs/` holds four specs that define this project completely. They are build instructions, not background reading, and they contain decisions that are already settled.

- Before starting work in a package, read that package's spec section for the area you're touching.
- **Authority order:** contract spec → backend spec → frontend spec. Within the backend and frontend specs, the **§0 addendum overrides the body**.
- If the spec and a request conflict, say so and ask — don't silently pick one.
- If the spec is genuinely silent on something, that's a decision to surface, not to make quietly. Note it in `current-feature.md`.

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** — Document the feature in @context/current-feature.md, including **which packages it touches** (contracts / backend / frontend / shared).
2. **Branch** — Create new branch for feature, fix, etc
3. **Implement** — Implement the feature/fix that I create in @context/current-feature.md
4. **Test** — Verify it works by actually exercising it, then run the gates for **every package the change touches**:
   - contracts: `forge test`, plus `forge fmt --check`
   - backend: `dotnet build`, `dotnet test`, `dotnet format --verify-no-changes`; hit affected endpoints with a REST client/curl against a local DB
   - frontend: `pnpm typecheck`, `pnpm lint`, `pnpm build`, plus `pnpm test` where the change has logic tests; click through the affected screens
   - anything touching `shared/`: run **all three** packages' gates regardless of where the diff sits
5. **Iterate** — Iterate and change things if needed
6. **Commit** — Only after build passes and everything works
7. **Merge** — Merge to main
8. **Delete Branch** — Delete branch after merge
9. **Review** — Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until the build and tests pass. If build or tests fail, fix the issues first.

## Cross-package changes

A change to the canonical interface (see `CLAUDE.md` § The canonical interface) is **one branch, one commit, all affected packages** — never three separate PRs that are briefly incompatible.

- Changing a contract's ABI means: rebuild `shared/abi`, regenerate frontend types, regenerate backend event DTOs, update both mapping tables, in the same change.
- Changing an API payload shape means the frontend spec §7 is now wrong — update the doc in the same commit or the next agent builds against a lie.
- Changing a contract enum, error, or `CircleParams` field order touches all three packages by definition. If you think it doesn't, check again.
- Adding an API error code is a change to the backend union **and** the frontend spec §6.10.

When in doubt about whether something is a canonical interface: if two packages would both have to know about it to agree, it is.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix/[fix]**, etc. Prefix with the package when the change is scoped to one: **feature/backend-[feature]**, **fix/contracts-[fix]**. Cross-package changes get no prefix. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.) with a package scope: `feat(backend): …`, `fix(contracts): …`, `chore(shared): …`
- Keep commits focused (one feature/fix per commit) — except for cross-package interface changes, which must land together
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear
- **Never work around a failing chain interaction by mocking it in production code.** If a contract call reverts or a signature doesn't verify, the mismatch is the bug — find it. An EIP-712 mismatch in particular will look like a signature problem and be an encoding problem.

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase
- **Never hardcode a contract address or copy an ABI fragment.** Both come from `shared/`.
- **Never write projected circle state from an HTTP handler.** The indexer is the only writer; this is what keeps the projection rebuildable.
- **Never widen a money type.** If a `BigInteger`/`bigint` is inconvenient somewhere, the inconvenience is the correct outcome.

## Code Review

Review AI-generated code periodically, especially for:

- **Security** — auth checks, input validation, injection risks, secrets handling; and on-chain: reentrancy, checks-effects-interactions ordering, access control on every external function, unbounded loops
- **Performance** — N+1 queries, missing indexes, unnecessary DB round-trips, uncached RPC calls on hot paths
- **Logic errors** — edge cases, race conditions; rounding direction on money; off-by-one on round indices
- **Money correctness** — no float anywhere in the path, rounding up on owed / down on receivable, preview math identical to settlement math
- **Interface drift** — `CircleParams` field order, enum mapping tables, EIP-712 struct, error code union, anything sourced from `shared/`
- **Patterns** — matches existing codebase?

## Product copy is code

Strings in this project carry the product's positioning and some of them are load-bearing for trust. Treat them with the same care as logic:

- API `message` fields and frontend spec §9 page copy are **written product copy** — use verbatim, don't paraphrase.
- The underwriting agent is described as "Rules-based v1" wherever named. Never imply a trained model.
- Never introduce yield / APY / interest / returns language anywhere in the product.
- Every CTA that moves money states the amount in its own label.
- New user-facing strings need both `en` and `fa`.
