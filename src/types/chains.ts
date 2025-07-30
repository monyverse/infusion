export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isEVM: boolean;
  isTestnet: boolean;
  priority: 'high' | 'medium' | 'low';
  fusionPlusSupported: boolean;
  limitOrderSupported: boolean;
  features: ChainFeature[];
}

export interface ChainFeature {
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
}

export interface CrossChainSwap {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  expectedAmount: string;
  route: SwapRoute[];
  estimatedGas: string;
  estimatedTime: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  hashlock?: string;
  timelock?: number;
  secret?: string;
}

export interface SwapRoute {
  chain: string;
  protocol: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fee: string;
}

export interface ChainBalance {
  chain: string;
  address: string;
  tokens: TokenBalance[];
  totalValueUSD: string;
  lastUpdated: number;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  priceUSD: string;
  valueUSD: string;
  logoURI?: string;
}

// Priority Fusion+ Chains
export const PRIORITY_CHAINS: ChainConfig[] = [
  {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    icon: '🟢',
    color: '#00D4AA',
    rpcUrl: process.env.APTOS_RPC_URL || 'https://fullnode.mainnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
    nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Move Smart Contracts', description: 'Native Move language support', enabled: true, priority: 1 },
      { name: 'Parallel Execution', description: 'High throughput parallel processing', enabled: true, priority: 2 },
      { name: 'Account Model', description: 'Resource-based account model', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '🟡',
    color: '#F7931A',
    rpcUrl: process.env.BITCOIN_RPC_URL || 'https://btc.getblock.io/mainnet',
    explorerUrl: 'https://blockstream.info',
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'UTXO Model', description: 'Unspent Transaction Output model', enabled: true, priority: 1 },
      { name: 'Script Support', description: 'Bitcoin Script for HTLCs', enabled: true, priority: 2 },
      { name: 'Lightning Network', description: 'Layer 2 scaling solution', enabled: false, priority: 3 }
    ]
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    symbol: 'ATOM',
    icon: '🌌',
    color: '#2E3148',
    rpcUrl: process.env.COSMOS_RPC_URL || 'https://rpc.cosmos.network',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    nativeCurrency: { name: 'Cosmos', symbol: 'ATOM', decimals: 6 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'IBC Protocol', description: 'Inter-Blockchain Communication', enabled: true, priority: 1 },
      { name: 'Tendermint Consensus', description: 'Byzantine Fault Tolerance', enabled: true, priority: 2 },
      { name: 'Multi-Chain Hub', description: 'Hub for multiple blockchains', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'near',
    name: 'NEAR',
    symbol: 'NEAR',
    icon: '🌐',
    color: '#000000',
    rpcUrl: process.env.NEAR_RPC_URL || 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://explorer.near.org',
    nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Sharding', description: 'Dynamic re-sharding', enabled: true, priority: 1 },
      { name: 'Shade Agents', description: 'TEE-based agents', enabled: true, priority: 2 },
      { name: 'Chain Signatures', description: 'Multi-chain interactions', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    icon: '🌊',
    color: '#6FBCF0',
    rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io',
    explorerUrl: 'https://suiexplorer.com',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Object Model', description: 'Object-oriented programming model', enabled: true, priority: 1 },
      { name: 'Move Language', description: 'Safe Move smart contracts', enabled: true, priority: 2 },
      { name: 'Parallel Execution', description: 'High throughput processing', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    icon: '⚡',
    color: '#FF0000',
    rpcUrl: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 6 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'DPoS Consensus', description: 'Delegated Proof of Stake', enabled: true, priority: 1 },
      { name: 'TRC20 Tokens', description: 'TRON token standard', enabled: true, priority: 2 },
      { name: 'High TPS', description: 'High transactions per second', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'stellar',
    name: 'Stellar',
    symbol: 'XLM',
    icon: '💫',
    color: '#000000',
    rpcUrl: process.env.STELLAR_RPC_URL || 'https://horizon.stellar.org',
    explorerUrl: 'https://stellar.expert',
    nativeCurrency: { name: 'Stellar Lumens', symbol: 'XLM', decimals: 7 },
    isEVM: false,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Stellar Consensus', description: 'Federated Byzantine Agreement', enabled: true, priority: 1 },
      { name: 'Atomic Swaps', description: 'Native atomic swap support', enabled: true, priority: 2 },
      { name: 'Multi-Currency', description: 'Multi-currency transactions', enabled: true, priority: 3 }
    ]
  }
];

// Standard Fusion+ Chains
export const STANDARD_CHAINS: ChainConfig[] = [
  {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    icon: '📱',
    color: '#0088CC',
    rpcUrl: process.env.TON_RPC_URL || 'https://toncenter.com/api/v2/jsonRPC',
    explorerUrl: 'https://tonscan.org',
    nativeCurrency: { name: 'TON', symbol: 'TON', decimals: 9 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'TON Blockchain', description: 'Telegram Open Network', enabled: true, priority: 1 },
      { name: 'Smart Contracts', description: 'TVM smart contracts', enabled: true, priority: 2 },
      { name: 'High Performance', description: 'High TPS and scalability', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'monad',
    name: 'Monad',
    symbol: 'MONAD',
    icon: '🏎️',
    color: '#FF6B35',
    rpcUrl: process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz',
    explorerUrl: 'https://explorer.monad.xyz',
    nativeCurrency: { name: 'Monad', symbol: 'MONAD', decimals: 18 },
    isEVM: true,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Parallel EVM', description: 'Parallel execution of EVM', enabled: true, priority: 1 },
      { name: 'High Throughput', description: '10,000+ TPS', enabled: true, priority: 2 },
      { name: 'EVM Compatible', description: 'Full Ethereum compatibility', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'starknet',
    name: 'Starknet',
    symbol: 'STRK',
    icon: '🛡️',
    color: '#00FF00',
    rpcUrl: process.env.STARKNET_RPC_URL || 'https://alpha-mainnet.starknet.io',
    explorerUrl: 'https://starkscan.co',
    nativeCurrency: { name: 'Starknet Token', symbol: 'STRK', decimals: 18 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'ZK-Rollups', description: 'Zero-knowledge rollups', enabled: true, priority: 1 },
      { name: 'Cairo Language', description: 'Starknet smart contract language', enabled: true, priority: 2 },
      { name: 'L2 Scaling', description: 'Layer 2 scaling solution', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    icon: '🔷',
    color: '#0033AD',
    rpcUrl: process.env.CARDANO_RPC_URL || 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    nativeCurrency: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Ouroboros Consensus', description: 'Proof of Stake consensus', enabled: true, priority: 1 },
      { name: 'Plutus Smart Contracts', description: 'Haskell-based smart contracts', enabled: true, priority: 2 },
      { name: 'Multi-Asset Support', description: 'Native multi-asset tokens', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'xrp',
    name: 'XRP Ledger',
    symbol: 'XRP',
    icon: '🏛️',
    color: '#23292F',
    rpcUrl: process.env.XRP_RPC_URL || 'https://xrplcluster.com',
    explorerUrl: 'https://xrpscan.com',
    nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 6 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Consensus Ledger', description: 'Consensus-based ledger', enabled: true, priority: 1 },
      { name: 'Built-in DEX', description: 'Native decentralized exchange', enabled: true, priority: 2 },
      { name: 'Fast Settlement', description: '3-5 second settlement', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    icon: '🖥️',
    color: '#FF6B6B',
    rpcUrl: process.env.ICP_RPC_URL || 'https://ic0.app',
    explorerUrl: 'https://dashboard.internetcomputer.org',
    nativeCurrency: { name: 'Internet Computer', symbol: 'ICP', decimals: 8 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Canister Smart Contracts', description: 'WebAssembly-based canisters', enabled: true, priority: 1 },
      { name: 'Web Speed', description: 'Web-speed blockchain', enabled: true, priority: 2 },
      { name: 'Infinite Scalability', description: 'Unlimited scalability', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'tezos',
    name: 'Tezos',
    symbol: 'XTZ',
    icon: '🗳️',
    color: '#2C7DF7',
    rpcUrl: process.env.TEZOS_RPC_URL || 'https://mainnet.api.tez.ie',
    explorerUrl: 'https://tzkt.io',
    nativeCurrency: { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Liquid Proof of Stake', description: 'LPoS consensus mechanism', enabled: true, priority: 1 },
      { name: 'Michelson Language', description: 'Formal verification language', enabled: true, priority: 2 },
      { name: 'On-Chain Governance', description: 'Self-amending protocol', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    icon: '🔴',
    color: '#E6007A',
    rpcUrl: process.env.POLKADOT_RPC_URL || 'https://rpc.polkadot.io',
    explorerUrl: 'https://polkascan.io/polkadot',
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
    isEVM: false,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: false,
    features: [
      { name: 'Parachains', description: 'Multi-chain architecture', enabled: true, priority: 1 },
      { name: 'Substrate Framework', description: 'Modular blockchain framework', enabled: true, priority: 2 },
      { name: 'Cross-Chain Messaging', description: 'XCMP protocol', enabled: true, priority: 3 }
    ]
  }
];

// EVM Chains (Ethereum, L2s, etc.)
export const EVM_CHAINS: ChainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '🔷',
    color: '#627EEA',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isEVM: true,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Smart Contracts', description: 'Turing-complete smart contracts', enabled: true, priority: 1 },
      { name: 'DeFi Ecosystem', description: 'Largest DeFi ecosystem', enabled: true, priority: 2 },
      { name: '1inch Integration', description: 'Full 1inch protocol support', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    icon: '🔵',
    color: '#28A0F0',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isEVM: true,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Optimistic Rollups', description: 'Layer 2 scaling solution', enabled: true, priority: 1 },
      { name: 'EVM Compatible', description: 'Full Ethereum compatibility', enabled: true, priority: 2 },
      { name: 'Low Gas Fees', description: 'Reduced transaction costs', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '🟣',
    color: '#8247E5',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isEVM: true,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Sidechain', description: 'Ethereum sidechain', enabled: true, priority: 1 },
      { name: 'High TPS', description: 'High transactions per second', enabled: true, priority: 2 },
      { name: 'Low Fees', description: 'Minimal transaction costs', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    icon: '🔵',
    color: '#0052FF',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isEVM: true,
    isTestnet: false,
    priority: 'medium',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Coinbase L2', description: 'Coinbase-built Layer 2', enabled: true, priority: 1 },
      { name: 'Optimism Stack', description: 'Built on Optimism technology', enabled: true, priority: 2 },
      { name: 'Security', description: 'Coinbase security guarantees', enabled: true, priority: 3 }
    ]
  },
  {
    id: 'etherlink',
    name: 'Etherlink',
    symbol: 'XTZ',
    icon: '🔗',
    color: '#2C7DF7',
    rpcUrl: process.env.ETHERLINK_RPC_URL || 'https://node.ghostnet.etherlink.com',
    explorerUrl: 'https://explorer.etherlink.com',
    nativeCurrency: { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
    isEVM: true,
    isTestnet: false,
    priority: 'high',
    fusionPlusSupported: true,
    limitOrderSupported: true,
    features: [
      { name: 'Tezos L2', description: 'EVM-compatible Tezos Layer 2', enabled: true, priority: 1 },
      { name: 'Smart Rollups', description: 'Tezos Smart Rollups technology', enabled: true, priority: 2 },
      { name: 'High Performance', description: 'Fast and efficient transactions', enabled: true, priority: 3 }
    ]
  }
];

export const ALL_CHAINS = [...PRIORITY_CHAINS, ...STANDARD_CHAINS, ...EVM_CHAINS];

export const getChainById = (id: string): ChainConfig | undefined => {
  return ALL_CHAINS.find(chain => chain.id === id);
};

export const getSupportedChains = (): ChainConfig[] => {
  return ALL_CHAINS.filter(chain => chain.fusionPlusSupported);
};

export const getEVMChains = (): ChainConfig[] => {
  return ALL_CHAINS.filter(chain => chain.isEVM);
};

export const getNonEVMChains = (): ChainConfig[] => {
  return ALL_CHAINS.filter(chain => !chain.isEVM);
}; 