// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AddressLib, Address } from "./libraries/AddressLib.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { ImmutablesLib } from "./libraries/ImmutablesLib.sol";
import { Timelocks, TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";

/**
 * @title Base abstract Escrow contract for cross-chain atomic swap.
 * @dev {IBaseEscrow-withdraw}, {IBaseEscrow-cancel} and _validateImmutables functions must be implemented in the derived contracts.
 * @custom:security-contact security@1inch.io
 */
abstract contract BaseEscrow is IBaseEscrow {
    using AddressLib for Address;
    using SafeERC20 for IERC20;
    using TimelocksLib for Timelocks;
    using ImmutablesLib for Immutables;

    // Token that is used to access public withdraw or cancel functions.
    IERC20 internal immutable _ACCESS_TOKEN;

    /// @notice See {IBaseEscrow-RESCUE_DELAY}.
    uint256 public immutable RESCUE_DELAY;
    /// @notice See {IBaseEscrow-FACTORY}.
    address public immutable FACTORY = msg.sender;

    constructor(uint32 rescueDelay, IERC20 accessToken) {
        RESCUE_DELAY = rescueDelay;
        _ACCESS_TOKEN = accessToken;
    }

    modifier onlyTaker(Immutables calldata immutables) {
        if (msg.sender != immutables.taker.get()) revert InvalidCaller();
        _;
    }

    modifier onlyMaker(Immutables calldata immutables) {
        if (msg.sender != immutables.maker.get()) revert InvalidCaller();
        _;
    }

    modifier onlyValidImmutables(Immutables calldata immutables) virtual {
        _validateImmutables(immutables);
        _;
    }

    modifier onlyAfter(uint256 time) {
        if (block.timestamp < time) revert InvalidTime();
        _;
    }

    modifier onlyBefore(uint256 time) {
        if (block.timestamp >= time) revert InvalidTime();
        _;
    }

    modifier onlyAfterRescueDelay(Immutables calldata immutables) {
        if (block.timestamp < immutables.timelocks.rescueStart(RESCUE_DELAY)) revert InvalidTime();
        _;
    }

    /**
     * @notice See {IBaseEscrow-cancel}.
     */
    function cancel(Immutables calldata immutables)
        external
        onlyTaker(immutables)
        onlyValidImmutables(immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        _cancel(immutables);
    }

    /**
     * @notice See {IBaseEscrow-rescueFunds}.
     */
    function rescueFunds(address token, uint256 amount, Immutables calldata immutables)
        external
        onlyTaker(immutables)
        onlyValidImmutables(immutables)
        onlyAfterRescueDelay(immutables)
    {
        _rescueFunds(token, amount, immutables);
    }

    /**
     * @dev Validates that the immutables are correct for this escrow.
     */
    function _validateImmutables(Immutables calldata immutables) internal view virtual;

    /**
     * @dev Withdraws funds to a predetermined recipient.
     */
    function _withdraw(bytes32 secret, Immutables calldata immutables) internal virtual;

    /**
     * @dev Cancels the escrow and returns tokens to a predetermined recipient.
     */
    function _cancel(Immutables calldata immutables) internal virtual;

    /**
     * @dev Rescues funds from the escrow.
     */
    function _rescueFunds(address token, uint256 amount, Immutables calldata immutables) internal virtual;

    /**
     * @dev Validates that the secret matches the hashlock.
     */
    function _validateSecret(bytes32 secret, bytes32 hashlock) internal pure {
        if (keccak256(abi.encodePacked(secret)) != hashlock) revert InvalidSecret();
    }

    /**
     * @dev Sends tokens to the specified address.
     */
    function _sendTokens(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            if (!success) revert NativeTokenSendingFailure();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Sends the safety deposit to the caller.
     */
    function _sendSafetyDeposit(Immutables calldata immutables) internal {
        _sendTokens(address(0), msg.sender, immutables.safetyDeposit);
    }
} 