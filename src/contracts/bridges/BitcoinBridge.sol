// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
/**
 * @title Bitcoin Bridge
 * @dev Enables atomic swaps between Ethereum and Bitcoin using HTLCs
 * @author UniteAI Wallet Team
 */
contract BitcoinBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Events
    event HTLCCreated(
        bytes32 indexed htlcHash,
        address indexed user,
        uint256 amount,
        uint256 timelock,
        string bitcoinAddress
    );

    event HTLCClaimed(
        bytes32 indexed htlcHash,
        address indexed user,
        bytes32 secret,
        uint256 amount
    );

    event HTLCRefunded(
        bytes32 indexed htlcHash,
        address indexed user,
        uint256 amount
    );

    event CrossChainSwapInitiated(
        bytes32 indexed swapId,
        address indexed user,
        bool isEthereumToBitcoin,
        uint256 ethereumAmount,
        uint256 bitcoinAmount,
        bytes32 htlcHash
    );

    event CrossChainSwapCompleted(
        bytes32 indexed swapId,
        address indexed user,
        bytes32 secret
    );

    // Structs
    struct HTLC {
        address user;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool claimed;
        bool refunded;
        string bitcoinAddress;
    }

    struct CrossChainSwap {
        bytes32 swapId;
        address user;
        bool isEthereumToBitcoin;
        uint256 ethereumAmount;
        uint256 bitcoinAmount;
        bytes32 htlcHash;
        uint256 deadline;
        bool completed;
    }

    // State variables
    mapping(bytes32 => HTLC) public htlcContracts;
    mapping(bytes32 => CrossChainSwap) public crossChainSwaps;
    mapping(address => uint256) public userNonces;

    // Constants
    uint256 public constant MIN_TIMELOCK = 3600; // 1 hour
    uint256 public constant MAX_TIMELOCK = 86400; // 24 hours
    uint256 public constant MIN_AMOUNT = 0.001 ether; // 0.001 ETH
    uint256 public constant MAX_AMOUNT = 100 ether; // 100 ETH

    // Bitcoin network configuration
    string public constant BITCOIN_NETWORK = "mainnet"; // or "testnet"
    uint256 public constant BITCOIN_CONFIRMATIONS = 6;

    // Modifiers
    modifier validAmount(uint256 amount) {
        require(amount >= MIN_AMOUNT, "Amount too small");
        require(amount <= MAX_AMOUNT, "Amount too large");
        _;
    }

    modifier validTimelock(uint256 timelock) {
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        _;
    }

    modifier htlcExists(bytes32 htlcHash) {
        require(htlcContracts[htlcHash].user != address(0), "HTLC does not exist");
        _;
    }

    modifier htlcNotClaimed(bytes32 htlcHash) {
        require(!htlcContracts[htlcHash].claimed, "HTLC already claimed");
        _;
    }

    modifier htlcNotRefunded(bytes32 htlcHash) {
        require(!htlcContracts[htlcHash].refunded, "HTLC already refunded");
        _;
    }

    modifier htlcNotExpired(bytes32 htlcHash) {
        require(block.timestamp < htlcContracts[htlcHash].timelock, "HTLC expired");
        _;
    }

    modifier htlcExpired(bytes32 htlcHash) {
        require(block.timestamp >= htlcContracts[htlcHash].timelock, "HTLC not expired");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create HTLC for Ethereum to Bitcoin swap
     * @param hashlock SHA256 hash of the secret
     * @param timelock Expiration timestamp
     * @param bitcoinAddress Bitcoin address to receive funds
     */
    function createHTLC(
        bytes32 hashlock,
        uint256 timelock,
        string calldata bitcoinAddress
    )
        external
        payable
        nonReentrant
        validAmount(msg.value)
        validTimelock(timelock)
    {
        require(bytes(bitcoinAddress).length > 0, "Invalid Bitcoin address");

        // Create HTLC
        htlcContracts[hashlock] = HTLC({
            user: msg.sender,
            amount: msg.value,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false,
            bitcoinAddress: bitcoinAddress
        });

        emit HTLCCreated(hashlock, msg.sender, msg.value, timelock, bitcoinAddress);
    }

    /**
     * @dev Claim HTLC by revealing the secret
     * @param htlcHash HTLC hash
     * @param secret The secret that generates the hashlock
     */
    function claimHTLC(bytes32 htlcHash, bytes32 secret)
        external
        nonReentrant
        htlcExists(htlcHash)
        htlcNotClaimed(htlcHash)
        htlcNotRefunded(htlcHash)
        htlcNotExpired(htlcHash)
    {
        HTLC storage htlc = htlcContracts[htlcHash];
        
        // Verify the secret matches the hashlock
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");

        htlc.claimed = true;

        // Transfer ETH to the claimer
        (bool success, ) = payable(msg.sender).call{value: htlc.amount}("");
        require(success, "ETH transfer failed");

        emit HTLCClaimed(htlcHash, msg.sender, secret, htlc.amount);
    }

    /**
     * @dev Refund HTLC after expiration
     * @param htlcHash HTLC hash
     */
    function refundHTLC(bytes32 htlcHash)
        external
        nonReentrant
        htlcExists(htlcHash)
        htlcNotClaimed(htlcHash)
        htlcNotRefunded(htlcHash)
        htlcExpired(htlcHash)
    {
        HTLC storage htlc = htlcContracts[htlcHash];
        
        // Only the original user can refund
        require(msg.sender == htlc.user, "Only original user can refund");

        htlc.refunded = true;

        // Transfer ETH back to the user
        (bool success, ) = payable(htlc.user).call{value: htlc.amount}("");
        require(success, "ETH transfer failed");

        emit HTLCRefunded(htlcHash, htlc.user, htlc.amount);
    }

    /**
     * @dev Initiate cross-chain swap from Ethereum to Bitcoin
     * @param bitcoinAmount Amount of Bitcoin to receive
     * @param bitcoinAddress Bitcoin address to receive funds
     * @param timelock HTLC expiration timestamp
     */
    function initiateEthereumToBitcoinSwap(
        uint256 bitcoinAmount,
        string calldata bitcoinAddress,
        uint256 timelock
    )
        external
        payable
        nonReentrant
        validAmount(msg.value)
        validTimelock(timelock)
    {
        require(bytes(bitcoinAddress).length > 0, "Invalid Bitcoin address");
        require(bitcoinAmount > 0, "Invalid Bitcoin amount");

        // Generate unique swap ID
        bytes32 swapId = keccak256(abi.encodePacked(
            msg.sender,
            msg.value,
            bitcoinAmount,
            userNonces[msg.sender]++,
            block.timestamp
        ));

        // Generate HTLC hashlock
        bytes32 secret = keccak256(abi.encodePacked(
            swapId,
            block.timestamp,
            msg.sender
        ));
        bytes32 hashlock = keccak256(abi.encodePacked(secret));

        // Create HTLC
        htlcContracts[hashlock] = HTLC({
            user: msg.sender,
            amount: msg.value,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false,
            bitcoinAddress: bitcoinAddress
        });

        // Store cross-chain swap details
        crossChainSwaps[swapId] = CrossChainSwap({
            swapId: swapId,
            user: msg.sender,
            isEthereumToBitcoin: true,
            ethereumAmount: msg.value,
            bitcoinAmount: bitcoinAmount,
            htlcHash: hashlock,
            deadline: timelock,
            completed: false
        });

        emit CrossChainSwapInitiated(
            swapId,
            msg.sender,
            true,
            msg.value,
            bitcoinAmount,
            hashlock
        );

        emit HTLCCreated(hashlock, msg.sender, msg.value, timelock, bitcoinAddress);
    }

    /**
     * @dev Complete cross-chain swap from Bitcoin to Ethereum
     * @param swapId Swap identifier
     * @param secret HTLC secret
     */
    function completeBitcoinToEthereumSwap(bytes32 swapId, bytes32 secret)
        external
        nonReentrant
    {
        CrossChainSwap storage swap = crossChainSwaps[swapId];
        require(swap.user != address(0), "Swap does not exist");
        require(!swap.completed, "Swap already completed");
        require(swap.deadline > block.timestamp, "Swap expired");
        require(keccak256(abi.encodePacked(secret)) == swap.htlcHash, "Invalid secret");

        swap.completed = true;

        // Transfer ETH to the user
        (bool success, ) = payable(swap.user).call{value: swap.ethereumAmount}("");
        require(success, "ETH transfer failed");

        emit CrossChainSwapCompleted(swapId, swap.user, secret);
        emit HTLCClaimed(swap.htlcHash, swap.user, secret, swap.ethereumAmount);
    }

    /**
     * @dev Get HTLC details
     * @param htlcHash HTLC hash
     */
    function getHTLC(bytes32 htlcHash) external view returns (HTLC memory) {
        return htlcContracts[htlcHash];
    }

    /**
     * @dev Get cross-chain swap details
     * @param swapId Swap identifier
     */
    function getCrossChainSwap(bytes32 swapId) external view returns (CrossChainSwap memory) {
        return crossChainSwaps[swapId];
    }

    /**
     * @dev Check if HTLC is expired
     * @param htlcHash HTLC hash
     */
    function isHTLCExpired(bytes32 htlcHash) external view returns (bool) {
        HTLC storage htlc = htlcContracts[htlcHash];
        return htlc.user != address(0) && block.timestamp >= htlc.timelock;
    }

    /**
     * @dev Get Bitcoin address for HTLC
     * @param htlcHash HTLC hash
     */
    function getBitcoinAddress(bytes32 htlcHash) external view returns (string memory) {
        return htlcContracts[htlcHash].bitcoinAddress;
    }

    /**
     * @dev Calculate Bitcoin amount from Ethereum amount (simplified)
     * @param ethereumAmount Amount in ETH
     */
    function calculateBitcoinAmount(uint256 ethereumAmount) external pure returns (uint256) {
        // This would typically use an oracle to get real-time exchange rate
        // For demo purposes, using a fixed rate of 1 ETH = 0.05 BTC
        return (ethereumAmount * 5) / 100; // 0.05 BTC per ETH
    }

    /**
     * @dev Calculate Ethereum amount from Bitcoin amount (simplified)
     * @param bitcoinAmount Amount in BTC (in satoshis)
     */
    function calculateEthereumAmount(uint256 bitcoinAmount) external pure returns (uint256) {
        // This would typically use an oracle to get real-time exchange rate
        // For demo purposes, using a fixed rate of 1 BTC = 20 ETH
        return (bitcoinAmount * 20 * 1e18) / 1e8; // Convert satoshis to ETH
    }

    /**
     * @dev Emergency withdraw ETH (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
} 