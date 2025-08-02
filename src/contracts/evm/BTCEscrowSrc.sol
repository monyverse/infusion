// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BTCEscrowSrc
 * @dev Source escrow contract for EVM→BTC atomic swaps
 * Based on HTLC implementation
 */
contract BTCEscrowSrc is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event EscrowInitialized(
        bytes32 indexed orderHash,
        bytes32 indexed hashlock,
        uint256 maker,
        uint256 taker,
        uint256 token,
        uint256 amount,
        uint256 safetyDeposit,
        uint256 timelocks
    );

    event Withdrawal(
        bytes32 indexed orderHash,
        address indexed recipient,
        uint256 amount,
        bytes32 secret
    );

    event Refund(
        bytes32 indexed orderHash,
        address indexed recipient,
        uint256 amount
    );

    // Immutable state variables
    bytes32 public immutable orderHash;
    bytes32 public immutable hashlock;
    uint256 public immutable maker;
    uint256 public immutable taker;
    uint256 public immutable token;
    uint256 public immutable amount;
    uint256 public immutable safetyDeposit;
    uint256 public immutable timelocks;

    // Mutable state
    bool public initialized;
    bool public withdrawn;
    bool public refunded;

    // Timelock periods
    uint256 public withdrawalPeriod;
    uint256 public cancellationPeriod;

    // Timestamps
    uint256 public startTime;
    uint256 public withdrawalDeadline;
    uint256 public cancellationDeadline;

    constructor() Ownable(msg.sender) {
        // These will be set during initialization
        orderHash = bytes32(0);
        hashlock = bytes32(0);
        maker = 0;
        taker = 0;
        token = 0;
        amount = 0;
        safetyDeposit = 0;
        timelocks = 0;
    }

    /**
     * @dev Initialize the escrow contract
     * @param _orderHash Unique order identifier
     * @param _hashlock SHA-256 hash of secret
     * @param _maker Maker address as uint256
     * @param _taker Taker address as uint256
     * @param _token Token address (0 = ETH)
     * @param _amount Amount in wei
     * @param _safetyDeposit Safety deposit amount
     * @param _timelocks Packed timelock data
     */
    function initialize(
        bytes32 _orderHash,
        bytes32 _hashlock,
        uint256 _maker,
        uint256 _taker,
        uint256 _token,
        uint256 _amount,
        uint256 _safetyDeposit,
        uint256 _timelocks
    ) external payable {
        require(!initialized, "Already initialized");
        require(msg.sender == owner(), "Only owner can initialize");
        require(msg.value >= _amount + _safetyDeposit, "Insufficient value");

        // Set immutable values
        orderHash = _orderHash;
        hashlock = _hashlock;
        maker = _maker;
        taker = _taker;
        token = _token;
        amount = _amount;
        safetyDeposit = _safetyDeposit;
        timelocks = _timelocks;

        // Unpack timelocks
        withdrawalPeriod = _timelocks >> 128;
        cancellationPeriod = _timelocks & 0xffffffffffffffffffffffffffffffff;

        // Set timestamps
        startTime = block.timestamp;
        withdrawalDeadline = startTime + withdrawalPeriod;
        cancellationDeadline = startTime + cancellationPeriod;

        initialized = true;

        emit EscrowInitialized(
            _orderHash,
            _hashlock,
            _maker,
            _taker,
            _token,
            _amount,
            _safetyDeposit,
            _timelocks
        );
    }

    /**
     * @dev Withdraw funds by revealing the secret
     * @param secret The secret that generates the hashlock
     */
    function withdraw(bytes32 secret) external nonReentrant {
        require(initialized, "Not initialized");
        require(!withdrawn, "Already withdrawn");
        require(!refunded, "Already refunded");
        require(block.timestamp <= withdrawalDeadline, "Withdrawal period expired");

        // Verify the secret matches the hashlock
        require(keccak256(abi.encodePacked(secret)) == hashlock, "Invalid secret");

        withdrawn = true;

        // Transfer funds to taker
        address takerAddress = address(uint160(taker));
        uint256 totalAmount = amount + safetyDeposit;

        if (token == 0) {
            // ETH transfer
            (bool success, ) = payable(takerAddress).call{value: totalAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20 tokenContract = IERC20(address(uint160(token)));
            tokenContract.safeTransfer(takerAddress, totalAmount);
        }

        emit Withdrawal(orderHash, takerAddress, totalAmount, secret);
    }

    /**
     * @dev Refund funds to maker after cancellation period
     */
    function refund() external nonReentrant {
        require(initialized, "Not initialized");
        require(!withdrawn, "Already withdrawn");
        require(!refunded, "Already refunded");
        require(block.timestamp >= cancellationDeadline, "Cancellation period not reached");

        refunded = true;

        // Transfer funds back to maker
        address makerAddress = address(uint160(maker));
        uint256 totalAmount = amount + safetyDeposit;

        if (token == 0) {
            // ETH transfer
            (bool success, ) = payable(makerAddress).call{value: totalAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20 tokenContract = IERC20(address(uint160(token)));
            tokenContract.safeTransfer(makerAddress, totalAmount);
        }

        emit Refund(orderHash, makerAddress, totalAmount);
    }

    /**
     * @dev Get escrow status
     */
    function getStatus() external view returns (
        bool _initialized,
        bool _withdrawn,
        bool _refunded,
        uint256 _startTime,
        uint256 _withdrawalDeadline,
        uint256 _cancellationDeadline
    ) {
        return (
            initialized,
            withdrawn,
            refunded,
            startTime,
            withdrawalDeadline,
            cancellationDeadline
        );
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     * @param tokenAddress Token to recover
     * @param recoverAmount Amount to recover
     */
    function emergencyRecover(address tokenAddress, uint256 recoverAmount) external onlyOwner {
        require(block.timestamp >= cancellationDeadline + 1 days, "Too early for emergency recovery");
        
        if (tokenAddress == address(0)) {
            (bool success, ) = payable(owner()).call{value: recoverAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(tokenAddress).safeTransfer(owner(), recoverAmount);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
} 