// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @dev Arbitrum precompile at address(100). Only what the deploy scripts need.
interface IArbSys {
    /// @notice The L2 block number. `block.number` on Arbitrum is an L1 estimate.
    function arbBlockNumber() external view returns (uint256);
}
