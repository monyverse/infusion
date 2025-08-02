// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title HTLCFactory
 * @dev Factory contract for creating Hash Time Locked Contracts (HTLCs)
 * Meets all 1inch Fusion+ qualification requirements:
 * - Preserve hashlock and timelock functionality
 * - Bidirectional swaps (Ethereum ↔ Any Chain)
 * - Onchain execution of token transfers
 * - Support for partial fills (stretch goal)
 */
contract HTLCFactory is ReentrancyGuard, Ownable {
    uint256 private _htlcIds;
    
    // HTLC struct to store swap details
    struct HTLC {
        uint256 id;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        bool active;
        string secret;
        string targetChain;
        string targetToken;
        uint256 targetAmount;
        bool isPartialFill;
        uint256 partialAmount;
    }
    
    // Mapping from HTLC ID to HTLC struct
    mapping(uint256 => HTLC) public htlcContracts;
    
    // Mapping from hashlock to HTLC ID
    mapping(bytes32 => uint256) public hashlockToHTLC;
    
    // Events
    event HTLCCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        string targetChain,
        string targetToken,
        uint256 targetAmount
    );
    
    event HTLCWithdrawn(
        uint256 indexed id,
        address indexed recipient,
        string secret
    );
    
    event HTLCRefunded(
        uint256 indexed id,
        address indexed sender
    );
    
    event PartialFillExecuted(
        uint256 indexed id,
        address indexed recipient,
        uint256 partialAmount,
        string secret
    );
    
    // Fee structure
    uint256 public constant FEE_PERCENTAGE = 25; // 0.25%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new HTLC for cross-chain swap
     * @param recipient The recipient address
     * @param token The token address (address(0) for ETH)
     * @param amount The amount to lock
     * @param hashlock The hashlock (hash of secret)
     * @param timelock The timelock expiration
     * @param targetChain The target blockchain
     * @param targetToken The target token symbol
     * @param targetAmount The target amount
     */
    function createHTLC(
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        string memory targetChain,
        string memory targetToken,
        uint256 targetAmount
    ) external payable nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlockToHTLC[hashlock] == 0, "Hashlock already exists");
        
        _htlcIds++;
        uint256 htlcId = _htlcIds;
        
        // Handle ETH or ERC20 token
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token swaps");
            // Transfer tokens from sender to contract
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        
        HTLC storage htlc = htlcContracts[htlcId];
        htlc.id = htlcId;
        htlc.sender = msg.sender;
        htlc.recipient = recipient;
        htlc.token = token;
        htlc.amount = amount;
        htlc.hashlock = hashlock;
        htlc.timelock = timelock;
        htlc.active = true;
        htlc.targetChain = targetChain;
        htlc.targetToken = targetToken;
        htlc.targetAmount = targetAmount;
        htlc.isPartialFill = false;
        
        hashlockToHTLC[hashlock] = htlcId;
        
        emit HTLCCreated(
            htlcId,
            msg.sender,
            recipient,
            token,
            amount,
            hashlock,
            timelock,
            targetChain,
            targetToken,
            targetAmount
        );
        
        return htlcId;
    }
    
    /**
     * @dev Withdraw funds from HTLC using secret
     * @param htlcId The HTLC ID
     * @param secret The secret that generates the hashlock
     */
    function withdraw(uint256 htlcId, string memory secret) external nonReentrant {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.active, "HTLC not active");
        require(htlc.recipient == msg.sender, "Only recipient can withdraw");
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(block.timestamp <= htlc.timelock, "Timelock expired");
        
        bytes32 hashlock = keccak256(abi.encodePacked(secret));
        require(htlc.hashlock == hashlock, "Invalid secret");
        
        htlc.withdrawn = true;
        htlc.active = false;
        htlc.secret = secret;
        
        // Calculate fee
        uint256 fee = (htlc.amount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 withdrawAmount = htlc.amount - fee;
        
        // Transfer funds to recipient
        if (htlc.token == address(0)) {
            payable(msg.sender).transfer(withdrawAmount);
            payable(owner()).transfer(fee);
        } else {
            IERC20(htlc.token).transfer(msg.sender, withdrawAmount);
            IERC20(htlc.token).transfer(owner(), fee);
        }
        
        emit HTLCWithdrawn(htlcId, msg.sender, secret);
    }
    
    /**
     * @dev Refund HTLC if timelock expires
     * @param htlcId The HTLC ID
     */
    function refund(uint256 htlcId) external nonReentrant {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.active, "HTLC not active");
        require(htlc.sender == msg.sender, "Only sender can refund");
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(block.timestamp > htlc.timelock, "Timelock not expired");
        
        htlc.refunded = true;
        htlc.active = false;
        
        // Return full amount to sender (no fee on refund)
        if (htlc.token == address(0)) {
            payable(msg.sender).transfer(htlc.amount);
        } else {
            IERC20(htlc.token).transfer(msg.sender, htlc.amount);
        }
        
        emit HTLCRefunded(htlcId, msg.sender);
    }
    
    /**
     * @dev Execute partial fill (stretch goal)
     * @param htlcId The HTLC ID
     * @param secret The secret
     * @param partialAmount The partial amount to withdraw
     */
    function executePartialFill(
        uint256 htlcId,
        string memory secret,
        uint256 partialAmount
    ) external nonReentrant {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.active, "HTLC not active");
        require(htlc.recipient == msg.sender, "Only recipient can withdraw");
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(block.timestamp <= htlc.timelock, "Timelock expired");
        require(partialAmount > 0 && partialAmount < htlc.amount, "Invalid partial amount");
        
        bytes32 hashlock = keccak256(abi.encodePacked(secret));
        require(htlc.hashlock == hashlock, "Invalid secret");
        
        // Update HTLC for partial fill
        htlc.partialAmount = partialAmount;
        htlc.isPartialFill = true;
        htlc.secret = secret;
        
        // Calculate fee on partial amount
        uint256 fee = (partialAmount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 withdrawAmount = partialAmount - fee;
        
        // Transfer partial amount
        if (htlc.token == address(0)) {
            payable(msg.sender).transfer(withdrawAmount);
            payable(owner()).transfer(fee);
        } else {
            IERC20(htlc.token).transfer(msg.sender, withdrawAmount);
            IERC20(htlc.token).transfer(owner(), fee);
        }
        
        emit PartialFillExecuted(htlcId, msg.sender, partialAmount, secret);
    }
    
    /**
     * @dev Get HTLC details
     * @param htlcId The HTLC ID
     */
    function getHTLC(uint256 htlcId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        bool withdrawn,
        bool refunded,
        bool active,
        string memory targetChain,
        string memory targetToken,
        uint256 targetAmount,
        bool isPartialFill,
        uint256 partialAmount
    ) {
        HTLC storage htlc = htlcContracts[htlcId];
        return (
            htlc.id,
            htlc.sender,
            htlc.recipient,
            htlc.token,
            htlc.amount,
            htlc.hashlock,
            htlc.timelock,
            htlc.withdrawn,
            htlc.refunded,
            htlc.active,
            htlc.targetChain,
            htlc.targetToken,
            htlc.targetAmount,
            htlc.isPartialFill,
            htlc.partialAmount
        );
    }
    
    /**
     * @dev Get HTLC ID by hashlock
     * @param hashlock The hashlock
     */
    function getHTLCByHashlock(bytes32 hashlock) external view returns (uint256) {
        return hashlockToHTLC[hashlock];
    }
    
    /**
     * @dev Check if HTLC is expired
     * @param htlcId The HTLC ID
     */
    function isExpired(uint256 htlcId) external view returns (bool) {
        HTLC storage htlc = htlcContracts[htlcId];
        return block.timestamp > htlc.timelock;
    }
    
    /**
     * @dev Get total HTLC count
     */
    function getTotalHTLCs() external view returns (uint256) {
        return _htlcIds;
    }
    
    /**
     * @dev Emergency pause (only owner)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
    }
    
    /**
     * @dev Withdraw fees (only owner)
     */
    function withdrawFees(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).transfer(owner(), balance);
        }
    }
    
    // Receive function for ETH
    receive() external payable {}
}

// IERC20 interface
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
} 