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
      retry: 1,
    },
  },
})

// Create adapter instances
const ethersAdapter = new EthersAdapter()
const solanaAdapter = new SolanaAdapter()
const bitcoinAdapter = new BitcoinAdapter()

export function AppkitProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReownAppkitProvider
        projectId={process.env.NEXT_PUBLIC_PROJECT_ID || 'demo-project-id'}
        metadata={{
          name: 'InFusion',
          description: 'AI-Powered Cross-Chain DeFi Platform',
          url: 'https://infusion.defi',
          icons: ['/icon.png']
        }}
        networks={[
          // Ethereum mainnet
          {
            id: 1,
            name: 'Ethereum',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo'] },
              public: { http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo'] }
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://etherscan.io' }
            }
          },
          // Ethereum Sepolia testnet
          {
            id: 11155111,
            name: 'Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/demo'] },
              public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/demo'] }
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' }
            }
          },
          // Polygon
          {
            id: 137,
            name: 'Polygon',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com'] },
              public: { http: [process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com'] }
            },
            blockExplorers: {
              default: { name: 'PolygonScan', url: 'https://polygonscan.com' }
            }
          },
          // Arbitrum One
          {
            id: 42161,
            name: 'Arbitrum One',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'] },
              public: { http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'] }
            },
            blockExplorers: {
              default: { name: 'Arbiscan', url: 'https://arbiscan.io' }
            }
          },
          // Base
          {
            id: 8453,
            name: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'] },
              public: { http: [process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'] }
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://basescan.org' }
            }
          },
          // Optimism
          {
            id: 10,
            name: 'Optimism',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io'] },
              public: { http: [process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io'] }
            },
            blockExplorers: {
              default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' }
            }
          },
          // BSC
          {
            id: 56,
            name: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed1.binance.org'] },
              public: { http: [process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed1.binance.org'] }
            },
            blockExplorers: {
              default: { name: 'BscScan', url: 'https://bscscan.com' }
            }
          },
          // Avalanche C-Chain
          {
            id: 43114,
            name: 'Avalanche C-Chain',
            nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'] },
              public: { http: [process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'] }
            },
            blockExplorers: {
              default: { name: 'SnowTrace', url: 'https://snowtrace.io' }
            }
          },
          // Fantom
          {
            id: 250,
            name: 'Fantom Opera',
            nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_FANTOM_RPC || 'https://rpc.ftm.tools'] },
              public: { http: [process.env.NEXT_PUBLIC_FANTOM_RPC || 'https://rpc.ftm.tools'] }
            },
            blockExplorers: {
              default: { name: 'FtmScan', url: 'https://ftmscan.com' }
            }
          }
        ]}
        adapters={[
          ethersAdapter,
          solanaAdapter,
          bitcoinAdapter
        ]}
      >
        {children}
      </ReownAppkitProvider>
    </QueryClientProvider>
  )
} 