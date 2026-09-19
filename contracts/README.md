# contracts/

Foundry project for the Wham contract system (Solidity 0.8.28, OpenZeppelin 5.7, `via_ir`, Arbitrum).

**Status: empty scaffold.** Config, dependencies, deploy/seed script skeletons, ABI export and CI are in place.
No protocol contract has been written yet — that is the work.

Read first: `docs/wham-smart-contract-spec.pdf` (highest authority in the repo), the Solidity section of
`context/coding-standards.md`, and `docs/wham-handoff.md` §3–§4.

## Layout

```
foundry.toml          spec §3 toolchain + RPC/verify config for 421614 (live) and 42161 (unused until after judging)
remappings.txt        forge-std/, @openzeppelin/contracts/
lib/                  git submodules: forge-std v1.16.2, openzeppelin-contracts v5.7.0 (+ foundry.lock)
src/                  contracts go here (interfaces/ and libraries/ subfolders ready)
test/                 <Contract>.t.sol — tests named test_<Behaviour> / test_Revert_<Condition>
script/
  Deploy.s.sol        deploy skeleton: §13.1 order as TODOs + a working deployments-JSON writer
  SeedDemo.s.sol      demo-seed skeleton: §13.3 outline as TODOs + a deployments-JSON reader
  export-abi.sh       writes ABI-only JSON to ../shared/abi/
  interfaces/         script-only interfaces (IArbSys)
../shared/abi/        ABIs, machine-written — see ../shared/README.md
../shared/deployments/  <chainId>.json, written by Deploy.s.sol
```

## Setup

```bash
git submodule update --init --recursive   # if you cloned without --recurse-submodules
cp ../.env.example .env                   # then keep only the "Contracts" block; Foundry loads contracts/.env
```

`contracts/.env` is git-ignored. Contract vars: `DEPLOYER_PK`, `AGENT_ADDRESS`, `ARB_SEPOLIA_RPC`,
`ARBISCAN_API_KEY`. Optional: `ERC8004_IDENTITY`, `ERC8004_REPUTATION`. Never commit a key.

Requires Foundry and `jq`.

## Commands

Run from `contracts/`.

| Task | Command |
|---|---|
| Compile | `forge build` |
| **Refresh `../shared/abi`** | `forge build && ./script/export-abi.sh` |
| Check `shared/abi` is current (CI does this) | `./script/export-abi.sh --check` |
| All tests | `forge test` |
| One test / one file | `forge test --match-test test_Join -vvv` / `forge test --match-path test/Settlement.t.sol` |
| Format (gate uses `--check`) | `forge fmt` / `forge fmt --check` |
| Coverage | `forge coverage` |
| Local chain | `anvil` |

Gate before every commit: `forge test && forge fmt --check`. Anything that changes an ABI, `CircleParams` field order,
an enum, an error, or the EIP-712 `AgentQuote` also changes `shared/abi` and is a cross-package change — see
`context/ai-interaction.md` § Cross-package changes.

## Deploying

`Deploy.s.sol` reads `DEPLOYER_PK` and `AGENT_ADDRESS` (and the optional ERC-8004 addresses) from the environment.

**Local (anvil):**

```bash
anvil                                                              # terminal 1; note one of the printed private keys
# terminal 2, with DEPLOYER_PK set to that key and AGENT_ADDRESS to any address:
forge script script/Deploy.s.sol --rpc-url anvil --broadcast
```

Until `Deploy.run()` calls `_writeDeploymentJson` (see the last bullet under *Open decisions*) this deploys nothing and
writes nothing — the command succeeds with "No transactions to broadcast". Once wired in, it writes
`../shared/deployments/31337.json` (git-ignored).

**Arbitrum Sepolia** (needs a funded `DEPLOYER_PK`, a real `ARB_SEPOLIA_RPC`, and `ARBISCAN_API_KEY`):

```bash
forge script script/Deploy.s.sol --rpc-url arbitrum_sepolia --broadcast --verify
forge script script/SeedDemo.s.sol --rpc-url arbitrum_sepolia --broadcast    # see "seeding on a live chain" below
```

If you see `failed to retrieve chain ID from fork endpoint … Socket operation on non-socket`, `ARB_SEPOLIA_RPC` is
empty — the `arbitrum_sepolia` alias in `foundry.toml` reads it from the environment or `contracts/.env`.

Commit the resulting `shared/deployments/421614.json` and `contracts/broadcast/Deploy.s.sol/421614/` (only the
`31337` broadcast logs are ignored). Do a dry run first by leaving off `--broadcast`.

## Open decisions left for you

Gaps and self-contradictions in the spec, found while scaffolding:

- **`startBlock`.** On Arbitrum, Solidity's `block.number` is an **L1** estimate. `Deploy._startBlock()` reads
  the L2 height from the `ArbSys` precompile on chains 42161/421614. Checked against a fork of Arbitrum Sepolia:
  `block.number` returned ~11.7M, `arbBlockNumber()` ~310M (the real L2 head). Keep it.
- **ERC-8004 registries.** The deployments JSON has `agentIdentity` / `agentReputation`, but spec §13.2 never
  deploys them. `Deploy` takes them as optional env addresses and leaves them zero if unset. Decide deploy-vs-external,
  and whether the factory asserts them (spec §9, "factory-level toggle").
- **Seeding on a live chain.** Spec §13.3 says "use `vm.warp` between rounds", but `vm.warp` only moves the
  simulated clock; on Arbitrum Sepolia it does nothing, so 14-day rounds can't be advanced. Seed a local anvil chain
  (`evm_increaseTime`), or use short round durations on Sepolia. Decide before Gate 4.
- `Deploy.run()` does **not** call `_writeDeploymentJson` yet — wire it in once the steps populate the struct, so a
  zero-address file is never written into `shared/`.

## Where to start (spec §14, week 1)

Task 1 (Foundry scaffold, CI) is done. Next:

2. Types, enums, errors, events (§4) — **publish the ABI on day one**, even with unimplemented bodies (Gate 0):
   `forge build && ./script/export-abi.sh`, commit `shared/abi/`.
3. `WhamReputation` — soulbound + on-chain `tokenURI` (§8)
4. `WhamInsurancePool` (§10)
5. `WhamCircleFactory` + clone deployment + `predictAddress` (§5)
6. `WhamCircle.initialize` + storage + view helpers (§6)
7. EIP-712 quote verification + `join` + the backend-compatibility test (§9.2) — Gate 1
8. Tests 1–12 (§12)

Then fill in `Deploy.s.sol` (§13.1) and wire the JSON writer in.
