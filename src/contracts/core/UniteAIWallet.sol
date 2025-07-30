// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@1inch/limit-order-protocol/contracts/interfaces/IOrderMixin.sol";
import "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";

/**
 * @title UniteAI Wallet
 * @dev AI-powered cross-chain wallet with 1inch integration
 * @author UniteAI Wallet Team
 */
contract UniteAIWallet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using AddressLib for address;

    // Events
    event AIActionExecuted(
        address indexed user,
        string actionType,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 gasUsed
    );

    event CrossChainSwapInitiated(
        bytes32 indexed swapId,
        address indexed user,
        string sourceChain,
        string destinationChain,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOut
    );

    event LimitOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address makerAsset,
        address takerAsset,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 expiration
    );

    event PortfolioRebalanced(
        address indexed user,
        uint256 totalValue,
        uint256 gasUsed,
        uint256 timestamp
    );

    // Structs
    struct AIAction {
        string actionType;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 slippage;
        uint256 deadline;
        bytes signature;
    }

    struct CrossChainSwap {
        bytes32 swapId;
        address user;
        string sourceChain;
        string destinationChain;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 expectedAmountOut;
        uint256 deadline;
        bool executed;
        bytes32 htlcHash;
    }

    struct PortfolioAllocation {
        address token;
        uint256 targetPercentage;
        uint256 currentAmount;
    }

    // State variables
    mapping(address => bool) public authorizedAI;
    mapping(bytes32 => CrossChainSwap) public crossChainSwaps;
    mapping(address => PortfolioAllocation[]) public userPortfolios;
    mapping(address => uint256) public userNonces;

    // 1inch integration
    IOrderMixin public immutable limitOrderProtocol;
    address public immutable oneInchRouter;

    // Constants
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    uint256 public constant MIN_DEADLINE = 300; // 5 minutes
    uint256 public constant MAX_DEADLINE = 3600; // 1 hour

    // Modifiers
    modifier onlyAuthorizedAI() {
        require(authorizedAI[msg.sender], "Unauthorized AI");
        _;
    }

    modifier validSlippage(uint256 slippage) {
        require(slippage <= MAX_SLIPPAGE, "Slippage too high");
        _;
    }

    modifier validDeadline(uint256 deadline) {
        require(deadline >= block.timestamp + MIN_DEADLINE, "Deadline too short");
        require(deadline <= block.timestamp + MAX_DEADLINE, "Deadline too long");
        _;
    }

    /**
     * @dev Constructor
     * @param _limitOrderProtocol 1inch Limit Order Protocol address
     * @param _oneInchRouter 1inch Router address
     */
    constructor(
        address _limitOrderProtocol,
        address _oneInchRouter
    ) Ownable(msg.sender) {
        require(_limitOrderProtocol != address(0), "Invalid limit order protocol");
        require(_oneInchRouter != address(0), "Invalid 1inch router");
        
        limitOrderProtocol = IOrderMixin(_limitOrderProtocol);
        oneInchRouter = _oneInchRouter;
    }

    /**
     * @dev Execute AI-powered action
     * @param action AI action to execute
     */
    function executeAIAction(AIAction calldata action) 
        external 
        onlyAuthorizedAI 
        nonReentrant 
        validSlippage(action.slippage)
        validDeadline(action.deadline)
    {
        require(action.amountIn > 0, "Invalid amount");
        require(action.tokenIn != action.tokenOut, "Same tokens");

        uint256 gasStart = gasleft();

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            action.actionType,
            action.tokenIn,
            action.tokenOut,
            action.amountIn,
            action.slippage,
            action.deadline,
            userNonces[msg.sender]++
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(action.signature);
        require(signer == owner(), "Invalid signature");

        // Execute action based on type
        if (keccak256(bytes(action.actionType)) == keccak256(bytes("swap"))) {
            _executeSwap(action);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("limit_order"))) {
            _executeLimitOrder(action);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("rebalance"))) {
            _executeRebalance(action);
        } else {
            revert("Unknown action type");
        }

        uint256 gasUsed = gasStart - gasleft();
        
        emit AIActionExecuted(
            msg.sender,
            action.actionType,
            action.tokenIn,
            action.tokenOut,
            action.amountIn,
            0, // amountOut will be set in specific functions
            gasUsed
        );
    }

    /**
     * @dev Initiate cross-chain swap
     * @param swap Cross-chain swap details
     */
    function initiateCrossChainSwap(CrossChainSwap calldata swap)
        external
        onlyAuthorizedAI
        nonReentrant
    {
        require(swap.amountIn > 0, "Invalid amount");
        require(swap.deadline > block.timestamp, "Expired deadline");
        require(!crossChainSwaps[swap.swapId].executed, "Swap already exists");

        // Transfer tokens to this contract
        IERC20(swap.tokenIn).safeTransferFrom(msg.sender, address(this), swap.amountIn);

        // Store swap details
        crossChainSwaps[swap.swapId] = swap;

        emit CrossChainSwapInitiated(
            swap.swapId,
            swap.user,
            swap.sourceChain,
            swap.destinationChain,
            swap.tokenIn,
            swap.tokenOut,
            swap.amountIn,
            swap.expectedAmountOut
        );
    }

    /**
     * @dev Complete cross-chain swap
     * @param swapId Swap identifier
     * @param secret HTLC secret
     */
    function completeCrossChainSwap(bytes32 swapId, bytes32 secret)
        external
        onlyAuthorizedAI
        nonReentrant
    {
        CrossChainSwap storage swap = crossChainSwaps[swapId];
        require(swap.executed == false, "Swap already executed");
        require(swap.deadline > block.timestamp, "Swap expired");
        require(keccak256(abi.encodePacked(secret)) == swap.htlcHash, "Invalid secret");

        swap.executed = true;

        // Transfer tokens to user
        IERC20(swap.tokenOut).safeTransfer(swap.user, swap.expectedAmountOut);

        // Emit completion event
        emit AIActionExecuted(
            swap.user,
            "cross_chain_swap_complete",
            swap.tokenIn,
            swap.tokenOut,
            swap.amountIn,
            swap.expectedAmountOut,
            0
        );
    }

    /**
     * @dev Create limit order using 1inch protocol
     * @param order 1inch limit order parameters
     */
    function createLimitOrder(IOrderMixin.Order calldata order)
        external
        onlyAuthorizedAI
        nonReentrant
    {
        // Approve tokens to limit order protocol
        IERC20(order.makerAsset).safeApprove(address(limitOrderProtocol), order.makingAmount);

        // Create order
        bytes32 orderHash = limitOrderProtocol.fillOrder(order, order.makingAmount, order.takingAmount);

        emit LimitOrderCreated(
            orderHash,
            order.maker,
            order.makerAsset,
            order.takerAsset,
            order.makingAmount,
            order.takingAmount,
            order.expiration
        );
    }

    /**
     * @dev Set portfolio allocation for user
     * @param allocations Portfolio allocations
     */
    function setPortfolioAllocation(PortfolioAllocation[] calldata allocations)
        external
        onlyAuthorizedAI
    {
        delete userPortfolios[msg.sender];
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            require(allocations[i].token != address(0), "Invalid token");
            totalPercentage += allocations[i].targetPercentage;
            userPortfolios[msg.sender].push(allocations[i]);
        }
        
        require(totalPercentage == 10000, "Total must be 100%"); // Basis points
    }

    /**
     * @dev Authorize AI agent
     * @param aiAgent AI agent address
     * @param authorized Authorization status
     */
    function setAIAuthorization(address aiAgent, bool authorized)
        external
        onlyOwner
    {
        require(aiAgent != address(0), "Invalid AI agent");
        authorizedAI[aiAgent] = authorized;
    }

    /**
     * @dev Emergency withdraw tokens
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount)
        external
        onlyOwner
    {
        IERC20(token).safeTransfer(owner(), amount);
    }

    // Internal functions

    /**
     * @dev Execute swap using 1inch
     */
    function _executeSwap(AIAction calldata action) internal {
        // This would integrate with 1inch router
        // For now, just transfer tokens
        IERC20(action.tokenIn).safeTransferFrom(msg.sender, address(this), action.amountIn);
        
        // Mock swap execution
        uint256 amountOut = action.amountIn; // Simplified for demo
        IERC20(action.tokenOut).safeTransfer(msg.sender, amountOut);
    }

    /**
     * @dev Execute limit order
     */
    function _executeLimitOrder(AIAction calldata action) internal {
        // Create limit order using 1inch protocol
        IOrderMixin.Order memory order = IOrderMixin.Order({
            maker: msg.sender,
            makerAsset: action.tokenIn,
            takerAsset: action.tokenOut,
            makingAmount: action.amountIn,
            takingAmount: action.amountIn, // Simplified for demo
            salt: uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))),
            expiration: action.deadline
        });

        createLimitOrder(order);
    }

    /**
     * @dev Execute portfolio rebalancing
     */
    function _executeRebalance(AIAction calldata action) internal {
        PortfolioAllocation[] storage portfolio = userPortfolios[msg.sender];
        require(portfolio.length > 0, "No portfolio set");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < portfolio.length; i++) {
            totalValue += IERC20(portfolio[i].token).balanceOf(msg.sender);
        }

        // Execute rebalancing trades
        for (uint256 i = 0; i < portfolio.length; i++) {
            uint256 targetAmount = (totalValue * portfolio[i].targetPercentage) / 10000;
            uint256 currentAmount = IERC20(portfolio[i].token).balanceOf(msg.sender);
            
            if (currentAmount > targetAmount) {
                // Sell excess
                uint256 excess = currentAmount - targetAmount;
                IERC20(portfolio[i].token).safeTransferFrom(msg.sender, address(this), excess);
            } else if (targetAmount > currentAmount) {
                // Buy more
                uint256 needed = targetAmount - currentAmount;
                // This would execute a swap to get the needed amount
            }
        }

        emit PortfolioRebalanced(msg.sender, totalValue, 0, block.timestamp);
    }

    /**
     * @dev Get user portfolio
     */
    function getUserPortfolio(address user) external view returns (PortfolioAllocation[] memory) {
        return userPortfolios[user];
    }

    /**
     * @dev Get cross-chain swap details
     */
    function getCrossChainSwap(bytes32 swapId) external view returns (CrossChainSwap memory) {
        return crossChainSwaps[swapId];
    }

    /**
     * @dev Check if address is authorized AI
     */
    function isAuthorizedAI(address aiAgent) external view returns (bool) {
        return authorizedAI[aiAgent];
    }

    /**
     * @dev Get user nonce
     */
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }
} 