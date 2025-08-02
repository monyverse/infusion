# Bitcoin Implementation

This folder contains the Bitcoin implementation for atomic swaps, based on the [hashlocked-cli](https://github.com/hashlocked-xyz/hashlocked-cli) architecture.

## Structure

```
btc/
├── 📁 cli/                    # Command-line interface
│   └── 📄 bitcoin-cli.ts     # Main CLI tool
├── 📁 scripts/               # Bitcoin script utilities
│   └── 📄 htlc-scripts.ts    # HTLC script generation
├── 📁 utils/                 # Utility functions
│   ├── 📄 key-manager.ts     # Key management utilities
│   └── 📄 transaction-builder.ts # Transaction building
├── 📁 config/                # Configuration
│   └── 📄 network-config.ts  # Network configuration
├── 📄 package.json           # Dependencies
├── 📄 tsconfig.json          # TypeScript configuration
└── 📄 README.md              # This file
```

## Features

### HTLC Script Generation
- Generate Bitcoin HTLC scripts for atomic swaps
- Create P2WSH addresses for HTLC contracts
- Generate random secrets and hashlocks
- Verify HTLC script validity

### Transaction Building
- Build raw Bitcoin transactions
- Create witness transactions
- Sign transactions with private keys
- Calculate transaction IDs

### Key Management
- Generate Bitcoin key pairs
- Import/export WIF format keys
- Sign and verify messages
- Validate addresses and keys

### Network Configuration
- Support for mainnet and testnet
- RPC connection management
- Address balance checking
- UTXO management

## Usage

### CLI Commands

```bash
# Generate HTLC script and address
npm run start generate-htlc \
  --network testnet \
  --recipient <pubkey> \
  --sender <pubkey> \
  --locktime 3600

# Create withdrawal transaction
npm run start create-withdrawal \
  --utxo <txid:vout> \
  --value <satoshis> \
  --recipient <address> \
  --amount <satoshis> \
  --secret <hex> \
  --hashlock <hex>

# Generate Bitcoin keys
npm run start generate-keys --network testnet

# Get address balance
npm run start get-balance --address <address> --network testnet

# Get address UTXOs
npm run start get-utxos --address <address> --network testnet
```

### Programmatic Usage

```typescript
import { BitcoinHTLCScripts } from './scripts/htlc-scripts';
import { BitcoinKeyManager } from './utils/key-manager';
import { BitcoinTransactionBuilder } from './utils/transaction-builder';
import { BitcoinConfig } from './config/network-config';

// Generate HTLC script
const htlcScripts = new BitcoinHTLCScripts('testnet');
const { secret, hashlock } = htlcScripts.generateSecretAndHashlock();
const script = htlcScripts.generateHTLCScript(
  hashlock,
  recipientPubKey,
  senderPubKey,
  locktime
);

// Generate keys
const keyManager = new BitcoinKeyManager('testnet');
const keyPair = keyManager.generateKeyPair();

// Build transaction
const txBuilder = new BitcoinTransactionBuilder('testnet');
const rawTx = txBuilder.buildRawTransaction(inputs, outputs);

// Network operations
const config = new BitcoinConfig('testnet');
const balance = await config.getAddressBalance(address);
const utxos = await config.getAddressUTXOs(address);
```

## HTLC Script Structure

The HTLC script follows this structure:

```
OP_IF
  OP_SHA256 <hashlock> OP_EQUALVERIFY
  <recipient_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  <sender_pubkey> OP_CHECKSIG
OP_ENDIF
```

### Withdrawal Path (with secret)
1. Push the secret
2. Verify it matches the hashlock
3. Verify recipient signature

### Refund Path (after timelock)
1. Verify current time > locktime
2. Verify sender signature

## Security Considerations

- **Private Keys**: Never expose private keys in production
- **Secrets**: Keep HTLC secrets secure until needed
- **Timelocks**: Set appropriate timelock durations
- **Network**: Use testnet for development and testing
- **Validation**: Always validate addresses and scripts

## Dependencies

- **crypto**: Node.js built-in crypto module
- **commander**: CLI argument parsing
- **TypeScript**: Type safety and compilation

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Integration with EVM

This Bitcoin implementation works together with the EVM contracts in the `evm/` folder to enable cross-chain atomic swaps:

1. **EVM→BTC**: EVM escrow locks tokens, Bitcoin HTLC created
2. **BTC→EVM**: Bitcoin HTLC locks BTC, EVM escrow created

The order management system in `orders/` and `reverse/` folders coordinates the swap flow between chains.

## References

- [Bitcoin Script](https://en.bitcoin.it/wiki/Script)
- [BIP-199 (HTLC)](https://github.com/bitcoin/bips/blob/master/bip-0199.mediawiki)
- [hashlocked-cli](https://github.com/hashlocked-xyz/hashlocked-cli)
- [Atomic Swaps](https://en.bitcoin.it/wiki/Atomic_swap) 