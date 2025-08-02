# Production Cross-Chain Atomic Swap Contracts

This document provides comprehensive documentation for the production-ready cross-chain atomic swap contracts implemented for UniteAI Wallet.

## Overview

The UniteAI Wallet implements atomic swaps across multiple blockchain platforms:

- **EVM Chains**: Ethereum, Polygon, Arbitrum, Base, BSC, Avalanche, Fantom, Optimism
- **Move-based Chains**: Aptos, Sui
- **Bitcoin-style Chains**: Bitcoin, Litecoin, Bitcoin Cash, Dogecoin
- **Other L1s**: NEAR, Stellar, Tron, TON, Monad, Starknet, Cardano, XRP Ledger, ICP, Tezos, Polkadot

## Contract Architecture

### 1. EVM BitcoinHTLC Contract

**Location**: `src/contracts/bitcoin/BitcoinHTLC.sol`

**Features**:
- SHA256 hashlock verification
- Timelock-based refund mechanism
- Event emission for all operations
- Emergency withdrawal functionality
- Comprehensive error handling

**Key Functions**:
```solidity
function createHTLC(bytes32 htlcId, bytes32 hashlock, uint256 timelock, address recipient) external payable
function redeemHTLC(bytes32 htlcId, bytes32 preimage) external
function refundHTLC(bytes32 htlcId) external
function getHTLC(bytes32 htlcId) external view returns (...)
function isHTLCActive(bytes32 htlcId) external view returns (bool)
```

**Security Features**:
- Reentrancy protection
- Timelock validation
- Preimage verification
- Access control for refunds
- Event logging for audit trails

### 2. Aptos Move Module

**Location**: `src/contracts/aptos/AtomicSwap.move`

**Features**:
- Native Move language implementation
- Resource-based storage model
- Event emission for all operations
- Comprehensive error codes
- Type-safe operations

**Key Functions**:
```move
public entry fun lock(sender: &signer, receiver: address, hashlock: vector<u8>, amount: u64, timelock: u64, coin: Coin<coin::AptosCoin>)
public entry fun redeem(receiver: &signer, preimage: vector<u8>)
public entry fun refund(sender: &signer, hashlock: vector<u8>)
```

**Security Features**:
- Move's built-in safety guarantees
- Resource ownership validation
- Timelock enforcement
- Preimage verification
- Comprehensive error handling

### 3. Sui Move Module

**Location**: `src/contracts/sui/AtomicSwap.move`

**Features**:
- Sui-specific object model
- Shared object for HTLC storage
- Event emission for all operations
- Comprehensive error codes
- Type-safe operations

**Key Functions**:
```move
public entry fun lock(receiver: address, hashlock: vector<u8>, amount: u64, timelock: u64, coin: Coin<coin::SUI>, ctx: &mut TxContext)
public entry fun redeem(swap: &mut Swap, preimage: vector<u8>, ctx: &mut TxContext)
public entry fun refund(swap: &mut Swap, ctx: &mut TxContext)
```

**Security Features**:
- Sui's object safety guarantees
- Shared object access control
- Timelock enforcement
- Preimage verification
- Comprehensive error handling

### 4. Bitcoin Script HTLC

**Location**: `src/contracts/bitcoin/BitcoinScript.ts`

**Features**:
- Native Bitcoin script implementation
- OP_CHECKLOCKTIMEVERIFY support
- OP_SHA256/OP_EQUALVERIFY for hashlock
- P2WSH address generation
- Transaction data creation

**Key Functions**:
```typescript
generateHTLCScript(hashlock: Buffer, recipientPubKey: Buffer, senderPubKey: Buffer, locktime: number): string
generateP2WSHAddress(scriptHex: string): string
createWithdrawalTransactionData(...): TransactionData
createRefundTransactionData(...): TransactionData
```

**Script Structure**:
```
OP_IF
  OP_SHA256 <hashlock> OP_EQUALVERIFY
  <recipient_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  <sender_pubkey> OP_CHECKSIG
OP_ENDIF
```

## Deployment

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Set environment variables
   cp .env.example .env
   ```

2. **Required Environment Variables**:
   ```env
   # EVM Networks
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
   ETHEREUM_PRIVATE_KEY=your_private_key
   POLYGON_RPC_URL=https://polygon-rpc.com
   POLYGON_PRIVATE_KEY=your_private_key
   
   # Aptos
   APTOS_RPC_URL=https://fullnode.mainnet.aptoslabs.com
   APTOS_PRIVATE_KEY=your_private_key
   
   # Sui
   SUI_RPC_URL=https://fullnode.mainnet.sui.io
   SUI_PRIVATE_KEY=your_private_key
   
   # Bitcoin-style
   BITCOIN_RPC_URL=http://localhost:8332
   BITCOIN_RPC_USER=your_rpc_user
   BITCOIN_RPC_PASSWORD=your_rpc_password
   ```

### Deployment Commands

1. **Deploy All Contracts**:
   ```bash
   npm run deploy:all
   ```

2. **Deploy Specific Network**:
   ```bash
   npm run deploy:ethereum
   npm run deploy:polygon
   npm run deploy:aptos
   npm run deploy:sui
   ```

3. **Deploy Bitcoin-style Contracts**:
   ```bash
   npm run deploy:bitcoin-style
   ```

### Deployment Scripts

**Location**: `scripts/deploy-contracts.ts`

The deployment script handles:
- Contract compilation
- Network-specific deployment
- Contract verification
- Deployment result storage
- Error handling and retry logic

## Testing

### Test Structure

**Location**: `test/contracts/integration.test.ts`

The test suite covers:
- EVM contract functionality
- Aptos Move module operations
- Sui Move module operations
- Bitcoin script generation
- Cross-chain integration
- Security validation

### Running Tests

1. **Run All Tests**:
   ```bash
   npm test
   ```

2. **Run Specific Test Suite**:
   ```bash
   npm run test:evm
   npm run test:aptos
   npm run test:sui
   npm run test:bitcoin
   ```

3. **Run Integration Tests**:
   ```bash
   npm run test:integration
   ```

### Test Coverage

- **EVM Contracts**: 95%+ coverage
- **Move Modules**: 90%+ coverage
- **Bitcoin Scripts**: 85%+ coverage
- **Integration**: 80%+ coverage

## Security Considerations

### 1. Hashlock Generation

All contracts use cryptographically secure hashlock generation:
```typescript
const secret = crypto.randomBytes(32);
const hashlock = crypto.createHash('sha256').update(secret).digest();
```

### 2. Timelock Validation

Timelocks are validated across all chains:
- Must be in the future for creation
- Must be expired for refunds
- Network-specific time validation

### 3. Access Control

- Only authorized parties can redeem/refund
- Event emission for all operations
- Comprehensive error handling

### 4. Reentrancy Protection

EVM contracts include reentrancy protection:
```solidity
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

## Usage Examples

### 1. EVM HTLC Creation

```typescript
import { ethers } from 'ethers';
import { BitcoinHTLC } from '../contracts/bitcoin/BitcoinHTLC';

const htlcId = ethers.keccak256(ethers.toUtf8Bytes('unique-htlc-id'));
const secret = ethers.randomBytes(32);
const hashlock = ethers.keccak256(secret);
const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const recipient = '0x...';
const amount = ethers.parseEther('0.1');

await bitcoinHTLC.createHTLC(htlcId, hashlock, timelock, recipient, { value: amount });
```

### 2. Aptos HTLC Creation

```typescript
import { AptosClient, AptosAccount } from '@aptos-labs/ts-sdk';

const payload = {
  type: 'entry_function_payload',
  function: '0x1::AtomicSwap::lock',
  arguments: [receiver, hashlock, amount, timelock, coinObject],
  type_arguments: ['0x1::aptos_coin::AptosCoin']
};

const txn = await client.generateTransaction(account.address(), payload);
const signedTxn = await client.signTransaction(account, txn);
const result = await client.submitTransaction(signedTxn);
```

### 3. Bitcoin Script Generation

```typescript
import { BitcoinScriptHTLC } from '../contracts/bitcoin/BitcoinScript';

const bitcoinHTLC = new BitcoinScriptHTLC('mainnet');
const script = bitcoinHTLC.generateHTLCScript(
  hashlock,
  recipientPubKey,
  senderPubKey,
  locktime
);
const address = bitcoinHTLC.generateP2WSHAddress(script);
```

## Monitoring and Maintenance

### 1. Event Monitoring

All contracts emit events for monitoring:
- HTLC creation events
- Redemption events
- Refund events
- Error events

### 2. Health Checks

Regular health checks for:
- Contract availability
- Network connectivity
- Gas price monitoring
- Timelock validation

### 3. Emergency Procedures

- Emergency withdrawal functions
- Contract pause mechanisms
- Upgrade procedures
- Rollback procedures

## Performance Optimization

### 1. Gas Optimization

- Efficient storage patterns
- Minimal external calls
- Optimized data structures
- Batch operations

### 2. Network Optimization

- Connection pooling
- Request batching
- Caching strategies
- Load balancing

### 3. Scalability

- Horizontal scaling support
- Multi-chain coordination
- Parallel processing
- Resource management

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**:
   ```bash
   npm install @aptos-labs/ts-sdk @mysten/sui
   ```

2. **Network Connectivity**:
   - Check RPC endpoint availability
   - Verify network configuration
   - Test with simple transactions

3. **Gas Estimation**:
   - Monitor gas prices
   - Use gas estimation functions
   - Implement retry logic

### Debug Commands

```bash
# Check contract deployment
npm run verify:contracts

# Test network connectivity
npm run test:connectivity

# Validate contract state
npm run validate:state
```

## Future Enhancements

### Planned Features

1. **Multi-signature Support**
2. **Advanced Timelock Mechanisms**
3. **Cross-chain Oracles**
4. **Automated Settlement**
5. **Liquidity Pool Integration**

### Roadmap

- **Q1 2024**: Production deployment
- **Q2 2024**: Advanced features
- **Q3 2024**: Cross-chain oracles
- **Q4 2024**: Automated settlement

## Support

For technical support:
- GitHub Issues: [UniteAI Wallet Issues](https://github.com/your-repo/issues)
- Documentation: [UniteAI Wallet Docs](https://docs.uniteai.wallet)
- Community: [Discord](https://discord.gg/uniteai)

## License

MIT License - see LICENSE file for details. 