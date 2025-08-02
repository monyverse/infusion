# 🔁 Cross-Chain Atomic Swaps Implementation

This document describes the implementation of cross-chain atomic swaps using Hash Time-Locked Contracts (HTLC) and 1inch Fusion+ technology in the UniteAI Wallet.

## 🏗️ Architecture Overview

The cross-chain swap system supports:
- **EVM to EVM**: Using 1inch Fusion+ API
- **EVM to L1**: Using HTLC atomic swaps
- **L1 to L1**: Using HTLC atomic swaps

### Supported Chains

#### EVM Chains (Layer 2s)
- Ethereum (L1)
- Sepolia (Testnet)
- Arbitrum
- Polygon
- Base
- Optimism
- BSC
- Avalanche
- Fantom
- Etherlink

#### L1 Chains
- NEAR Protocol
- Aptos
- Sui
- Bitcoin

## 🔧 Implementation Details

### 1. Cross-Chain Coordinator Service

The `CrossChainCoordinator` class manages the entire cross-chain swap lifecycle:

```typescript
// Key methods
- initiateCrossChainSwap(): Creates a new swap with HTLC parameters
- executeCrossChainSwap(): Executes the complete swap flow
- getCrossChainQuote(): Gets pricing for cross-chain swaps
- refundSwap(): Handles refunds for expired swaps
```

### 2. Chain-Specific Services

#### Aptos Service (`src/services/aptos-service.ts`)
- HTLC lock/unlock functionality
- Move contract integration
- Balance checking and token management

#### Sui Service (`src/services/sui-service.ts`)
- HTLC operations using Sui Move
- Transaction block management
- Object-based HTLC implementation

#### NEAR Service (existing)
- Chain signatures for cross-chain operations
- Rust contract integration
- Account management

### 3. HTLC Implementation

#### HTLC Lifecycle
1. **Initiation**: Generate secret and hashlock
2. **Lock**: Lock funds on source chain with hashlock
3. **Lock**: Lock funds on destination chain with same hashlock
4. **Redeem**: Reveal secret to claim funds on destination
5. **Redeem**: Use revealed secret to claim funds on source
6. **Refund**: If not redeemed, refund after timelock expires

#### HTLC Parameters
```typescript
interface HTLCConfig {
  hashlock: string;    // SHA256 hash of secret
  timelock: number;    // Expiration time in seconds
  recipient: string;   // Destination address
  sender: string;      // Source address
  amount: string;      // Amount to swap
}
```

## 🚀 Usage Examples

### EVM to EVM Cross-Chain Swap

```typescript
// Using 1inch Fusion+
const fusionService = new FusionPlusService(config);
const quote = await fusionService.getCrossChainQuote({
  fromChainId: 1,        // Ethereum
  toChainId: 137,        // Polygon
  fromToken: "0x...",    // WETH
  toToken: "0x...",      // USDC
  fromAmount: "1000000000000000000", // 1 ETH
  userAddress: "0x..."
});
```

### EVM to L1 Cross-Chain Swap

```typescript
// Using HTLC coordinator
const coordinator = createCrossChainCoordinator();
const swapStatus = await coordinator.initiateCrossChainSwap({
  fromChain: "ethereum",
  toChain: "near",
  fromToken: "0x...",    // WETH
  toToken: "near",       // NEAR
  fromAmount: "1000000000000000000",
  userAddress: "0x..."
});
```

## 🔐 Security Features

### 1. HTLC Security
- **Secret Generation**: Cryptographically secure random secrets
- **Hashlock Verification**: SHA256 hash verification
- **Timelock Protection**: Automatic refund after expiration
- **Atomic Operations**: All-or-nothing swap execution

### 2. Chain-Specific Security
- **Aptos**: Move language type safety
- **Sui**: Object-based access control
- **NEAR**: Account-based permissions
- **EVM**: Smart contract validation

### 3. Error Handling
- **Network Failures**: Automatic retry mechanisms
- **Partial Failures**: Rollback capabilities
- **Timeout Handling**: Automatic refund processing
- **Invalid States**: State validation and recovery

## 📊 API Endpoints

### Cross-Chain Quote
```http
POST /api/cross-chain/quote
{
  "fromChain": "ethereum",
  "toChain": "near",
  "fromToken": "0x...",
  "toToken": "near",
  "fromAmount": "1000000000000000000",
  "userAddress": "0x..."
}
```

### Initiate Swap
```http
POST /api/cross-chain/initiate
{
  "fromChain": "ethereum",
  "toChain": "near",
  "fromToken": "0x...",
  "toToken": "near",
  "fromAmount": "1000000000000000000",
  "userAddress": "0x...",
  "recipientAddress": "0x...",
  "timelock": 3600
}
```

### Execute Swap
```http
POST /api/cross-chain/execute
{
  "swapId": "swap_1234567890_abc123",
  "userAddress": "0x..."
}
```

## 🧪 Testing

### Unit Tests
```bash
# Test cross-chain coordinator
npm test -- --testPathPattern=cross-chain

# Test individual services
npm test -- --testPathPattern=aptos-service
npm test -- --testPathPattern=sui-service
```

### Integration Tests
```bash
# Test complete swap flow
npm run test:integration

# Test with real networks (testnet)
npm run test:cross-chain:testnet
```

## 🔧 Development Setup

### 1. Install Dependencies
```bash
npm install
npm install @mysten/sui.js aptos
```

### 2. Environment Configuration
```env
# 1inch API
NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key

# Chain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# NEAR Configuration
NEAR_ACCOUNT_ID=your_account.testnet
NEAR_PRIVATE_KEY=your_private_key

# Aptos Configuration
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
APTOS_PRIVATE_KEY=your_private_key

# Sui Configuration
SUI_NODE_URL=https://fullnode.mainnet.sui.io:443
SUI_PRIVATE_KEY=your_private_key
```

### 3. Contract Deployment
```bash
# Deploy EVM contracts
npm run deploy:testnets

# Deploy NEAR contracts
npm run near:deploy

# Deploy Aptos contracts (manual)
cd aptos-contracts && cargo aptos move publish

# Deploy Sui contracts (manual)
cd sui-contracts && sui move publish
```

## 📈 Performance Optimization

### 1. Parallel Processing
- Concurrent HTLC operations on multiple chains
- Batch transaction processing
- Async quote fetching

### 2. Caching
- Quote caching with TTL
- Chain state caching
- User balance caching

### 3. Gas Optimization
- Gas estimation and optimization
- Transaction batching
- Priority fee management

## 🚨 Error Handling

### Common Error Scenarios
1. **Network Congestion**: Automatic retry with exponential backoff
2. **Insufficient Balance**: Pre-flight balance checks
3. **Invalid HTLC State**: State validation and recovery
4. **Timelock Expiration**: Automatic refund processing
5. **Chain Reorganization**: Transaction confirmation monitoring

### Error Recovery
```typescript
// Automatic retry mechanism
const maxRetries = 3;
const retryDelay = 1000; // 1 second

for (let i = 0; i < maxRetries; i++) {
  try {
    await executeSwap(swapParams);
    break;
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
  }
}
```

## 🔮 Future Enhancements

### 1. Additional L1 Chains
- **Starknet**: Cairo smart contracts
- **Cardano**: Plutus smart contracts
- **Polkadot**: Substrate pallets
- **Cosmos**: IBC integration

### 2. Advanced Features
- **Multi-hop Swaps**: Route through multiple chains
- **Liquidity Aggregation**: Best route finding
- **MEV Protection**: Slippage protection
- **Batch Swaps**: Multiple swaps in single transaction

### 3. User Experience
- **Real-time Status**: WebSocket updates
- **Progress Tracking**: Visual swap progress
- **Gas Optimization**: Automatic gas estimation
- **Mobile Support**: React Native integration

## 📚 Resources

### Documentation
- [1inch Fusion+ Documentation](https://docs.1inch.io/docs/fusion)
- [Aptos Move Documentation](https://aptos.dev/move/)
- [Sui Move Documentation](https://docs.sui.io/move)
- [NEAR Documentation](https://docs.near.org/)

### Code Examples
- [HTLC Implementation Examples](./examples/htlc-examples.md)
- [Cross-Chain Swap Tutorial](./examples/cross-chain-tutorial.md)
- [Integration Guide](./examples/integration-guide.md)

### Security Audits
- [HTLC Security Review](./security/htlc-audit.md)
- [Cross-Chain Security Analysis](./security/cross-chain-security.md)
- [Best Practices](./security/best-practices.md) 