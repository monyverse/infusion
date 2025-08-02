import React, { useState, useEffect } from 'react';
import { useNEARCrossChainSwap } from '../../hooks/useNEARCrossChainSwap';
import { Button } from '../ui/button';
import { cn, formatNumber, formatAddress } from '../../lib/utils';

interface NEARCrossChainSwapProps {
  className?: string;
}

interface Token {
  symbol: string;
  name: string;
  address: string;
  icon?: string;
  decimals: number;
}

interface SwapRoute {
  chain: string;
  protocol: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fee: string;
}

const SUPPORTED_EVM_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔵', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: '#28A0F0' },
  { id: 'base', name: 'Base', icon: '🔵', color: '#0052FF' }
];

const SUPPORTED_TOKENS: Record<string, Token[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', icon: '🔵', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', icon: '💵', decimals: 6 },
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', icon: '💵', decimals: 6 }
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', icon: '🟣', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', icon: '💵', decimals: 6 }
  ],
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', icon: '🔵', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', icon: '💵', decimals: 6 }
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', icon: '🔵', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', icon: '💵', decimals: 6 }
  ],
  near: [
    { symbol: 'NEAR', name: 'NEAR Protocol', address: 'NEAR', icon: '🌐', decimals: 24 },
    { symbol: 'USDC', name: 'USD Coin', address: 'usdc.fakes.testnet', icon: '💵', decimals: 6 },
    { symbol: 'USDT', name: 'Tether USD', address: 'usdt.fakes.testnet', icon: '💵', decimals: 6 },
    { symbol: 'wNEAR', name: 'Wrapped NEAR', address: 'wrap.testnet', icon: '🌐', decimals: 24 }
  ]
};

export const NEARCrossChainSwap: React.FC<NEARCrossChainSwapProps> = ({
  className = ''
}) => {
  const [fromChain, setFromChain] = useState('ethereum');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('NEAR');
  const [fromAmount, setFromAmount] = useState('');
  const [nearAccountId, setNearAccountId] = useState('');
  const [userAddress, setUserAddress] = useState('');

  const {
    quote,
    quoteLoading,
    quoteError,
    swapLoading,
    swapError,
    swapResult,
    swapStatus,
    statusLoading,
    nearAccountId: connectedNearAccount,
    nearBalance,
    nearTokens,
    getQuote,
    executeSwap,
    getSwapStatus,
    connectNEARWallet,
    getNEARBalance,
    getNEARTokens,
    resetState
  } = useNEARCrossChainSwap({
    fusionPlusConfig: {
      apiKey: process.env.NEXT_PUBLIC_INCH_API_KEY || '',
      chainId: 1,
      privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY || '',
      rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || ''
    }
  });

  useEffect(() => {
    // Initialize NEAR wallet connection
    connectNEARWallet();
    getNEARTokens();
  }, [connectNEARWallet, getNEARTokens]);

  const handleGetQuote = async () => {
    if (!fromAmount || !userAddress || !nearAccountId) {
      return;
    }

    await getQuote({
      fromChain: fromChain as any,
      fromToken: getTokenAddress(fromChain, fromToken),
      toToken: getTokenAddress('near', toToken),
      fromAmount,
      toAmount: '0', // Will be calculated by quote
      userAddress,
      nearAccountId,
      deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    });
  };

  const handleExecuteSwap = async () => {
    if (!quote || !fromAmount || !userAddress || !nearAccountId) {
      return;
    }

    await executeSwap({
      fromChain: fromChain as any,
      fromToken: getTokenAddress(fromChain, fromToken),
      toToken: getTokenAddress('near', toToken),
      fromAmount,
      toAmount: quote.toAmount,
      userAddress,
      nearAccountId,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      timelock: 3600 // 1 hour
    });
  };

  const handleSwitchChains = () => {
    setFromChain('near');
    setFromToken('NEAR');
    setToToken('ETH');
  };

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const getTokenAddress = (chain: string, symbol: string): string => {
    const tokens = SUPPORTED_TOKENS[chain] || [];
    const token = tokens.find(t => t.symbol === symbol);
    return token?.address || '';
  };

  const getTokenIcon = (chain: string, symbol: string): string => {
    const tokens = SUPPORTED_TOKENS[chain] || [];
    const token = tokens.find(t => t.symbol === symbol);
    return token?.icon || '🪙';
  };

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return (num / Math.pow(10, decimals)).toFixed(6);
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🌐 NEAR Cross-Chain Swap</h2>
        <p className="text-gray-600">Swap tokens between EVM chains and NEAR using Fusion+</p>
      </div>

      {/* Chain Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">From Chain</label>
        <div className="grid grid-cols-4 gap-2">
          {SUPPORTED_EVM_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setFromChain(chain.id)}
              className={cn(
                'flex items-center justify-center p-3 rounded-lg border-2 transition-all',
                fromChain === chain.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="text-lg mr-2">{chain.icon}</span>
              <span className="text-sm font-medium">{chain.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Swap Interface */}
      <div className="space-y-4 mb-6">
        {/* From Token */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">From</label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Balance:</span>
              <span className="text-sm font-medium">0.00</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border">
              <span className="text-lg">{getTokenIcon(fromChain, fromToken)}</span>
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium"
              >
                {SUPPORTED_TOKENS[fromChain]?.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwitchTokens}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token (NEAR) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">To (NEAR)</label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Balance:</span>
              <span className="text-sm font-medium">{nearBalance || '0.00'} NEAR</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border">
              <span className="text-lg">{getTokenIcon('near', toToken)}</span>
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium"
              >
                {SUPPORTED_TOKENS.near?.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={quote?.toAmount ? formatAmount(quote.toAmount, 24) : ''}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">EVM Wallet Address</label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-white rounded-lg px-3 py-2 border border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">NEAR Account ID</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={nearAccountId}
              onChange={(e) => setNearAccountId(e.target.value)}
              placeholder="user.near"
              className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 focus:border-blue-500 focus:outline-none"
            />
            <Button
              onClick={() => connectNEARWallet()}
              variant="outline"
              className="px-4"
            >
              Connect
            </Button>
          </div>
          {connectedNearAccount && (
            <p className="text-sm text-green-600 mt-1">Connected: {connectedNearAccount}</p>
          )}
        </div>
      </div>

      {/* Quote Display */}
      {quote && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Swap Quote</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium">1 {fromToken} = {formatNumber(parseFloat(quote.price))} {toToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Gas:</span>
              <span className="font-medium">{quote.gasEstimate} gas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Fee:</span>
              <span className="font-medium">{quote.totalFee}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-medium">{Math.floor(quote.estimatedTime / 60)} minutes</span>
            </div>
          </div>
          
          {/* Route Display */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Route</h4>
            <div className="space-y-2">
              {quote.route?.map((route: SwapRoute, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{route.chain}</span>
                    <span>→</span>
                    <span className="text-gray-600">{route.protocol}</span>
                  </div>
                  <span className="text-gray-600">{route.fee}% fee</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {quoteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{quoteError}</p>
        </div>
      )}

      {swapError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{swapError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleGetQuote}
          disabled={quoteLoading || !fromAmount || !userAddress || !nearAccountId}
          className="flex-1"
          variant="outline"
        >
          {quoteLoading ? 'Getting Quote...' : 'Get Quote'}
        </Button>
        <Button
          onClick={handleExecuteSwap}
          disabled={swapLoading || !quote || !fromAmount || !userAddress || !nearAccountId}
          className="flex-1"
        >
          {swapLoading ? 'Executing Swap...' : 'Execute Swap'}
        </Button>
      </div>

      {/* Swap Result */}
      {swapResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Swap Initiated!</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Swap ID:</span>
              <span className="font-mono text-xs">{swapResult.crossChainSwapId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EVM Order:</span>
              <span className="font-mono text-xs">{formatAddress(swapResult.evmOrder.orderHash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NEAR Order:</span>
              <span className="font-mono text-xs">{swapResult.nearOrder.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-700">{swapResult.status}</span>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Next Steps</h4>
            <ul className="space-y-1 text-xs text-green-800">
              {swapResult.nextSteps?.map((step: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Swap Status */}
      {swapStatus && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Swap Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Progress:</span>
              <span className="font-medium">{swapStatus.progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EVM Status:</span>
              <span className="font-medium">{swapStatus.evmStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NEAR Status:</span>
              <span className="font-medium">{swapStatus.nearStatus}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 