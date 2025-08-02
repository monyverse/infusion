# 🚀 UniteAI Wallet

**AI-Powered Cross-Chain Wallet Automation with 1inch Fusion+ Integration**

UniteAI Wallet is a revolutionary DeFi platform that combines artificial intelligence with cross-chain atomic swaps, enabling seamless token exchanges across 17+ blockchain networks including Ethereum, Bitcoin, NEAR, Stellar, and Etherlink.

## 🌟 Key Features

### 🤖 AI-Powered Automation
- **Natural Language Commands**: Execute complex DeFi operations using plain English
- **Portfolio Management**: AI-driven portfolio rebalancing and risk management
- **Intent-Based Trading**: Describe your goals and let AI execute the strategy
- **Automated Strategies**: Set-and-forget trading strategies with AI monitoring

### 🔗 Cross-Chain Atomic Swaps
- **17+ Blockchain Networks**: Ethereum, Bitcoin, NEAR, Stellar, Etherlink, and more
- **1inch Fusion+ Integration**: Advanced order routing and MEV protection
- **HTLC Security**: Hash Time-Locked Contracts for atomic swap safety
- **Zero Slippage**: Direct peer-to-peer swaps without intermediaries

### 🛡️ Advanced Security
- **Multi-Signature Support**: Enhanced security with multi-sig wallets
- **AI Transaction Validation**: Intelligent risk assessment and fraud detection
- **Chain Signatures**: NEAR's decentralized MPC for cross-chain operations
- **Timelock Protection**: Configurable timelocks for swap safety

### 📊 Portfolio Management
- **Real-Time Analytics**: Live portfolio tracking across all chains
- **Risk Assessment**: AI-powered risk analysis and recommendations
- **Performance Tracking**: Detailed performance metrics and reporting
- **Gamification**: Achievement system and rewards for active users

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Agents     │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (LangChain)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EVM Chains    │    │   NEAR Protocol │    │   Bitcoin       │
│   (Ethereum,    │    │   (Chain        │    │   (HTLC)        │
│    Polygon,     │    │    Signatures)  │    │                 │
│    Arbitrum)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Rust** (for NEAR contracts)
- **NEAR CLI** (`npm install -g near-cli`)
- **1inch API Key** (get from [1inch developer portal](https://portal.1inch.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/uniteai-wallet.git
   cd uniteai-wallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example env.local
   # Edit env.local with your API keys and configuration
   ```

4. **Build NEAR contracts**
   ```bash
   npm run near:build
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3003
- AI Agent Manager: http://localhost:3004

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# 1inch API Configuration
INCH_API_KEY=your_1inch_api_key_here

# AI Services
OPENAI_API_KEY=your_openai_api_key_here

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
SEPOLIA_RPC_URL=https://sepolia.drpc.org

# NEAR Configuration
NEAR_RPC_URL=https://rpc.mainnet.near.org
NEAR_ACCOUNT_ID=your_near_account_id
NEAR_PRIVATE_KEY=your_near_private_key

# Security
PRIVATE_KEY=your_ethereum_private_key_here
JWT_SECRET=your_jwt_secret_key_here
```

### Supported Networks

| Network | Chain ID | Status | Features |
|---------|----------|--------|----------|
| Ethereum | 1 | ✅ Production | Full support |
| Polygon | 137 | ✅ Production | Full support |
| Arbitrum | 42161 | ✅ Production | Full support |
| Base | 8453 | ✅ Production | Full support |
| NEAR | - | ✅ Production | Chain Signatures |
| Bitcoin | - | ✅ Production | HTLC |
| Stellar | - | ✅ Production | Atomic Swaps |
| Etherlink | - | ✅ Production | Full support |

## 🎯 Usage Examples

### AI Intent Processing

```typescript
// Natural language portfolio rebalancing
const intent = "Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins";
const result = await aiAgent.processIntent(intent);
```

### Cross-Chain Swap

```typescript
// EVM to NEAR cross-chain swap
const swapParams = {
  fromChain: 'ethereum',
  toChain: 'near',
  fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', // USDC
  toToken: 'NEAR',
  fromAmount: '1000000000', // 1000 USDC
  userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  nearAccountId: 'user.near'
};

const result = await fusionPlusService.executeNEARCrossChainSwap(swapParams);
```

### Bitcoin HTLC

```typescript
// Create Bitcoin HTLC for atomic swap
const htlcParams = {
  recipientPubKey: Buffer.from('...'),
  senderPubKey: Buffer.from('...'),
  locktime: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

const htlcAddress = bitcoinHTLC.generateHTLCAddress(
  hashlock,
  htlcParams.recipientPubKey,
  htlcParams.senderPubKey,
  htlcParams.locktime
);
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:ai          # AI agent tests
npm run test:contracts   # Smart contract tests
npm run test:integration # Integration tests
npm run test:near        # NEAR protocol tests
npm run test:btc         # Bitcoin tests
```

### Test NEAR Contracts
```bash
npm run near:test
```

## 🚀 Deployment

### Deploy Smart Contracts

```bash
# Deploy to all testnets
npm run deploy:testnets

# Deploy to specific network
npm run deploy:sepolia
npm run deploy:arbitrum-sepolia
npm run deploy:polygon-mumbai
```

### Deploy NEAR Contracts

```bash
# Build and deploy NEAR contracts
npm run near:deploy

# Build only
npm run near:deploy:build-only
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 API Documentation

### Core Endpoints

- `POST /api/ai/process-intent` - Process AI intent
- `POST /api/fusion-plus/quote` - Get Fusion+ quote
- `POST /api/fusion-plus/swap` - Execute Fusion+ swap
- `POST /api/near/cross-chain-quote` - Get NEAR cross-chain quote
- `POST /api/near/cross-chain-swap` - Execute NEAR cross-chain swap

### Health Check

```bash
curl http://localhost:3003/api/health
```

## 🔧 Development

### Project Structure

```
uniteai-wallet/
├── app/                    # Next.js app directory
├── src/
│   ├── ai/                # AI agents and automation
│   ├── backend/           # Express.js backend
│   ├── components/        # React components
│   ├── contracts/         # Smart contracts
│   ├── hooks/             # React hooks
│   ├── services/          # External service integrations
│   └── utils/             # Utility functions
├── near-contracts/        # NEAR smart contracts
├── btc/                   # Bitcoin integration
└── scripts/               # Deployment scripts
```

### Adding New Features

1. **New Chain Integration**
   - Add chain configuration in `src/lib/config.ts`
   - Implement chain-specific service in `src/services/`
   - Add UI components in `src/components/chains/`

2. **New AI Agent**
   - Create agent in `src/ai/agents/`
   - Register in `src/ai/agent-manager.ts`
   - Add tests in `test/ai/`

3. **New Smart Contract**
   - Add contract in `src/contracts/`
   - Update deployment scripts
   - Add verification scripts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow the existing code style
- Ensure security best practices

## 📈 Roadmap

### Q1 2025
- [ ] Mobile app development
- [ ] Advanced AI strategies
- [ ] Institutional features

### Q2 2025
- [ ] Layer 2 scaling solutions
- [ ] DeFi protocol integrations
- [ ] Advanced analytics

### Q3 2025
- [ ] Cross-chain DeFi protocols
- [ ] AI-powered yield farming
- [ ] Institutional custody

## 🛡️ Security

- **Audited Smart Contracts**: All contracts undergo security audits
- **Bug Bounty Program**: Active bug bounty for security researchers
- **Multi-Signature Wallets**: Enhanced security for large transactions
- **AI Fraud Detection**: Real-time transaction monitoring

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.uniteai.wallet](https://docs.uniteai.wallet)
- **Discord**: [UniteAI Community](https://discord.gg/uniteai)
- **Twitter**: [@UniteAIWallet](https://twitter.com/UniteAIWallet)
- **Email**: support@uniteai.wallet

## 🙏 Acknowledgments

- [1inch](https://1inch.io/) for Fusion+ technology
- [NEAR Protocol](https://near.org/) for Chain Signatures
- [OpenAI](https://openai.com/) for AI capabilities
- [Etherlink](https://etherlink.com/) for Tezos integration

---

**Built with ❤️ by the UniteAI Wallet Team** 