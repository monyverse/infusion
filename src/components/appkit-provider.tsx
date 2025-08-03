"use client"

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppKitProvider as ReownAppkitProvider } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

// Create adapter instances with error handling
const createEthersAdapter = () => {
  try {
    return new EthersAdapter()
  } catch (error) {
    console.warn('Failed to create EthersAdapter:', error)
    return null
  }
}

const createSolanaAdapter = () => {
  try {
    return new SolanaAdapter({
      wallets: []
    })
  } catch (error) {
    console.warn('Failed to create SolanaAdapter:', error)
    return null
  }
}

const createBitcoinAdapter = () => {
  try {
    return new BitcoinAdapter()
  } catch (error) {
    console.warn('Failed to create BitcoinAdapter:', error)
    return null
  }
}

const ethersAdapter = createEthersAdapter()
const solanaAdapter = createSolanaAdapter()
const bitcoinAdapter = createBitcoinAdapter()

// Helper function to get RPC URL with fallback
const getRpcUrl = (envVar: string, fallback: string) => {
  return typeof window !== 'undefined' ? (process.env[envVar] || fallback) : fallback
}

// Network configurations for all supported chains
const networks = [
  // === ETHEREUM ECOSYSTEM ===
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_ETHEREUM_RPC', 'https://eth-mainnet.g.alchemy.com/v2/demo')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_ETHEREUM_RPC', 'https://cloudflare-eth.com')] }
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' }
    }
  },
  {
    id: 11155111,
    name: 'Ethereum Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_SEPOLIA_RPC', 'https://sepolia.infura.io/v3/demo')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_SEPOLIA_RPC', 'https://sepolia.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' }
    },
    testnet: true
  },
  
  // === LAYER 2 SOLUTIONS ===
  {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_POLYGON_RPC', 'https://polygon-rpc.com')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_POLYGON_RPC', 'https://polygon.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' }
    }
  },
  {
    id: 80001,
    name: 'Polygon Mumbai',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_POLYGON_MUMBAI_RPC', 'https://rpc-mumbai.maticvigil.com')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_POLYGON_MUMBAI_RPC', 'https://mumbai.polygon.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://mumbai.polygonscan.com' }
    },
    testnet: true
  },
  
  // === ARBITRUM ===
  {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_ARBITRUM_RPC', 'https://arb1.arbitrum.io/rpc')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_ARBITRUM_RPC', 'https://arbitrum.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://arbiscan.io' }
    }
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC', 'https://sepolia-rollup.arbitrum.io/rpc')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC', 'https://arbitrum-sepolia.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' }
    },
    testnet: true
  },
  
  // === BASE ===
  {
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_BASE_RPC', 'https://mainnet.base.org')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_BASE_RPC', 'https://base.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://basescan.org' }
    }
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_BASE_SEPOLIA_RPC', 'https://sepolia.base.org')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_BASE_SEPOLIA_RPC', 'https://base-sepolia.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }
    },
    testnet: true
  },
  
  // === OPTIMISM ===
  {
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_OPTIMISM_RPC', 'https://mainnet.optimism.io')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_OPTIMISM_RPC', 'https://optimism.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' }
    }
  },
  {
    id: 11155420,
    name: 'Optimism Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC', 'https://sepolia.optimism.io')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC', 'https://optimism-sepolia.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'Optimistic Etherscan', url: 'https://sepolia-optimism.etherscan.io' }
    },
    testnet: true
  },
  
  // === BSC ===
  {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_BSC_RPC', 'https://bsc-dataseed1.binance.org')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_BSC_RPC', 'https://bsc.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://bscscan.com' }
    }
  },
  {
    id: 97,
    name: 'BSC Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_BSC_TESTNET_RPC', 'https://data-seed-prebsc-1-s1.binance.org:8545')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_BSC_TESTNET_RPC', 'https://bsc-testnet.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://testnet.bscscan.com' }
    },
    testnet: true
  },
  
  // === AVALANCHE ===
  {
    id: 43114,
    name: 'Avalanche C-Chain',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_AVALANCHE_RPC', 'https://api.avax.network/ext/bc/C/rpc')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_AVALANCHE_RPC', 'https://avalanche.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'SnowTrace', url: 'https://snowtrace.io' }
    }
  },
  {
    id: 43113,
    name: 'Avalanche Fuji',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_AVALANCHE_FUJI_RPC', 'https://api.avax-test.network/ext/bc/C/rpc')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_AVALANCHE_FUJI_RPC', 'https://avalanche-fuji.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'SnowTrace', url: 'https://testnet.snowtrace.io' }
    },
    testnet: true
  },
  
  // === FANTOM ===
  {
    id: 250,
    name: 'Fantom Opera',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_FANTOM_RPC', 'https://rpc.ftm.tools')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_FANTOM_RPC', 'https://fantom.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'FtmScan', url: 'https://ftmscan.com' }
    }
  },
  {
    id: 4002,
    name: 'Fantom Testnet',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl('NEXT_PUBLIC_FANTOM_TESTNET_RPC', 'https://rpc.testnet.fantom.network')] },
      public: { http: [getRpcUrl('NEXT_PUBLIC_FANTOM_TESTNET_RPC', 'https://fantom-testnet.drpc.org')] }
    },
    blockExplorers: {
      default: { name: 'FtmScan', url: 'https://testnet.ftmscan.com' }
    },
    testnet: true
  }
]

// Filter valid adapters
const validAdapters = [ethersAdapter, solanaAdapter, bitcoinAdapter].filter(Boolean)

export function AppkitProvider({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

  if (!projectId) {
    console.warn('NEXT_PUBLIC_PROJECT_ID not found. Please add it to your .env.local file.')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ReownAppkitProvider
        projectId={projectId || 'demo-project-id'}
        metadata={{
          name: process.env.NEXT_PUBLIC_APP_NAME || 'InFusion',
          description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'AI-Powered Cross-Chain DeFi Platform',
          url: process.env.NEXT_PUBLIC_APP_URL || 'https://infusion.defi',
          icons: [process.env.NEXT_PUBLIC_APP_ICON || '/icon.png']
        }}
        networks={networks}
        adapters={validAdapters}
        themeMode="dark"
        themeVariables={{
          '--w3m-font-family': 'Inter, sans-serif',
          '--w3m-accent': '#8B5CF6',
          '--w3m-color-mix': '#8B5CF6',
          '--w3m-color-mix-strength': 20,
          '--w3m-border-radius-master': '8px'
        }}
        features={{
          analytics: true,
          email: false,
          socials: ['google', 'github', 'discord'],
          emailShowWallets: true
        }}
        enableOnramp={true}
        enableSwaps={true}
        allWallets="SHOW"
        includeWalletIds={[
          // Popular wallets
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
          '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
          'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a', // Uniswap
        ]},
        excludeWalletIds={[]}
      >
        {children}
      </ReownAppkitProvider>
    </QueryClientProvider>
  )
} 