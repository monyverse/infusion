'use client';

import React, { useState, useEffect } from 'react';
import { useFusionPlus } from '@/hooks/useFusionPlus';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Loader2, Globe, Zap } from 'lucide-react';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface Chain {
  id: string;
  name: string;
  chainId?: number;
  icon: string;
  color: string;
  rpcUrl?: string;
  type: 'evm' | 'near' | 'aptos' | 'sui' | 'bitcoin';
  isL1: boolean;
}

const SUPPORTED_CHAINS: Chain[] = [
  // EVM Chains
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    icon: '🔷',
    color: 'bg-blue-500',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your_key',
    type: 'evm',
    isL1: true
  },
  {
    id: 'sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    icon: '🔷',
    color: 'bg-blue-400',
    rpcUrl: 'https://sepolia.drpc.org',
    type: 'evm',
    isL1: false
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    icon: '🔵',
    color: 'bg-blue-600',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    type: 'evm',
    isL1: false
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    icon: '🟣',
    color: 'bg-purple-500',
    rpcUrl: 'https://polygon-rpc.com',
    type: 'evm',
    isL1: false
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    icon: '🔵',
    color: 'bg-blue-500',
    rpcUrl: 'https://mainnet.base.org',
    type: 'evm',
    isL1: false
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    icon: '🔴',
    color: 'bg-red-500',
    rpcUrl: 'https://mainnet.optimism.io',
    type: 'evm',
    isL1: false
  },
  {
    id: 'bsc',
    name: 'BSC',
    chainId: 56,
    icon: '🟡',
    color: 'bg-yellow-500',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    type: 'evm',
    isL1: false
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    chainId: 43114,
    icon: '🔴',
    color: 'bg-red-600',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    type: 'evm',
    isL1: false
  },
  {
    id: 'fantom',
    name: 'Fantom',
    chainId: 250,
    icon: '🔵',
    color: 'bg-blue-400',
    rpcUrl: 'https://rpc.ftm.tools',
    type: 'evm',
    isL1: false
  },
  {
    id: 'etherlink',
    name: 'Etherlink',
    chainId: 128123,
    icon: '🟢',
    color: 'bg-green-500',
    rpcUrl: 'https://node.ghostnet.etherlink.com',
    type: 'evm',
    isL1: false
  },
  // L1 Chains
  {
    id: 'near',
    name: 'NEAR Protocol',
    icon: '🟢',
    color: 'bg-green-600',
    type: 'near',
    isL1: true
  },
  {
    id: 'aptos',
    name: 'Aptos',
    icon: '🔵',
    color: 'bg-blue-700',
    type: 'aptos',
    isL1: true
  },
  {
    id: 'sui',
    name: 'Sui',
    icon: '🟣',
    color: 'bg-purple-600',
    type: 'sui',
    isL1: true
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    icon: '🟡',
    color: 'bg-orange-500',
    type: 'bitcoin',
    isL1: true
  }
];

const COMMON_TOKENS: { [chainId: string]: Token[] } = {
  // EVM Chains
  '1': [ // Ethereum
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  ],
  '11155111': [ // Sepolia
    { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '137': [ // Polygon
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped MATIC', decimals: 18 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  ],
  '8453': [ // Base
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '42161': [ // Arbitrum
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '10': [ // Optimism
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '56': [ // BSC
    { address: '0xbb4CdB9CBd36B01bD1cBaEF60aF814a3f6F0E675', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  ],
  '43114': [ // Avalanche
    { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', name: 'Wrapped AVAX', decimals: 18 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '250': [ // Fantom
    { address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', symbol: 'WFTM', name: 'Wrapped FTM', decimals: 18 },
    { address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  '128123': [ // Etherlink
    { address: '0x0000000000000000000000000000000000000000', symbol: 'XTZ', name: 'Tezos', decimals: 18 },
    { address: '0x0000000000000000000000000000000000000001', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  // L1 Chains
  'near': [
    { address: 'near', symbol: 'NEAR', name: 'NEAR Protocol', decimals: 24 },
    { address: 'usdc.fakes.testnet', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: 'usdt.fakes.testnet', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  ],
  'aptos': [
    { address: '0x1::aptos_coin::AptosCoin', symbol: 'APT', name: 'Aptos Coin', decimals: 8 },
    { address: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  ],
  'sui': [
    { address: '0x2::sui::SUI', symbol: 'SUI', name: 'Sui', decimals: 9 },
    { address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDC', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDT', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  ],
  'bitcoin': [
    { address: 'btc', symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    { address: 'wbtc', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  ]
};

export const MultiChainSwap: React.FC = () => {
  const [fromChain, setFromChain] = useState<Chain>(SUPPORTED_CHAINS[0]);
  const [toChain, setToChain] = useState<Chain>(SUPPORTED_CHAINS[1]);
  const [fromToken, setFromToken] = useState<Token>(COMMON_TOKENS['1']?.[0] || { address: '', symbol: '', name: '', decimals: 18 });
  const [toToken, setToToken] = useState<Token>(COMMON_TOKENS['137']?.[1] || { address: '', symbol: '', name: '', decimals: 6 });
  const [fromAmount, setFromAmount] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string>('');
  const [isCrossChain, setIsCrossChain] = useState<boolean>(false);
  const [isL1Swap, setIsL1Swap] = useState<boolean>(false);
  const [swapHistory, setSwapHistory] = useState<any[]>([]);
  const [swapStatus, setSwapStatus] = useState<any>(null);

  // Initialize Fusion+ service
  const fusionPlus = useFusionPlus({
    chainId: fromChain.chainId ?? 1,
    apiKey: process.env.NEXT_PUBLIC_INCH_API_KEY || '',
    privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY || '',
    rpcUrl: fromChain.rpcUrl || ''
  });

  // Update Fusion+ service when chain changes
  useEffect(() => {
    if (fusionPlus.service && fromChain.type === 'evm') {
      fusionPlus.service = null; // Force re-initialization
    }
  }, [fromChain.chainId]);

  // Check if this is a cross-chain swap
  useEffect(() => {
    setIsCrossChain(fromChain.id !== toChain.id);
    setIsL1Swap(fromChain.isL1 || toChain.isL1);
  }, [fromChain.id, toChain.id, fromChain.isL1, toChain.isL1]);

  const handleGetQuote = async () => {
    if (!fromAmount || !userAddress) {
      alert('Please enter amount and user address');
      return;
    }

    try {
      if (isCrossChain) {
        if (fromChain.type === 'evm' && toChain.type === 'evm') {
          await fusionPlus.getCrossChainQuote({
            fromChainId: fromChain.chainId!,
            toChainId: toChain.chainId!,
            fromToken: fromToken.address,
            toToken: toToken.address,
            fromAmount: fromAmount,
            toAmount: '0', // Will be calculated by the API
            userAddress: userAddress
          });
        } else {
          // L1 cross-chain swap - use coordinator
          const response = await fetch('/api/cross-chain/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromChain: fromChain.id,
              toChain: toChain.id,
              fromToken: fromToken.address,
              toToken: toToken.address,
              fromAmount: fromAmount,
              userAddress: userAddress
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to get cross-chain quote');
          }
          
          const quote = await response.json();
          setSwapStatus(quote);
        }
      } else {
        await fusionPlus.getQuote({
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: fromAmount
        });
      }
    } catch (error) {
      console.error('Error getting quote:', error);
    }
  };

  const handleExecuteSwap = async () => {
    if (!fusionPlus.quote && !fusionPlus.crossChainQuote && !swapStatus) {
      alert('Please get a quote first');
      return;
    }

    try {
      if (isCrossChain) {
        if (fromChain.type === 'evm' && toChain.type === 'evm') {
          await fusionPlus.executeCrossChainSwap({
            fromChainId: fromChain.chainId!,
            toChainId: toChain.chainId!,
            fromToken: fromToken.address,
            toToken: toToken.address,
            fromAmount: fromAmount,
            toAmount: fusionPlus.crossChainQuote?.toAmount || '0',
            userAddress: userAddress
          });
        } else {
          // L1 cross-chain swap - use coordinator
          const response = await fetch('/api/cross-chain/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              swapId: swapStatus.swapId,
              userAddress: userAddress
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to execute cross-chain swap');
          }
          
          const result = await response.json();
          setSwapStatus(result);
        }
      } else {
        await fusionPlus.executeSwap({
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: fromAmount,
          toAmount: fusionPlus.quote?.toAmount || '0',
          userAddress: userAddress
        });
      }

      // Add to swap history
      const swapRecord = {
        id: Date.now(),
        fromChain: fromChain.name,
        toChain: toChain.name,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount,
        toAmount: isCrossChain ? 
          (fusionPlus.crossChainQuote?.toAmount || swapStatus?.toAmount) : 
          fusionPlus.quote?.toAmount,
        timestamp: new Date().toISOString(),
        status: 'pending',
        type: isL1Swap ? 'L1 Cross-Chain' : 'Cross-Chain'
      };
      setSwapHistory(prev => [swapRecord, ...prev]);
    } catch (error) {
      console.error('Error executing swap:', error);
    }
  };

  const handleSwitchChains = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
    
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const formatAmount = (amount: string, decimals: number) => {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
  };

  const getChainTokens = (chain: Chain): Token[] => {
    const chainKey = chain.type === 'evm' ? chain.chainId?.toString() : chain.id;
    return COMMON_TOKENS[chainKey || ''] || [];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Multi-Chain Swap</h2>
        <p className="text-gray-300">
          Swap tokens across {SUPPORTED_CHAINS.length} blockchain networks with 1inch Fusion+ and HTLC technology
        </p>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{SUPPORTED_CHAINS.filter(c => c.isL1).length} L1 Chains</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Zap className="w-4 h-4" />
            <span>HTLC Atomic Swaps</span>
          </div>
        </div>
      </div>

      {/* User Address Input */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <label className="block text-sm font-medium mb-2">Wallet Address</label>
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
          className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Chain Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From Chain */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">From</span>
            {fromChain.icon} {fromChain.name}
            {fromChain.isL1 && <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">L1</span>}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chain</label>
              <select
                value={fromChain.id}
                onChange={(e) => {
                  const chain = SUPPORTED_CHAINS.find(c => c.id === e.target.value);
                  if (chain) {
                    setFromChain(chain);
                    const tokens = getChainTokens(chain);
                    setFromToken(tokens[0] || { address: '', symbol: '', name: '', decimals: 18 });
                  }
                }}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CHAINS.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name} {chain.isL1 ? '(L1)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <select
                value={fromToken.address}
                onChange={(e) => {
                  const tokens = getChainTokens(fromChain);
                  const token = tokens.find(t => t.address === e.target.value);
                  if (token) setFromToken(token);
                }}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getChainTokens(fromChain).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* To Chain */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">To</span>
            {toChain.icon} {toChain.name}
            {toChain.isL1 && <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">L1</span>}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chain</label>
              <select
                value={toChain.id}
                onChange={(e) => {
                  const chain = SUPPORTED_CHAINS.find(c => c.id === e.target.value);
                  if (chain) {
                    setToChain(chain);
                    const tokens = getChainTokens(chain);
                    setToToken(tokens[1] || tokens[0] || { address: '', symbol: '', name: '', decimals: 6 });
                  }
                }}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CHAINS.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name} {chain.isL1 ? '(L1)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <select
                value={toToken.address}
                onChange={(e) => {
                  const tokens = getChainTokens(toChain);
                  const token = tokens.find(t => t.address === e.target.value);
                  if (token) setToToken(token);
                }}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getChainTokens(toChain).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estimated Amount</label>
              <div className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white">
                {fusionPlus.quoteLoading || fusionPlus.crossChainLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : fusionPlus.quote || fusionPlus.crossChainQuote || swapStatus ? (
                  `${formatAmount(
                    isCrossChain ? 
                      (fusionPlus.crossChainQuote?.toAmount || swapStatus?.toAmount || '0') : 
                      fusionPlus.quote?.toAmount || '0',
                    toToken.decimals
                  )} ${toToken.symbol}`
                ) : (
                  '0.0'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Type Indicators */}
      {isCrossChain && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <ArrowRight className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-blue-400 font-medium">Cross-Chain Swap</span>
          </div>
          <p className="text-sm text-blue-300 mt-1">
            Swapping from {fromChain.name} to {toChain.name} using {isL1Swap ? 'HTLC atomic swaps' : '1inch Fusion+'}
          </p>
        </div>
      )}

      {isL1Swap && (
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <Globe className="w-5 h-5 text-orange-400 mr-2" />
            <span className="text-orange-400 font-medium">L1 Cross-Chain Swap</span>
          </div>
          <p className="text-sm text-orange-300 mt-1">
            Using Hash Time-Locked Contracts (HTLC) for trustless atomic swaps between L1 chains
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleSwitchChains}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Switch Chains
        </Button>
        
        <Button
          onClick={handleSwitchTokens}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Switch Tokens
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleGetQuote}
          disabled={fusionPlus.quoteLoading || fusionPlus.crossChainLoading || !fromAmount || !userAddress}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {fusionPlus.quoteLoading || fusionPlus.crossChainLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Get Quote
        </Button>
        
        <Button
          onClick={handleExecuteSwap}
          disabled={fusionPlus.swapLoading || fusionPlus.crossChainLoading || (!fusionPlus.quote && !fusionPlus.crossChainQuote && !swapStatus)}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {fusionPlus.swapLoading || fusionPlus.crossChainLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Execute Swap
        </Button>
      </div>

      {/* Error Display */}
      {(fusionPlus.quoteError || fusionPlus.swapError || fusionPlus.crossChainError) && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-sm text-red-300 mt-1">
            {fusionPlus.quoteError || fusionPlus.swapError || fusionPlus.crossChainError}
          </p>
        </div>
      )}

      {/* Success Display */}
      {(fusionPlus.swapResult || fusionPlus.crossChainResult || swapStatus?.status === 'completed') && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-400 font-medium">Success</span>
          </div>
          <p className="text-sm text-green-300 mt-1">
            {isCrossChain ? 'Cross-chain swap initiated successfully!' : 'Swap executed successfully!'}
          </p>
          <p className="text-xs text-green-300 mt-1">
            TX Hash: {fusionPlus.swapResult?.txHash || fusionPlus.crossChainResult?.orderHash || swapStatus?.transactions?.fromChainTx}
          </p>
        </div>
      )}

      {/* Quote Details */}
      {(fusionPlus.quote || fusionPlus.crossChainQuote || swapStatus) && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4">Quote Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-400">From Amount:</span>
              <p className="text-white">{formatAmount(fromAmount, fromToken.decimals)} {fromToken.symbol}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">To Amount:</span>
              <p className="text-white">
                {formatAmount(
                  isCrossChain ? 
                    (fusionPlus.crossChainQuote?.toAmount || swapStatus?.toAmount || '0') : 
                    fusionPlus.quote?.toAmount || '0',
                  toToken.decimals
                )} {toToken.symbol}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Price Impact:</span>
              <p className="text-white">{fusionPlus.quote?.price || swapStatus?.price || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Estimated Gas:</span>
              <p className="text-white">{fusionPlus.quote?.gasEstimate || fusionPlus.crossChainQuote?.estimatedGas || swapStatus?.gasEstimate || 'N/A'}</p>
            </div>
            {isL1Swap && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-400">HTLC Timelock:</span>
                <p className="text-white">1 hour (3600 seconds)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Swap History */}
      {swapHistory.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Swaps</h3>
          <div className="space-y-3">
            {swapHistory.slice(0, 5).map(swap => (
              <div key={swap.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm font-medium">
                    {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                  </p>
                  <p className="text-xs text-gray-400">
                    {swap.fromChain} → {swap.toChain} • {new Date(swap.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-400">{swap.type}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  swap.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  swap.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {swap.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 