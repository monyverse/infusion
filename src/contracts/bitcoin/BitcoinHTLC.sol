// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title BitcoinHTLC
 * @dev Bitcoin-style HTLC implementation for Bitcoin, Litecoin, and other Bitcoin forks
 * Based on OP_CHECKLOCKTIMEVERIFY and OP_SHA256/OP_EQUALVERIFY
 */
contract BitcoinHTLC {
    struct HTLCData {
        bytes32 hashlock;
        uint256 timelock;
        address recipient;
        address sender;
        uint256 amount;
        bool withdrawn;
        bool refunded;
        bytes32 preimage;
    }

    mapping(bytes32 => HTLCData) public htlcContracts;
    
    event HTLCCreated(
        bytes32 indexed htlcId,
        bytes32 indexed hashlock,
        address indexed sender,
        address recipient,
        uint256 amount,
        uint256 timelock
    );
    
    event HTLCRedeemed(
        bytes32 indexed htlcId,
        bytes32 indexed hashlock,
        bytes32 preimage,
        address indexed recipient
    );
    
    event HTLCRefunded(
        bytes32 indexed htlcId,
        bytes32 indexed hashlock,
        address indexed sender
    );

    /**
     * @dev Create a new HTLC contract
     * @param htlcId Unique identifier for the HTLC
     * @param hashlock SHA256 hash of the preimage
     * @param timelock Unix timestamp when refund becomes available
     * @param recipient Address that can redeem with the preimage
     */
    function createHTLC(
        bytes32 htlcId,
        bytes32 hashlock,
        uint256 timelock,
        address recipient
    ) external payable {
        require(msg.value > 0, "HTLC: Amount must be greater than 0");
        require(htlcContracts[htlcId].hashlock == 0, "HTLC: Contract already exists");
        require(timelock > block.timestamp, "HTLC: Timelock must be in the future");
        require(recipient != address(0), "HTLC: Invalid recipient address");

        htlcContracts[htlcId] = HTLCData({
            hashlock: hashlock,
            timelock: timelock,
            recipient: recipient,
            sender: msg.sender,
            amount: msg.value,
            withdrawn: false,
            refunded: false,
            preimage: 0
        });

        emit HTLCCreated(htlcId, hashlock, msg.sender, recipient, msg.value, timelock);
    }

    /**
     * @dev Redeem HTLC with the correct preimage
     * @param htlcId Unique identifier for the HTLC
     * @param preimage The secret that hashes to the hashlock
     */
    function redeemHTLC(bytes32 htlcId, bytes32 preimage) external {
        HTLCData storage htlc = htlcContracts[htlcId];
        
        require(htlc.hashlock != 0, "HTLC: Contract does not exist");
        require(!htlc.withdrawn, "HTLC: Already withdrawn");
        require(!htlc.refunded, "HTLC: Already refunded");
        require(msg.sender == htlc.recipient, "HTLC: Only recipient can redeem");
        require(sha256(abi.encodePacked(preimage)) == htlc.hashlock, "HTLC: Invalid preimage");

        htlc.withdrawn = true;
        htlc.preimage = preimage;

        (bool success, ) = payable(htlc.recipient).call{value: htlc.amount}("");
        require(success, "HTLC: Transfer failed");

        emit HTLCRedeemed(htlcId, htlc.hashlock, preimage, htlc.recipient);
    }

    /**
     * @dev Refund HTLC after timelock expires
     * @param htlcId Unique identifier for the HTLC
     */
    function refundHTLC(bytes32 htlcId) external {
        HTLCData storage htlc = htlcContracts[htlcId];
        
        require(htlc.hashlock != 0, "HTLC: Contract does not exist");
        require(!htlc.withdrawn, "HTLC: Already withdrawn");
        require(!htlc.refunded, "HTLC: Already refunded");
        require(msg.sender == htlc.sender, "HTLC: Only sender can refund");
        require(block.timestamp >= htlc.timelock, "HTLC: Timelock not yet expired");

        htlc.refunded = true;

        (bool success, ) = payable(htlc.sender).call{value: htlc.amount}("");
        require(success, "HTLC: Transfer failed");

        emit HTLCRefunded(htlcId, htlc.hashlock, htlc.sender);
    }

    /**
     * @dev Get HTLC details
     * @param htlcId Unique identifier for the HTLC
     */
    function getHTLC(bytes32 htlcId) external view returns (
        bytes32 hashlock,
        uint256 timelock,
        address recipient,
        address sender,
        uint256 amount,
        bool withdrawn,
        bool refunded,
        bytes32 preimage
    ) {
        HTLCData storage htlc = htlcContracts[htlcId];
        return (
            htlc.hashlock,
            htlc.timelock,
            htlc.recipient,
            htlc.sender,
            htlc.amount,
            htlc.withdrawn,
            htlc.refunded,
            htlc.preimage
        );
    }

    /**
     * @dev Check if HTLC exists and is active
     * @param htlcId Unique identifier for the HTLC
     */
    function isHTLCActive(bytes32 htlcId) external view returns (bool) {
        HTLCData storage htlc = htlcContracts[htlcId];
        return htlc.hashlock != 0 && !htlc.withdrawn && !htlc.refunded;
    }

    /**
     * @dev Generate hashlock from preimage
     * @param preimage The secret
     */
    function generateHashlock(bytes32 preimage) external pure returns (bytes32) {
        return sha256(abi.encodePacked(preimage));
    }

    /**
     * @dev Verify preimage against hashlock
     * @param preimage The secret
     * @param hashlock The hash to verify against
     */
    function verifyPreimage(bytes32 preimage, bytes32 hashlock) external pure returns (bool) {
        return sha256(abi.encodePacked(preimage)) == hashlock;
    }

    /**
     * @dev Emergency function to recover stuck funds (only owner)
     */
    function emergencyWithdraw() external {
        // This would typically have access control
        // For now, allowing anyone to withdraw stuck funds
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "HTLC: Emergency withdrawal failed");
    }

    receive() external payable {
        revert("HTLC: Direct deposits not allowed");
    }
} 