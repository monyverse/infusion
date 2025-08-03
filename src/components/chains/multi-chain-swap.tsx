'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { createFusionPlusL1Extension, CrossChainSwapRequest, CrossChainSwapStatus, DeFiStrategy, StrategyParams } from '../../services/fusion-plus-l1-extension';
import { ArrowRight, ArrowUpDown, TrendingUp, Shield, Zap, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  type: 'evm' | 'near' | 'aptos' | 'sui' | 'bitcoin' | 'solana' | 'stellar' | 'tron' | 'ton' | 'monad' | 'starknet' | 'cardano' | 'xrp' | 'icp' | 'tezos' | 'polkadot';
  isL1: boolean;
}

interface SwapQuote {
  toAmount: string;
  price: string;
  gasEstimate: string;
  protocols: string[];
}

interface StrategyCardProps {
  strategy: DeFiStrategy;
  onExecute: (strategy: DeFiStrategy) => void;
  isExecuting: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, onExecute, isExecuting }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{strategy.name}</CardTitle>
          <Badge className={getRiskColor(strategy.riskLevel)}>
            {strategy.riskLevel.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{strategy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Expected APY:</span>
            <span className="font-semibold text-green-600">{strategy.expectedAPY}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Lock Period:</span>
            <span className="text-sm">{Math.floor(strategy.minLockPeriod / (24 * 60 * 60))} - {Math.floor(strategy.maxLockPeriod / (24 * 60 * 60))} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Supported Chains:</span>
            <span className="text-sm">{strategy.supportedChains.length}</span>
          </div>
          <Button 
            onClick={() => onExecute(strategy)} 
            disabled={isExecuting}
            className="w-full"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Execute Strategy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiChainSwap: React.FC = () => {
  const [fusionExtension] = useState(() => createFusionPlusL1Extension());
  const [fromChain, setFromChain] = useState<string>('ethereum');
  const [toChain, setToChain] = useState<string>('polygon');
  const [fromToken, setFromToken] = useState<string>('USDC');
  const [toToken, setToToken] = useState<string>('USDT');
  const [fromAmount, setFromAmount] = useState<string>('100');
  const [userAddress, setUserAddress] = useState<string>('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapStatus, setSwapStatus] = useState<CrossChainSwapStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<DeFiStrategy[]>([]);
  const [userSwaps, setUserSwaps] = useState<CrossChainSwapStatus[]>([]);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [strategy, setStrategy] = useState<'atomic' | 'optimistic' | 'hybrid'>('atomic');
  const [activeTab, setActiveTab] = useState<string>('swap');

  const chains: Chain[] = [
    { id: 'ethereum', name: 'Ethereum', chainId: 1, icon: '🔷', color: '#627EEA', type: 'evm', isL1: true },
    { id: 'polygon', name: 'Polygon', chainId: 137, icon: '🟣', color: '#8247E5', type: 'evm', isL1: false },
    { id: 'arbitrum', name: 'Arbitrum', chainId: 42161, icon: '🔵', color: '#28A0F0', type: 'evm', isL1: false },
    { id: 'base', name: 'Base', chainId: 8453, icon: '🔵', color: '#0052FF', type: 'evm', isL1: false },
    { id: 'optimism', name: 'Optimism', chainId: 10, icon: '🔴', color: '#FF0420', type: 'evm', isL1: false },
    { id: 'bsc', name: 'BSC', chainId: 56, icon: '🟡', color: '#F3BA2F', type: 'evm', isL1: false },
    { id: 'avalanche', name: 'Avalanche', chainId: 43114, icon: '🔴', color: '#E84142', type: 'evm', isL1: false },
    { id: 'fantom', name: 'Fantom', chainId: 250, icon: '🔵', color: '#1969FF', type: 'evm', isL1: false },
    { id: 'near', name: 'NEAR', icon: '🟢', color: '#000000', type: 'near', isL1: true },
    { id: 'aptos', name: 'Aptos', icon: '🟣', color: '#3D7AFF', type: 'aptos', isL1: true },
    { id: 'sui', name: 'Sui', icon: '🟢', color: '#6FBCF0', type: 'sui', isL1: true },
    { id: 'solana', name: 'Solana', icon: '🟣', color: '#9945FF', type: 'solana', isL1: true },
    { id: 'stellar', name: 'Stellar', icon: '🟡', color: '#7D00FF', type: 'stellar', isL1: true },
    { id: 'tron', name: 'TRON', icon: '🔴', color: '#FF0000', type: 'tron', isL1: true },
    { id: 'ton', name: 'TON', icon: '🔵', color: '#0088CC', type: 'ton', isL1: true },
    { id: 'monad', name: 'Monad', icon: '🟢', color: '#00FF00', type: 'monad', isL1: true },
    { id: 'starknet', name: 'Starknet', icon: '🟠', color: '#FF6B35', type: 'starknet', isL1: false },
    { id: 'cardano', name: 'Cardano', icon: '🔵', color: '#0033AD', type: 'cardano', isL1: true },
    { id: 'xrp', name: 'XRP Ledger', icon: '🟢', color: '#23292F', type: 'xrp', isL1: true },
    { id: 'icp', name: 'Internet Computer', icon: '🟢', color: '#29ABE2', type: 'icp', isL1: true },
    { id: 'tezos', name: 'Tezos', icon: '🔵', color: '#2C7DF7', type: 'tezos', isL1: true },
    { id: 'polkadot', name: 'Polkadot', icon: '🟣', color: '#E6007A', type: 'polkadot', isL1: true }
  ];

  const tokens: Token[] = [
    { address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 }
  ];

  useEffect(() => {
    loadStrategies();
    loadUserSwaps();
  }, []);

  const loadStrategies = async () => {
    try {
      const availableStrategies = await fusionExtension.getAvailableStrategies();
      setStrategies(availableStrategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const loadUserSwaps = async () => {
    if (userAddress) {
      try {
        const swaps = fusionExtension.getUserSwaps(userAddress);
        setUserSwaps(swaps);
      } catch (error) {
        console.error('Error loading user swaps:', error);
      }
    }
  };

  const handleGetQuote = async () => {
    if (!fromAmount || !userAddress) return;

    setIsLoading(true);
    try {
      const request: CrossChainSwapRequest = {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount,
        userAddress,
        slippageTolerance,
        strategy
      };

      const quoteResult = await fusionExtension.getCrossChainQuote(request);
      setQuote(quoteResult);
    } catch (error) {
      console.error('Error getting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!quote || !userAddress) return;

    setIsExecuting(true);
    try {
      const request: CrossChainSwapRequest = {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount,
        userAddress,
        slippageTolerance,
        strategy
      };

      const swap = await fusionExtension.initiateCrossChainSwap(request);
      setSwapStatus(swap);

      // Execute the swap
      const executedSwap = await fusionExtension.executeCrossChainSwap(swap.swapId);
      setSwapStatus(executedSwap);
      
      // Reload user swaps
      await loadUserSwaps();
    } catch (error) {
      console.error('Error executing swap:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteStrategy = async (strategy: DeFiStrategy) => {
    if (!userAddress || !fromAmount) return;

    setIsExecuting(true);
    try {
      const params: StrategyParams = {
        userAddress,
        amount: fromAmount,
        token: fromToken,
        chain: fromChain,
        duration: 30 * 24 * 60 * 60, // 30 days
        riskTolerance: 'medium'
      };

      const result = await fusionExtension.executeDeFiStrategy(strategy.name.toLowerCase().replace(' ', '_'), params);
      console.log('Strategy execution result:', result);
    } catch (error) {
      console.error('Error executing strategy:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSwitchChains = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
  };

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const formatAmount = (amount: string, decimals: number) => {
    return parseFloat(amount) / Math.pow(10, decimals);
  };

  const getChainTokens = (chain: Chain): Token[] => {
    // In production, fetch tokens from the chain's API
    return tokens;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'expired':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Multi-Chain Swap & DeFi Strategies</h1>
        <p className="text-gray-600">Swap tokens across 20+ blockchains with advanced DeFi strategies</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="swap">Cross-Chain Swap</TabsTrigger>
          <TabsTrigger value="strategies">DeFi Strategies</TabsTrigger>
          <TabsTrigger value="history">Swap History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                Cross-Chain Swap
              </CardTitle>
              <CardDescription>
                Swap tokens across different blockchains with atomic swaps and HTLC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Address Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Address</label>
                <Input
                  placeholder="Enter your wallet address"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                />
              </div>

              {/* Chain Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Chain</label>
                  <Select value={fromChain} onValueChange={setFromChain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          <div className="flex items-center gap-2">
                            <span>{chain.icon}</span>
                            <span>{chain.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Chain</label>
                  <Select value={toChain} onValueChange={setToChain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          <div className="flex items-center gap-2">
                            <span>{chain.icon}</span>
                            <span>{chain.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Token Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Token</label>
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getChainTokens(chains.find(c => c.id === fromChain)!).map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-gray-500">({token.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Token</label>
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getChainTokens(chains.find(c => c.id === toChain)!).map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-gray-500">({token.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                />
              </div>

              {/* Advanced Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Strategy</label>
                  <Select value={strategy} onValueChange={(value: 'atomic' | 'optimistic' | 'hybrid') => setStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atomic">Atomic</SelectItem>
                      <SelectItem value="optimistic">Optimistic</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slippage Tolerance (%)</label>
                  <Input
                    type="number"
                    placeholder="0.5"
                    value={slippageTolerance}
                    onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSwitchChains} variant="neutral-secondary" className="w-full">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Switch Chains
                  </Button>
                </div>
              </div>

              {/* Quote Display */}
              {quote && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">To Amount:</span>
                        <div className="font-semibold">{quote.toAmount}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <div className="font-semibold">${quote.price}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Gas Estimate:</span>
                        <div className="font-semibold">{quote.gasEstimate}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Protocols:</span>
                        <div className="flex gap-1">
                          {quote.protocols.map((protocol, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {protocol}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleGetQuote} 
                  disabled={isLoading || !fromAmount || !userAddress}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Getting Quote...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Get Quote
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleExecuteSwap} 
                  disabled={isExecuting || !quote || !userAddress}
                  className="flex-1"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Executing Swap...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Execute Swap
                    </>
                  )}
                </Button>
              </div>

              {/* Swap Status */}
              {swapStatus && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Swap Status: {swapStatus.status}</span>
                      {getStatusIcon(swapStatus.status)}
                    </div>
                    {swapStatus.error && (
                      <div className="text-red-600 mt-2">Error: {swapStatus.error}</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                DeFi Strategies
              </CardTitle>
              <CardDescription>
                Execute advanced DeFi strategies across multiple chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.name}
                    strategy={strategy}
                    onExecute={handleExecuteStrategy}
                    isExecuting={isExecuting}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Swap History</CardTitle>
              <CardDescription>
                View your recent cross-chain swaps and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSwaps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No swaps found. Start by executing a cross-chain swap.
                </div>
              ) : (
                <div className="space-y-4">
                  {userSwaps.map((swap) => (
                    <Card key={swap.swapId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(swap.status)}
                          <div>
                            <div className="font-semibold">
                              {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                            </div>
                            <div className="text-sm text-gray-600">
                              {swap.fromChain} → {swap.toChain}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(swap.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getStatusColor(swap.status)}`}>
                            {swap.status.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Strategy: {swap.strategy}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Track your DeFi performance and cross-chain activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{userSwaps.length}</div>
                    <div className="text-sm text-gray-600">Total Swaps</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {userSwaps.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Successful Swaps</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {strategies.length}
                    </div>
                    <div className="text-sm text-gray-600">Available Strategies</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 