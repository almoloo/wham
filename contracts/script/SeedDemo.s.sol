// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {Deploy} from "./Deploy.s.sol";

/// @title SeedDemo
/// @notice Gives a freshly deployed chain a lived-in state for the demo. Spec §13.3.
/// @dev Skeleton only. Run after `Deploy`; addresses are read back from `shared/deployments/<chainId>.json`,
///      never hardcoded. Written as a script because it will be run more than once.
///
///      Open question (also under "Open decisions" in contracts/README.md): §13.3 says "use vm.warp between rounds", but
///      `vm.warp` only moves the *simulated* clock. On a live chain such as Arbitrum Sepolia it changes
///      nothing, so 14-day rounds cannot be advanced there. Seeding that needs a local anvil chain
///      (`anvil_setNextBlockTimestamp` / `evm_increaseTime`) or short round durations — decide before Gate 4.
contract SeedDemo is Script {
    error NotDeployed(uint256 chainId);

    /// @notice Seeds the demo circles described in spec §13.3.
    function run() external view {
        Deploy.Deployment memory d = _loadDeployment();
        if (d.circleFactory == address(0)) revert NotDeployed(block.chainid);

        // TODO(contracts): implement spec §13.3 — seed the insurance pool BEFORE forcing the default in
        // "Weekly Ten", or the claim pays zero and the pool page shows an empty state.
        //
        // Fund 10 wallets with mock USDC and ETH
        // Deploy "Diaspora Circle #3": 8 members, 50 USDC, 14-day rounds
        //   - all 8 join with varied agent quotes (75, 100, 100, 100, 125, 150, 100, 100 USDC)
        //     -> visibly different multipliers on the agent page
        //   - rounds 0-2 settle with real bids (11%, 6%, 4% discounts)
        //   - round 2: member 5 misses -> collateral drawn, marked delinquent
        //   - round 3: leave open in bidding with two live competing bids
        // Deploy "Steady Six": 6 members, run to completion -> reputation attestations minted
        // Deploy "Weekly Ten": force a default that exhausts collateral -> one real insurance claim
        // Deploy "Ten Month Ten": forming, 4/10 filled, joinable by a judge
    }

    /// @dev Reads the file `Deploy._writeDeploymentJson` produced. Reverts if it does not exist.
    function _loadDeployment() internal view returns (Deploy.Deployment memory d) {
        string memory path =
            string.concat(vm.projectRoot(), "/../shared/deployments/", vm.toString(block.chainid), ".json");
        string memory json = vm.readFile(path);

        d.circleFactory = vm.parseJsonAddress(json, ".circleFactory");
        d.circleImplementation = vm.parseJsonAddress(json, ".circleImplementation");
        d.reputation = vm.parseJsonAddress(json, ".reputation");
        d.insurancePool = vm.parseJsonAddress(json, ".insurancePool");
        d.agentIdentity = vm.parseJsonAddress(json, ".agentIdentity");
        d.agentReputation = vm.parseJsonAddress(json, ".agentReputation");
        d.usdc = vm.parseJsonAddress(json, ".usdc");
        d.agentAddress = vm.parseJsonAddress(json, ".agentAddress");
        d.startBlock = vm.parseJsonUint(json, ".startBlock");
    }
}
