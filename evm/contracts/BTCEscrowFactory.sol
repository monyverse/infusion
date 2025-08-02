// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBTCEscrowFactory.sol";
import "./interfaces/IBaseEscrow.sol";
import "./libraries/AddressLib.sol";
import "./libraries/TimelocksLib.sol";
import "./libraries/ImmutablesLib.sol";
import "./BTCEscrowSrc.sol";
import "./BTCEscrowDst.sol";

/**
 * @title BTCEscrowFactory
 * @dev Factory contract for creating Bitcoin escrow contracts for atomic swaps
 * Based on HTLC implementation
 */
contract BTCEscrowFactory is IBTCEscrowFactory, Ownable, ReentrancyGuard {
    using AddressLib for Address;
    using TimelocksLib for Timelocks;
    using ImmutablesLib for IBaseEscrow.Immutables;

    // Factory fee
    uint256 public factoryFee = 0.001 ether;
    
    // Escrow templates
    BTCEscrowSrc public immutable srcEscrowTemplate;
    BTCEscrowDst public immutable dstEscrowTemplate;

    constructor() Ownable(msg.sender) {
        // Deploy escrow templates
        srcEscrowTemplate = new BTCEscrowSrc();
        dstEscrowTemplate = new BTCEscrowDst();
    }

    /**
     * @dev Create source escrow for EVM→BTC swaps
     * @param immutables Escrow configuration
     */
    function createSrcEscrow(IBaseEscrow.Immutables calldata immutables) 
        external 
        payable 
        override
        nonReentrant 
    {
        if (msg.value < factoryFee) revert InsufficientEscrowBalance();
        
        // Create escrow contract
        BTCEscrowSrc escrow = new BTCEscrowSrc();
        
        // Initialize escrow with immutables
        escrow.initialize{value: msg.value - factoryFee}(
            immutables.orderHash,
            immutables.hashlock,
            AddressLib.wrap(immutables.maker.get()),
            AddressLib.wrap(immutables.taker.get()),
            AddressLib.wrap(immutables.token.get()),
            immutables.amount,
            immutables.safetyDeposit,
            Timelocks.unwrap(immutables.timelocks)
        );

        emit SrcEscrowCreated(
            address(escrow),
            immutables.hashlock,
            immutables.maker,
            msg.sender
        );
    }

    /**
     * @dev Create destination escrow for BTC→EVM swaps
     * @param immutables Escrow configuration
     */
    function createDstEscrow(IBaseEscrow.Immutables calldata immutables)
        external 
        payable 
        override
        nonReentrant 
    {
        if (msg.value < factoryFee) revert InsufficientEscrowBalance();
        
        // Create escrow contract
        BTCEscrowDst escrow = new BTCEscrowDst();
        
        // Initialize escrow with immutables
        escrow.initialize{value: msg.value - factoryFee}(
            immutables.orderHash,
            immutables.hashlock,
            AddressLib.wrap(immutables.maker.get()),
            AddressLib.wrap(immutables.taker.get()),
            AddressLib.wrap(immutables.token.get()),
            immutables.amount,
            immutables.safetyDeposit,
            Timelocks.unwrap(immutables.timelocks)
        );

        emit DstEscrowCreated(
            address(escrow),
            immutables.hashlock,
            immutables.taker,
            msg.sender
        );
    }

    /**
     * @dev Returns the deterministic address of a source escrow
     * @param immutables The escrow immutables
     * @return The computed address of the source escrow
     */
    function addressOfEscrowSrc(IBaseEscrow.Immutables calldata immutables) 
        external 
        view 
        override 
        returns (address) 
    {
        // For demo purposes, return a deterministic address
        bytes32 salt = immutables.hash();
        return address(uint160(uint256(salt)));
    }

    /**
     * @dev Returns the deterministic address of a destination escrow
     * @param immutables The escrow immutables
     * @return The computed address of the destination escrow
     */
    function addressOfEscrowDst(IBaseEscrow.Immutables calldata immutables) 
        external 
        view 
        override 
        returns (address) 
    {
        // For demo purposes, return a deterministic address
        bytes32 salt = immutables.hash();
        return address(uint160(uint256(salt)));
    }

    /**
     * @dev Returns the source escrow implementation address
     * @return The address of the source escrow implementation
     */
    function BTC_ESCROW_SRC_IMPLEMENTATION() external view override returns (address) {
        return address(srcEscrowTemplate);
    }

    /**
     * @dev Returns the destination escrow implementation address
     * @return The address of the destination escrow implementation
     */
    function BTC_ESCROW_DST_IMPLEMENTATION() external view override returns (address) {
        return address(dstEscrowTemplate);
    }

    /**
     * @dev Set factory fee
     * @param newFee New factory fee in wei
     */
    function setFactoryFee(uint256 newFee) external onlyOwner {
        factoryFee = newFee;
    }

    /**
     * @dev Withdraw factory fees
     */
    function withdrawFees() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Fee withdrawal failed");
    }

    /**
     * @dev Get packed timelock data
     * @param withdrawalPeriod Withdrawal period in seconds
     * @param cancellationPeriod Cancellation period in seconds
     */
    function packTimelocks(uint256 withdrawalPeriod, uint256 cancellationPeriod) 
        external 
        pure 
        returns (uint256) 
    {
        return (withdrawalPeriod << 128) | cancellationPeriod;
    }

    /**
     * @dev Unpack timelock data
     * @param timelocks Packed timelock data
     */
    function unpackTimelocks(uint256 timelocks) 
        external 
        pure 
        returns (uint256 withdrawalPeriod, uint256 cancellationPeriod) 
    {
        withdrawalPeriod = timelocks >> 128;
        cancellationPeriod = timelocks & 0xffffffffffffffffffffffffffffffff;
    }
} 