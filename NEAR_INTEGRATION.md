# 🌐 NEAR Cross-Chain Swap Integration

This document describes the implementation of EVM to NEAR L1 cross-chain swaps using 1inch Fusion+ technology and NEAR's Chain Signatures.

## 🎯 Overview

The NEAR cross-chain swap integration enables users to swap tokens between EVM chains (Ethereum, Polygon, Arbitrum, Base) and NEAR Protocol using:

- **1inch Fusion+**: For EVM-side order execution
- **NEAR Chain Signatures**: For secure cross-chain interactions
- **Ref Finance**: For NEAR-side DEX operations
- **HTLC (Hash Time-Locked Contracts)**: For atomic swap security

## 🏗️ Architecture

### Components

1. **NEAR Service** (`src/services/near-service.ts`)
   - NEAR wallet connection and account management
   - Token balance queries and transfers
   - Fusion+ order creation and management
   - HTLC secret/hashlock generation

2. **Fusion+ Service Extension** (`src/services/fusion-plus.ts`)
   - Cross-chain quote generation
   - EVM to NEAR swap execution
   - Order status tracking
   - Route optimization

3. **React Hook** (`src/hooks/useNEARCrossChainSwap.ts`)
   - State management for cross-chain swaps
   - Quote fetching and swap execution
   - NEAR wallet integration
   - Error handling and loading states

4. **UI Component** (`src/components/chains/near-cross-chain-swap.tsx`)
   - Modern swap interface
   - Chain and token selection
   - Quote display and route visualization
   - Swap status tracking

5. **Backend API** (`src/backend/simple-server.js`)
   - NEAR cross-chain quote endpoints
   - Swap execution endpoints
   - Status tracking endpoints

## 🔄 Swap Flow

### EVM → NEAR Flow

```
1. User initiates swap (EVM → NEAR)
2. Get quote from Fusion+ (EVM side)
3. Get quote from Ref Finance (NEAR side)
4. Create Fusion+ order on EVM
5. Create NEAR Fusion order with HTLC
6. Wait for EVM order to be filled
7. Reveal secret to claim NEAR tokens
8. Complete cross-chain transfer
```

### NEAR → EVM Flow

```
1. User initiates swap (NEAR → EVM)
2. Create NEAR HTLC with tokens
3. Get quote from Fusion+ (EVM side)
4. Create Fusion+ order on EVM
5. Wait for NEAR HTLC to be funded
6. Claim EVM tokens using revealed secret
7. Complete cross-chain transfer
```

## 🛠️ Implementation Details

### NEAR Service Features

- **Account Management**: Connect to NEAR wallet and manage accounts
- **Token Operations**: Query balances and transfer fungible tokens
- **HTLC Support**: Generate secrets and hashlock for atomic swaps
- **DEX Integration**: Interface with Ref Finance for NEAR swaps
- **Fusion+ Orders**: Create and manage Fusion+ orders on NEAR

### Fusion+ Integration

- **Cross-Chain Quotes**: Get quotes for EVM ↔ NEAR swaps
- **Order Execution**: Execute Fusion+ orders on both chains
- **Status Tracking**: Monitor swap progress across chains
- **Route Optimization**: Find optimal paths for cross-chain swaps

### Security Features

- **HTLC Protection**: Atomic swap security using hash time-locks
- **Secret Management**: Secure generation and verification of secrets
- **Timelock Support**: Configurable timelocks for swap safety
- **Error Handling**: Comprehensive error handling and recovery

## 🚀 Getting Started

### Prerequisites

1. **NEAR Account**: Create a NEAR account for testing
2. **1inch API Key**: Get API key from 1inch developer portal
3. **Environment Variables**: Configure required environment variables

### Environment Setup

```bash
# NEAR Configuration
NEAR_RPC_URL=https://rpc.mainnet.near.org
NEAR_TESTNET_RPC_URL=https://rpc.testnet.near.org
NEAR_ACCOUNT_ID=your_near_account_id
NEAR_PRIVATE_KEY=your_near_private_key

# 1inch Configuration
INCH_API_KEY=your_1inch_api_key

# EVM Configuration
ETHEREUM_RPC_URL=your_ethereum_rpc_url
PRIVATE_KEY=your_evm_private_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server
npm run dev:backend
```

### Usage

1. **Connect Wallets**: Connect both EVM and NEAR wallets
2. **Select Chains**: Choose source (EVM) and destination (NEAR) chains
3. **Select Tokens**: Choose tokens to swap
4. **Get Quote**: Get cross-chain swap quote
5. **Execute Swap**: Execute the cross-chain swap
6. **Monitor Status**: Track swap progress

## 📊 Supported Features

### Chains
- **EVM Chains**: Ethereum, Polygon, Arbitrum, Base
- **Non-EVM**: NEAR Protocol

### Tokens
- **Ethereum**: ETH, USDC, USDT
- **Polygon**: MATIC, USDC
- **Arbitrum**: ETH, USDC
- **Base**: ETH, USDC
- **NEAR**: NEAR, USDC, USDT, wNEAR

### Features
- ✅ Cross-chain quotes
- ✅ Atomic swap execution
- ✅ HTLC security
- ✅ Route optimization
- ✅ Status tracking
- ✅ Error handling
- ✅ Partial fills support
- ✅ Timelock configuration

## 🔧 API Endpoints

### NEAR Cross-Chain Quote
```bash
POST /api/near/cross-chain-quote
{
  "fromChain": "ethereum",
  "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
  "toToken": "NEAR",
  "fromAmount": "1000000000000000000",
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nearAccountId": "user.near"
}
```

### NEAR Cross-Chain Swap
```bash
POST /api/near/cross-chain-swap
{
  "fromChain": "ethereum",
  "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
  "toToken": "NEAR",
  "fromAmount": "1000000000000000000",
  "toAmount": "980000000000000000000",
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nearAccountId": "user.near",
  "deadline": 1640995200,
  "timelock": 3600
}
```

### NEAR Swap Status
```bash
GET /api/near/swap-status/:swapId
```

## 🎨 UI Components

### NEAR Cross-Chain Swap Interface

The main swap interface includes:

- **Chain Selection**: Choose from supported EVM chains
- **Token Selection**: Select source and destination tokens
- **Amount Input**: Enter swap amounts with balance display
- **Quote Display**: Show cross-chain swap quotes and routes
- **Swap Execution**: Execute swaps with progress tracking
- **Status Monitoring**: Track swap status across chains

### Features

- **Modern Design**: Clean, intuitive interface
- **Real-time Updates**: Live quote and status updates
- **Error Handling**: Comprehensive error messages
- **Loading States**: Visual feedback during operations
- **Responsive Design**: Works on desktop and mobile

## 🔒 Security Considerations

### HTLC Implementation

- **Secret Generation**: Cryptographically secure random secrets
- **Hashlock Creation**: SHA256 hash of secrets for HTLC
- **Timelock Support**: Configurable timelocks for safety
- **Atomic Swaps**: Ensures either both parties get tokens or neither does

### Chain Signatures

- **Decentralized MPC**: Multi-party computation for signing
- **TEE Protection**: Trusted Execution Environment security
- **Verifiable Code**: Transparent and auditable solver code
- **No Single Point of Failure**: Distributed signing network

### Error Handling

- **Network Failures**: Graceful handling of network issues
- **Insufficient Funds**: Clear error messages for balance issues
- **Timeout Handling**: Automatic retry and recovery mechanisms
- **Transaction Failures**: Rollback and refund mechanisms

## 🧪 Testing

### Test Scenarios

1. **Quote Generation**: Test cross-chain quote accuracy
2. **Swap Execution**: Test complete swap flow
3. **Error Handling**: Test various error conditions
4. **Network Issues**: Test network failure scenarios
5. **Security**: Test HTLC and timelock mechanisms

### Test Commands

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run NEAR-specific tests
npm run test:near
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**: Set production environment variables
2. **NEAR Network**: Configure for NEAR mainnet
3. **API Keys**: Configure production API keys
4. **Monitoring**: Set up monitoring and alerting
5. **Security**: Implement additional security measures

### Deployment Commands

```bash
# Build for production
npm run build

# Deploy to production
npm run deploy

# Start production server
npm start
```

## 📈 Future Enhancements

### Planned Features

- **Additional Chains**: Support for more EVM and non-EVM chains
- **Advanced Routing**: Multi-hop cross-chain routing
- **Liquidity Pools**: Direct liquidity provision
- **Solver Network**: Decentralized solver network integration
- **Mobile Support**: Native mobile app support

### Performance Optimizations

- **Caching**: Implement quote and status caching
- **Batch Processing**: Batch multiple swaps
- **Gas Optimization**: Optimize gas usage across chains
- **Parallel Execution**: Parallel processing for faster swaps

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript and React best practices
2. **Testing**: Write comprehensive tests for new features
3. **Documentation**: Update documentation for changes
4. **Security**: Ensure security best practices
5. **Performance**: Optimize for performance and scalability

### Pull Request Process

1. **Fork Repository**: Fork the main repository
2. **Create Branch**: Create feature branch
3. **Implement Changes**: Implement and test changes
4. **Submit PR**: Submit pull request with description
5. **Code Review**: Address review comments
6. **Merge**: Merge after approval

## 📞 Support

### Getting Help

- **Documentation**: Check this README and API documentation
- **Issues**: Report bugs and issues on GitHub
- **Discussions**: Join community discussions
- **Support**: Contact support team for assistance

### Resources

- [NEAR Protocol Documentation](https://docs.near.org/)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
- [Ref Finance Documentation](https://guide.ref.finance/)
- [Chain Signatures Documentation](https://docs.near.org/develop/chain-signatures)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the UniteAI Wallet Team** 