# 🌐 NEAR Fusion+ Smart Contracts

This directory contains the NEAR smart contracts for the Fusion+ cross-chain swap integration, implementing HTLC-based atomic swaps with NEAR's Chain Signatures.

## 📋 Overview

The NEAR contracts consist of three main components:

1. **Fusion Escrow Contract** (`fusion-escrow/`) - Handles HTLC-based atomic swaps
2. **Fusion Solver Contract** (`fusion-solver/`) - Manages decentralized solvers and Chain Signatures
3. **Fusion Pool Contract** (`fusion-pool/`) - Provides liquidity management for solvers

## 🏗️ Architecture

### Contract Relationships

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fusion Pool   │    │  Fusion Solver  │    │ Fusion Escrow   │
│                 │    │                 │    │                 │
│ • Liquidity     │◄──►│ • Solver        │◄──►│ • HTLC Orders   │
│   Management    │    │   Registry      │    │ • Cross-Chain   │
│ • Rewards       │    │ • Chain         │    │   Swaps         │
│ • Staking       │    │   Signatures    │    │ • Token         │
└─────────────────┘    └─────────────────┘    │   Transfers     │
                                              └─────────────────┘
```

### Key Features

- **HTLC Security**: Hash Time-Locked Contracts for atomic swaps
- **Chain Signatures**: NEAR's decentralized MPC for cross-chain interactions
- **Decentralized Solvers**: Permissionless solver network
- **Liquidity Pools**: Automated liquidity provision and management
- **Cross-Chain Support**: EVM ↔ NEAR atomic swaps

## 🚀 Quick Start

### Prerequisites

1. **Rust & Cargo**: Install Rust toolchain
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **NEAR CLI**: Install NEAR CLI v4
   ```bash
   npm install -g near-cli
   ```

3. **NEAR Account**: Create a NEAR testnet account
   ```bash
   near create-account <your-account>.testnet --masterAccount testnet --initialBalance 50
   ```

### Build Contracts

```bash
# Build all contracts
cargo build --release --workspace

# Or use the deployment script
./deploy.sh --build-only
```

### Deploy to Testnet

```bash
# Deploy all contracts
./deploy.sh

# Or deploy with existing account
export OWNER_ACCOUNT=<your-account>.testnet
./deploy.sh
```

## 📁 Contract Structure

### Fusion Escrow Contract

**Purpose**: Handles HTLC-based atomic swaps between EVM and NEAR chains.

**Key Functions**:
- `create_order()` - Create new escrow order
- `fund_order()` - Fund escrow with tokens
- `claim_order()` - Claim tokens using secret
- `refund_order()` - Refund if timelock expires
- `create_cross_chain_swap()` - Create cross-chain swap

**Data Structures**:
```rust
pub struct EscrowOrder {
    pub id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub from_amount: U128,
    pub to_amount: U128,
    pub hashlock: String,
    pub secret: Option<String>,
    pub timelock: U64,
    pub status: OrderStatus,
    pub created_at: U64,
    pub expires_at: U64,
}
```

### Fusion Solver Contract

**Purpose**: Manages decentralized solvers and Chain Signatures for Fusion+ integration.

**Key Functions**:
- `register_solver()` - Register new solver
- `create_pool()` - Create solver liquidity pool
- `request_quote()` - Request swap quote
- `provide_quote()` - Provide quote as solver
- `create_order()` - Create Fusion+ order
- `execute_order()` - Execute order
- `verify_signature()` - Verify Chain Signature

**Data Structures**:
```rust
pub struct Solver {
    pub account_id: AccountId,
    pub name: String,
    pub description: String,
    pub version: String,
    pub code_hash: String,
    pub is_active: bool,
    pub total_solves: u64,
    pub success_rate: f64,
    pub total_volume: U128,
    pub total_fees: U128,
    pub registered_at: U64,
    pub last_active: U64,
}
```

### Fusion Pool Contract

**Purpose**: Manages liquidity provision for solvers and reward distribution.

**Key Functions**:
- `create_pool()` - Create liquidity pool
- `deposit_liquidity()` - Deposit liquidity
- `withdraw_liquidity()` - Withdraw liquidity
- `claim_rewards()` - Claim rewards
- `add_rewards()` - Add rewards to pool

**Data Structures**:
```rust
pub struct LiquidityPool {
    pub id: String,
    pub name: String,
    pub description: String,
    pub solver: AccountId,
    pub token: AccountId,
    pub total_liquidity: U128,
    pub available_liquidity: U128,
    pub total_shares: U128,
    pub fee_rate: u32,
    pub min_deposit: U128,
    pub max_deposit: U128,
    pub is_active: bool,
    pub created_at: U64,
    pub last_updated: U64,
}
```

## 🔧 Usage Examples

### 1. Create Cross-Chain Swap

```bash
# Create EVM to NEAR swap
near call <escrow-contract> create_cross_chain_swap \
  --args '{
    "evm_order_hash": "0x123...",
    "evm_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "from_chain": "ethereum",
    "to_chain": "near",
    "from_token": "ETH",
    "to_token": "NEAR",
    "from_amount": "1000000000000000000",
    "to_amount": "980000000000000000000",
    "hashlock": "abc123...",
    "timelock": 3600
  }' \
  --accountId <your-account>.testnet
```

### 2. Register Solver

```bash
# Register as a solver
near call <solver-contract> register_solver \
  --args '{
    "name": "My Solver",
    "description": "A Fusion+ solver",
    "version": "1.0.0",
    "code_hash": "abc123..."
  }' \
  --accountId <your-account>.testnet
```

### 3. Create Liquidity Pool

```bash
# Create solver pool
near call <pool-contract> create_pool \
  --args '{
    "pool_id": "pool1",
    "name": "My Pool",
    "description": "A liquidity pool",
    "token": "usdc.fakes.testnet",
    "fee_rate": 100,
    "min_deposit": "1000000000",
    "max_deposit": "1000000000000"
  }' \
  --accountId <your-account>.testnet
```

### 4. Deposit Liquidity

```bash
# Deposit liquidity to pool
near call <pool-contract> deposit_liquidity \
  --args '{"pool_id": "pool1"}' \
  --accountId <your-account>.testnet \
  --deposit 10
```

## 🧪 Testing

### Run Unit Tests

```bash
# Test all contracts
cargo test --workspace

# Test specific contract
cargo test -p fusion-escrow
cargo test -p fusion-solver
cargo test -p fusion-pool
```

### Run Integration Tests

```bash
# Test deployed contracts
./deploy.sh --test-only
```

### Manual Testing

```bash
# Test escrow contract
near view <escrow-contract> get_statistics

# Test solver contract
near view <solver-contract> get_statistics

# Test pool contract
near view <pool-contract> get_statistics
```

## 🔒 Security Features

### HTLC Implementation

- **Secret Generation**: Cryptographically secure random secrets
- **Hashlock Creation**: SHA256 hash of secrets
- **Timelock Support**: Configurable timelocks (1-24 hours)
- **Atomic Swaps**: Either both parties get tokens or neither does

### Chain Signatures

- **Decentralized MPC**: Multi-party computation for signing
- **TEE Protection**: Trusted Execution Environment security
- **Verifiable Code**: Transparent and auditable solver code
- **No Single Point of Failure**: Distributed signing network

### Access Control

- **Owner-Only Functions**: Critical functions restricted to contract owner
- **Solver Verification**: Solvers must be registered and active
- **Pool Validation**: Liquidity pools must meet requirements
- **Timelock Enforcement**: Automatic refunds on expiration

## 📊 Monitoring

### Contract Statistics

```bash
# Get escrow statistics
near view <escrow-contract> get_statistics

# Get solver statistics
near view <solver-contract> get_statistics

# Get pool statistics
near view <pool-contract> get_statistics
```

### Explorer Links

After deployment, contracts can be viewed on NEAR Explorer:
- Owner Account: `https://explorer.testnet.near.org/accounts/<owner-account>`
- Escrow Contract: `https://explorer.testnet.near.org/accounts/<escrow-contract>`
- Solver Contract: `https://explorer.testnet.near.org/accounts/<solver-contract>`
- Pool Contract: `https://explorer.testnet.near.org/accounts/<pool-contract>`

## 🔧 Configuration

### Environment Variables

```bash
# NEAR Configuration
export NEAR_NETWORK=testnet
export NEAR_NODE_URL=https://rpc.testnet.near.org
export OWNER_ACCOUNT=<your-account>.testnet

# Contract Addresses (set after deployment)
export ESCROW_CONTRACT=<escrow-contract>
export SOLVER_CONTRACT=<solver-contract>
export POOL_CONTRACT=<pool-contract>
```

### Contract Parameters

**Escrow Contract**:
- `fee_rate`: 30 basis points (0.3%)
- `min_timelock`: 3600 seconds (1 hour)
- `max_timelock`: 86400 seconds (24 hours)

**Solver Contract**:
- `min_solver_stake`: 100 NEAR
- `max_solver_fee`: 500 basis points (5%)
- `quote_timeout`: 300 seconds (5 minutes)

**Pool Contract**:
- `min_pool_fee`: 10 basis points (0.1%)
- `max_pool_fee`: 1000 basis points (10%)
- `min_deposit_amount`: 1 NEAR
- `reward_distribution_interval`: 86400 seconds (1 day)

## 🚀 Deployment

### Automated Deployment

```bash
# Full deployment
./deploy.sh

# Build only
./deploy.sh --build-only

# Test only
./deploy.sh --test-only
```

### Manual Deployment

```bash
# 1. Build contracts
cargo build --release --workspace

# 2. Create accounts
near create-account <escrow-contract> --masterAccount <owner-account> --initialBalance 10
near create-account <solver-contract> --masterAccount <owner-account> --initialBalance 10
near create-account <pool-contract> --masterAccount <owner-account> --initialBalance 10

# 3. Deploy contracts
near deploy <escrow-contract> --wasmFile target/release/fusion_escrow.wasm --initFunction new --initArgs '{"owner": "<owner-account>"}' --accountId <owner-account>

near deploy <solver-contract> --wasmFile target/release/fusion_solver.wasm --initFunction new --initArgs '{"owner": "<owner-account>", "escrow_contract": "<escrow-contract>"}' --accountId <owner-account>

near deploy <pool-contract> --wasmFile target/release/fusion_pool.wasm --initFunction new --initArgs '{"owner": "<owner-account>", "solver_contract": "<solver-contract>"}' --accountId <owner-account>
```

## 🔗 Integration

### Frontend Integration

The contracts are integrated with the frontend through the `NEARService` class:

```typescript
import { NEARService, NEAR_CONFIGS } from './near-service';

const nearService = new NEARService({
  ...NEAR_CONFIGS.testnet,
  contracts: {
    escrow: '<escrow-contract>',
    solver: '<solver-contract>',
    pool: '<pool-contract>'
  }
});

// Create cross-chain swap
const swap = await nearService.createCrossChainSwap({
  evmOrderHash: '0x123...',
  evmAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  fromChain: 'ethereum',
  toChain: 'near',
  fromToken: 'ETH',
  toToken: 'NEAR',
  fromAmount: '1000000000000000000',
  toAmount: '980000000000000000000',
  hashlock: 'abc123...',
  timelock: 3600
});
```

### Backend Integration

The contracts can be called from the backend using the integration script:

```javascript
const NEARContractIntegration = require('./integrate-with-frontend');

const integration = new NEARContractIntegration({
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  accountId: '<your-account>.testnet',
  privateKey: '<your-private-key>'
});

await integration.initialize();

// Create escrow order
const orderId = await integration.createEscrowOrder({
  taker: '<taker-account>',
  fromToken: 'usdc.fakes.testnet',
  toToken: 'testnet',
  fromAmount: '1000000000',
  toAmount: '980000000000000000000',
  hashlock: 'abc123...',
  timelock: 3600
});
```

## 📈 Performance

### Gas Optimization

- **Storage Optimization**: Efficient data structures and storage patterns
- **Batch Operations**: Multiple operations in single transaction
- **Gas Estimation**: Accurate gas estimation for all operations
- **Optimized Loops**: Minimal gas usage in loops and iterations

### Scalability

- **Sharding Ready**: Compatible with NEAR's sharding
- **Parallel Processing**: Support for concurrent operations
- **State Management**: Efficient state updates and queries
- **Memory Management**: Optimized memory usage

## 🐛 Troubleshooting

### Common Issues

1. **Account Creation Fails**
   ```bash
   # Check NEAR CLI version
   near --version
   
   # Try manual account creation
   near create-account <account>.testnet --masterAccount testnet --initialBalance 50
   ```

2. **Contract Deployment Fails**
   ```bash
   # Check WASM file exists
   ls -la target/release/*.wasm
   
   # Rebuild contracts
   cargo clean && cargo build --release --workspace
   ```

3. **Function Call Fails**
   ```bash
   # Check account balance
   near state <account>.testnet
   
   # Check function arguments
   near view <contract> <function> --args '{}'
   ```

### Debug Commands

```bash
# View contract state
near state <contract>

# View contract storage
near storage <contract>

# View transaction status
near tx-status <hash> <account>

# View account keys
near keys <account>
```

## 📚 Resources

- [NEAR Protocol Documentation](https://docs.near.org/)
- [NEAR SDK Documentation](https://www.near-sdk.io/)
- [NEAR CLI Documentation](https://docs.near.org/tools/near-cli)
- [Chain Signatures Documentation](https://docs.near.org/develop/chain-signatures)
- [Fusion+ Documentation](https://docs.1inch.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ by the UniteAI Wallet Team** 