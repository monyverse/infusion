// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title CustomLimitOrder
 * @dev Custom limit order protocol implementation for 1inch hackathon
 * This is NOT using the official 1inch Limit Order API - it's a custom implementation
 */
contract CustomLimitOrder is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    struct Order {
        address maker;
        address makerAsset;
        address takerAsset;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 salt;
        uint256 startTime;
        uint256 endTime;
        bytes signature;
        bool isActive;
        bool isFilled;
        bool isCancelled;
    }

    struct FillOrderParams {
        Order order;
        uint256 takerAmount;
        bytes signature;
    }

    // Events
    event OrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address makerAsset,
        address takerAsset,
        uint256 makerAmount,
        uint256 takerAmount,
        uint256 salt,
        uint256 startTime,
        uint256 endTime
    );

    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 makerAmount,
        uint256 takerAmount,
        uint256 fee
    );

    event OrderCancelled(bytes32 indexed orderHash, address indexed maker);

    // State variables
    mapping(bytes32 => Order) public orders;
    mapping(bytes32 => bool) public orderHashes;
    mapping(address => bytes32[]) public userOrders;
    
    uint256 public protocolFee = 30; // 0.3% in basis points
    address public feeCollector;
    
    // Constants
    bytes32 public constant DOMAIN_SEPARATOR = keccak256(
        abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("CustomLimitOrder")),
            keccak256(bytes("1.0.0")),
            block.chainid,
            address(this)
        )
    );

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 startTime,uint256 endTime)"
    );

    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }

    /**
     * @dev Create a new limit order
     * @param _makerAsset Address of the asset being sold
     * @param _takerAsset Address of the asset being bought
     * @param _makerAmount Amount of maker asset
     * @param _takerAmount Amount of taker asset
     * @param _startTime Start time for the order
     * @param _endTime End time for the order
     * @param _signature Signature for the order
     */
    function createOrder(
        address _makerAsset,
        address _takerAsset,
        uint256 _makerAmount,
        uint256 _takerAmount,
        uint256 _startTime,
        uint256 _endTime,
        bytes calldata _signature
    ) external nonReentrant {
        require(_makerAsset != address(0), "Invalid maker asset");
        require(_takerAsset != address(0), "Invalid taker asset");
        require(_makerAmount > 0, "Invalid maker amount");
        require(_takerAmount > 0, "Invalid taker amount");
        require(_startTime >= block.timestamp, "Start time in past");
        require(_endTime > _startTime, "Invalid end time");
        require(_endTime <= block.timestamp + 30 days, "Order too long");

        uint256 salt = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            _makerAsset,
            _takerAsset,
            _makerAmount,
            _takerAmount
        )));

        Order memory order = Order({
            maker: msg.sender,
            makerAsset: _makerAsset,
            takerAsset: _takerAsset,
            makerAmount: _makerAmount,
            takerAmount: _takerAmount,
            salt: salt,
            startTime: _startTime,
            endTime: _endTime,
            signature: _signature,
            isActive: true,
            isFilled: false,
            isCancelled: false
        });

        bytes32 orderHash = getOrderHash(order);
        require(!orderHashes[orderHash], "Order already exists");

        // Verify signature
        require(verifyOrderSignature(order, _signature), "Invalid signature");

        // Transfer maker assets to contract
        IERC20(_makerAsset).safeTransferFrom(msg.sender, address(this), _makerAmount);

        // Store order
        orders[orderHash] = order;
        orderHashes[orderHash] = true;
        userOrders[msg.sender].push(orderHash);

        emit OrderCreated(
            orderHash,
            msg.sender,
            _makerAsset,
            _takerAsset,
            _makerAmount,
            _takerAmount,
            salt,
            _startTime,
            _endTime
        );
    }

    /**
     * @dev Fill a limit order
     * @param _orderHash Hash of the order to fill
     * @param _takerAmount Amount of taker asset to pay
     */
    function fillOrder(bytes32 _orderHash, uint256 _takerAmount) external nonReentrant {
        Order storage order = orders[_orderHash];
        require(order.isActive, "Order not active");
        require(!order.isFilled, "Order already filled");
        require(!order.isCancelled, "Order cancelled");
        require(block.timestamp >= order.startTime, "Order not started");
        require(block.timestamp <= order.endTime, "Order expired");
        require(_takerAmount <= order.takerAmount, "Amount too high");

        // Calculate maker amount based on taker amount
        uint256 makerAmount = (_takerAmount * order.makerAmount) / order.takerAmount;
        require(makerAmount > 0, "Invalid maker amount");

        // Calculate protocol fee
        uint256 fee = (makerAmount * protocolFee) / 10000;
        uint256 makerAmountAfterFee = makerAmount - fee;

        // Transfer taker assets from taker to maker
        IERC20(order.takerAsset).safeTransferFrom(msg.sender, order.maker, _takerAmount);

        // Transfer maker assets from contract to taker
        IERC20(order.makerAsset).safeTransfer(msg.sender, makerAmountAfterFee);

        // Transfer fee to fee collector
        if (fee > 0) {
            IERC20(order.makerAsset).safeTransfer(feeCollector, fee);
        }

        // Update order state
        order.isFilled = true;
        order.isActive = false;

        emit OrderFilled(
            _orderHash,
            order.maker,
            msg.sender,
            makerAmount,
            _takerAmount,
            fee
        );
    }

    /**
     * @dev Cancel an order (only by maker)
     * @param _orderHash Hash of the order to cancel
     */
    function cancelOrder(bytes32 _orderHash) external nonReentrant {
        Order storage order = orders[_orderHash];
        require(order.maker == msg.sender, "Not order maker");
        require(order.isActive, "Order not active");
        require(!order.isFilled, "Order already filled");
        require(!order.isCancelled, "Order already cancelled");

        order.isCancelled = true;
        order.isActive = false;

        // Return maker assets to maker
        IERC20(order.makerAsset).safeTransfer(order.maker, order.makerAmount);

        emit OrderCancelled(_orderHash, msg.sender);
    }

    /**
     * @dev Get order hash for signature verification
     */
    function getOrderHash(Order memory _order) public view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        ORDER_TYPEHASH,
                        _order.maker,
                        _order.makerAsset,
                        _order.takerAsset,
                        _order.makerAmount,
                        _order.takerAmount,
                        _order.salt,
                        _order.startTime,
                        _order.endTime
                    )
                )
            )
        );
    }

    /**
     * @dev Verify order signature
     */
    function verifyOrderSignature(Order memory _order, bytes memory _signature) public view returns (bool) {
        bytes32 orderHash = getOrderHash(_order);
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", orderHash));
        address signer = messageHash.recover(_signature);
        return signer == _order.maker;
    }

    /**
     * @dev Get user orders
     */
    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrders[_user];
    }

    /**
     * @dev Get order details
     */
    function getOrder(bytes32 _orderHash) external view returns (Order memory) {
        return orders[_orderHash];
    }

    /**
     * @dev Update protocol fee (only owner)
     */
    function updateProtocolFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        protocolFee = _newFee;
    }

    /**
     * @dev Update fee collector (only owner)
     */
    function updateFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }

    /**
     * @dev Emergency pause (only owner)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
    }

    /**
     * @dev Get active orders count
     */
    function getActiveOrdersCount() external view returns (uint256) {
        // This would need to be implemented with a counter
        return 0;
    }
} 