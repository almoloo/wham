# shared/

Machine-written, human-read. This is the only sanctioned way contract ABIs and addresses cross a package
boundary. **Never hand-edit or hand-copy anything in here** — if you find yourself typing `0x`, regenerate instead.

| Path | Written by | Read by |
|---|---|---|
| `abi/<Contract>.json` — ABI-only JSON array per contract | `contracts/script/export-abi.sh` (after `forge build`) | frontend (`pnpm wagmi generate`), backend (event DTOs) |
| `deployments/<chainId>.json` — addresses + `startBlock` | `contracts/script/Deploy.s.sol` | frontend `CONTRACTS[chainId]`, backend `Wham:Contracts` + `Indexer:StartBlock` |

- Both folders are empty until the contracts exist and have been deployed. `421614.json` (Arbitrum Sepolia) and
  `42161.json` (Arbitrum One, unused until after judging) are committed once produced by a real deploy.
- `31337.json` (local anvil) is git-ignored: it is only ever valid on someone's own machine.
- A change to anything in here touches all three packages: run the contracts, backend and frontend gates.
