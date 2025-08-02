"use client"

import React from 'react'
import { AppkitProvider as ReownAppkitProvider } from '@reown/appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export function AppkitProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReownAppkitProvider
        config={{
          appName: 'UniteAI Wallet',
          appDescription: 'AI-Powered Cross-Chain DeFi Platform',
          appUrl: 'https://uniteai.wallet',
          appIcon: '/icon.png',
          theme: 'dark',
          chains: {
            ethereum: {
              mainnet: {
                chainId: 1,
                name: 'Ethereum',
                rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
                blockExplorer: 'https://etherscan.io',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
              sepolia: {
                chainId: 11155111,
                name: 'Sepolia',
                rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.drpc.org',
                blockExplorer: 'https://sepolia.etherscan.io',
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            },
            polygon: {
              mainnet: {
                chainId: 137,
                name: 'Polygon',
                rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
                blockExplorer: 'https://polygonscan.com',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
              },
            },
            arbitrum: {
              mainnet: {
                chainId: 42161,
                name: 'Arbitrum One',
                rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
                blockExplorer: 'https://arbiscan.io',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            },
            base: {
              mainnet: {
                chainId: 8453,
                name: 'Base',
                rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
                blockExplorer: 'https://basescan.org',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            },
            near: {
              mainnet: {
                chainId: 'near',
                name: 'NEAR Protocol',
                rpcUrl: process.env.NEXT_PUBLIC_NEAR_RPC_URL || 'https://rpc.mainnet.near.org',
                blockExplorer: 'https://explorer.near.org',
                nativeCurrency: {
                  name: 'NEAR',
                  symbol: 'NEAR',
                  decimals: 24,
                },
              },
              testnet: {
                chainId: 'near-testnet',
                name: 'NEAR Testnet',
                rpcUrl: process.env.NEXT_PUBLIC_NEAR_TESTNET_RPC_URL || 'https://rpc.testnet.near.org',
                blockExplorer: 'https://explorer.testnet.near.org',
                nativeCurrency: {
                  name: 'NEAR',
                  symbol: 'NEAR',
                  decimals: 24,
                },
              },
            },
            solana: {
              mainnet: {
                chainId: 'solana',
                name: 'Solana',
                rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
                blockExplorer: 'https://solscan.io',
                nativeCurrency: {
                  name: 'SOL',
                  symbol: 'SOL',
                  decimals: 9,
                },
              },
              devnet: {
                chainId: 'solana-devnet',
                name: 'Solana Devnet',
                rpcUrl: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
                blockExplorer: 'https://solscan.io/?cluster=devnet',
                nativeCurrency: {
                  name: 'SOL',
                  symbol: 'SOL',
                  decimals: 9,
                },
              },
            },
            bitcoin: {
              mainnet: {
                chainId: 'bitcoin',
                name: 'Bitcoin',
                rpcUrl: process.env.NEXT_PUBLIC_BITCOIN_RPC_URL || 'https://btc.getblock.io/mainnet/',
                blockExplorer: 'https://blockstream.info',
                nativeCurrency: {
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  decimals: 8,
                },
              },
              testnet: {
                chainId: 'bitcoin-testnet',
                name: 'Bitcoin Testnet',
                rpcUrl: process.env.NEXT_PUBLIC_BITCOIN_TESTNET_RPC_URL || 'https://btc.getblock.io/testnet/',
                blockExplorer: 'https://blockstream.info/testnet',
                nativeCurrency: {
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  decimals: 8,
                },
              },
            },
            sui: {
              mainnet: {
                chainId: 'sui',
                name: 'Sui',
                rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
                blockExplorer: 'https://suiexplorer.com',
                nativeCurrency: {
                  name: 'SUI',
                  symbol: 'SUI',
                  decimals: 9,
                },
              },
            },
            aptos: {
              mainnet: {
                chainId: 'aptos',
                name: 'Aptos',
                rpcUrl: process.env.NEXT_PUBLIC_APTOS_RPC_URL || 'https://fullnode.mainnet.aptoslabs.com/v1',
                blockExplorer: 'https://explorer.aptoslabs.com',
                nativeCurrency: {
                  name: 'APT',
                  symbol: 'APT',
                  decimals: 8,
                },
              },
            },
          },
        }}
      >
        {children}
      </ReownAppkitProvider>
    </QueryClientProvider>
  )
} 