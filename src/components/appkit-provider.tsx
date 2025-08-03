"use client"

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppKitProvider as ReownAppkitProvider } from '@reown/appkit/react'
import { createAppKit } from '@reown/appkit/react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Create AppKit instance with all supported chains
const appKit = createAppKit({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || 'demo-project-id',
  appName: 'UniteAI Wallet',
  appDescription: 'AI-Powered Cross-Chain DeFi Platform',
  appUrl: 'https://uniteai.wallet',
  appIcon: '/icon.png',
  theme: 'dark',
  chains: [
    // EVM Chains
    {
      id: 1,
      name: 'Ethereum',
      network: 'ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'] },
        public: { http: ['https://eth-mainnet.g.alchemy.com/v2/demo'] }
      },
      blockExplorers: {
        default: { name: 'Etherscan', url: 'https://etherscan.io' }
      }
    },
    {
      id: 11155111,
      name: 'Sepolia',
      network: 'sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.drpc.org'] },
        public: { http: ['https://sepolia.drpc.org'] }
      },
      blockExplorers: {
        default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' }
      }
    },
    {
      id: 137,
      name: 'Polygon',
      network: 'polygon',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'] },
        public: { http: ['https://polygon-rpc.com'] }
      },
      blockExplorers: {
        default: { name: 'PolygonScan', url: 'https://polygonscan.com' }
      }
    },
    {
      id: 42161,
      name: 'Arbitrum One',
      network: 'arbitrum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'] },
        public: { http: ['https://arb1.arbitrum.io/rpc'] }
      },
      blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://arbiscan.io' }
      }
    },
    {
      id: 8453,
      name: 'Base',
      network: 'base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'] },
        public: { http: ['https://mainnet.base.org'] }
      },
      blockExplorers: {
        default: { name: 'BaseScan', url: 'https://basescan.org' }
      }
    },
    // Non-EVM Chains
    {
      id: 'solana',
      name: 'Solana',
      network: 'solana',
      nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'] },
        public: { http: ['https://api.mainnet-beta.solana.com'] }
      },
      blockExplorers: {
        default: { name: 'Solscan', url: 'https://solscan.io' }
      }
    },
    {
      id: 'near',
      name: 'NEAR Protocol',
      network: 'near',
      nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_NEAR_RPC_URL || 'https://rpc.mainnet.near.org'] },
        public: { http: ['https://rpc.mainnet.near.org'] }
      },
      blockExplorers: {
        default: { name: 'NEAR Explorer', url: 'https://explorer.near.org' }
      }
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      network: 'bitcoin',
      nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_BITCOIN_RPC_URL || 'https://btc.getblock.io/mainnet/'] },
        public: { http: ['https://btc.getblock.io/mainnet/'] }
      },
      blockExplorers: {
        default: { name: 'Blockstream', url: 'https://blockstream.info' }
      }
    },
    {
      id: 'sui',
      name: 'Sui',
      network: 'sui',
      nativeCurrency: { name: 'SUI', symbol: 'SUI', decimals: 9 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443'] },
        public: { http: ['https://fullnode.mainnet.sui.io:443'] }
      },
      blockExplorers: {
        default: { name: 'Sui Explorer', url: 'https://suiexplorer.com' }
      }
    },
    {
      id: 'aptos',
      name: 'Aptos',
      network: 'aptos',
      nativeCurrency: { name: 'APT', symbol: 'APT', decimals: 8 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_APTOS_RPC_URL || 'https://fullnode.mainnet.aptoslabs.com/v1'] },
        public: { http: ['https://fullnode.mainnet.aptoslabs.com/v1'] }
      },
      blockExplorers: {
        default: { name: 'Aptos Explorer', url: 'https://explorer.aptoslabs.com' }
      }
    }
  ],
  adapters: [
    // Include all the adapters we have installed
    '@reown/appkit-adapter-ethers',
    '@reown/appkit-adapter-solana',
    '@reown/appkit-adapter-bitcoin'
  ],
  metadata: {
    name: 'UniteAI Wallet',
    description: 'AI-Powered Cross-Chain DeFi Platform',
    url: 'https://uniteai.wallet',
    icons: ['/icon.png']
  }
})

export function AppkitProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReownAppkitProvider appKit={appKit}>
        {children}
      </ReownAppkitProvider>
    </QueryClientProvider>
  )
} 