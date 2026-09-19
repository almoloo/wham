// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {IArbSys} from "./interfaces/IArbSys.sol";

/// @title Deploy
/// @notice Deploys the Wham contract system and writes `shared/deployments/<chainId>.json`.
/// @dev Skeleton only — the deployment steps below are TODOs until the contracts exist. Spec §13.
///      Required env: `DEPLOYER_PK`, `AGENT_ADDRESS`. Optional: `ERC8004_IDENTITY`, `ERC8004_REPUTATION`.
contract Deploy is Script {
    uint256 internal constant ARBITRUM_ONE = 42_161;
    uint256 internal constant ARBITRUM_SEPOLIA = 421_614;
    address internal constant ARB_SYS = address(100);

    /// Everything in the deployments JSON except `chainId`, which is `block.chainid`.
    /// Consumed by frontend `CONTRACTS[chainId]` and backend `Wham:Contracts` + `Indexer:StartBlock`
    /// (handoff §3.4), so renaming a field is a cross-package change.
    struct Deployment {
        address circleFactory;
        address circleImplementation;
        address reputation;
        address insurancePool;
        address agentIdentity;
        address agentReputation;
        address usdc;
        address agentAddress;
        uint256 startBlock;
    }

    /// @notice Runs the full deployment in spec §13.1 order.
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");

        Deployment memory d;
        d.agentAddress = vm.envAddress("AGENT_ADDRESS");
        // TODO(contracts): spec §13.1 never deploys the ERC-8004 registries. Decide deploy-vs-external;
        // until then they are optional inputs and stay address(0) when unset.
        d.agentIdentity = vm.envOr("ERC8004_IDENTITY", address(0));
        d.agentReputation = vm.envOr("ERC8004_REPUTATION", address(0));

        // Taken before broadcasting so it can only be at or before the factory's deploy block: the indexer
        // replays from here, and a later value would silently skip the factory's first events.
        d.startBlock = _startBlock();

        vm.startBroadcast(pk);

        // TODO(contracts): deploy in this order (spec §13.1) and fill `d`.
        //  1. MockUSDC                      (testnet only)                       -> d.usdc
        //  2. WhamCircle implementation     (call _disableInitializers() in its constructor)
        //                                                                        -> d.circleImplementation
        //  3. WhamReputation                (factory set post-deploy)            -> d.reputation
        //  4. WhamInsurancePool             (factory set post-deploy)            -> d.insurancePool
        //  5. WhamCircleFactory(implementation, reputation, insurancePool)       -> d.circleFactory
        //  6. reputation.setFactory(factory)     one-time, then immutable
        //  7. insurancePool.setFactory(factory)  one-time, then immutable
        //  8. factory.setAllowedToken(usdc, true)
        //  9. factory.setDefaultAgent(d.agentAddress)
        // 10. insurancePool.fund(seedAmount)   see spec §13.3: seed before forcing the "Weekly Ten" default
        // Step 11 (Arbiscan verification) is the `--verify` flag on `forge script`, not code.

        vm.stopBroadcast();

        // TODO(contracts): call `_writeDeploymentJson(d)` here once the steps above populate `d`.
        // Deliberately not called yet: with nothing deployed it would write a file of zero addresses
        // into shared/, which the frontend and backend would then trust.
    }

    /// @dev Writes to `shared/deployments/<block.chainid>.json`.
    function _writeDeploymentJson(Deployment memory d) internal {
        _writeDeploymentJson(d, _deploymentPath());
    }

    /// @dev Path is a parameter so it can be exercised without touching the real deployments file.
    function _writeDeploymentJson(Deployment memory d, string memory path) internal {
        string memory key = "deployment";
        string memory json = vm.serializeUint(key, "chainId", block.chainid);
        json = vm.serializeAddress(key, "circleFactory", d.circleFactory);
        json = vm.serializeAddress(key, "circleImplementation", d.circleImplementation);
        json = vm.serializeAddress(key, "reputation", d.reputation);
        json = vm.serializeAddress(key, "insurancePool", d.insurancePool);
        json = vm.serializeAddress(key, "agentIdentity", d.agentIdentity);
        json = vm.serializeAddress(key, "agentReputation", d.agentReputation);
        json = vm.serializeAddress(key, "usdc", d.usdc);
        json = vm.serializeAddress(key, "agentAddress", d.agentAddress);
        json = vm.serializeUint(key, "startBlock", d.startBlock);
        vm.writeJson(json, path);
    }

    function _deploymentPath() internal view returns (string memory) {
        return string.concat(vm.projectRoot(), "/../shared/deployments/", vm.toString(block.chainid), ".json");
    }

    /// @dev On Arbitrum, Solidity's `block.number` is an L1 estimate; the indexer polls L2 block numbers.
    function _startBlock() internal view returns (uint256) {
        if (block.chainid == ARBITRUM_ONE || block.chainid == ARBITRUM_SEPOLIA) {
            return IArbSys(ARB_SYS).arbBlockNumber();
        }
        return block.number;
    }
}
