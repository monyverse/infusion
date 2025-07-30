import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { getChainColor, getChainIcon, getChainName, formatNumber } from '../../lib/utils';

export interface SwapToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  priceUSD: string;
  chain: string;
}

export interface SwapQuote {
  fromToken: SwapToken;
  toToken: SwapToken;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  fee: string;
  estimatedGas: string;
  route: string[];
  estimatedTime: number;
}

interface MultiChainSwapProps {
  onSwap?: (quote: SwapQuote) => void;
  className?: string;
}

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷', color: '#627EEA' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '🟡', color: '#F7931A' },
  { id: 'stellar', name: 'Stellar', icon: '💫', color: '#000000' },
  { id: 'near', name: 'NEAR', icon: '🌐', color: '#000000' },
  { id: 'aptos', name: 'Aptos', icon: '🟢', color: '#00D4AA' },
  { id: 'sui', name: 'Sui', icon: '🌊', color: '#6FBCF0' },
  { id: 'tron', name: 'TRON', icon: '⚡', color: '#FF0000' },
  { id: 'cosmos', name: 'Cosmos', icon: '🌌', color: '#2E3148' },
  { id: 'ton', name: 'TON', icon: '📱', color: '#0088CC' },
  { id: 'monad', name: 'Monad', icon: '🏎️', color: '#FF6B35' },
  { id: 'starknet', name: 'Starknet', icon: '🛡️', color: '#00FF00' },
  { id: 'cardano', name: 'Cardano', icon: '🔷', color: '#0033AD' },
  { id: 'xrp', name: 'XRP Ledger', icon: '🏛️', color: '#23292F' },
  { id: 'icp', name: 'Internet Computer', icon: '🖥️', color: '#FF6B6B' },
  { id: 'tezos', name: 'Tezos', icon: '🗳️', color: '#2C7DF7' },
  { id: 'polkadot', name: 'Polkadot', icon: '🔴', color: '#E6007A' },
  { id: 'etherlink', name: 'Etherlink', icon: '🔗', color: '#2C7DF7' },
];

const POPULAR_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', priceUSD: '3000' },
  { symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', priceUSD: '45000' },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', priceUSD: '1' },
  { symbol: 'USDT', name: 'Tether', chain: 'ethereum', priceUSD: '1' },
  { symbol: 'XLM', name: 'Stellar Lumens', chain: 'stellar', priceUSD: '0.12' },
  { symbol: 'NEAR', name: 'NEAR Protocol', chain: 'near', priceUSD: '3.50' },
  { symbol: 'APT', name: 'Aptos', chain: 'aptos', priceUSD: '8.20' },
  { symbol: 'SUI', name: 'Sui', chain: 'sui', priceUSD: '1.45' },
  { symbol: 'TRX', name: 'TRON', chain: 'tron', priceUSD: '0.08' },
  { symbol: 'ATOM', name: 'Cosmos', chain: 'cosmos', priceUSD: '9.80' },
];

export const MultiChainSwap: React.FC<MultiChainSwapProps> = ({
  onSwap,
  className = ''
}) => {
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('bitcoin');
  const [fromToken, setFromToken] = useState<SwapToken | null>(null);
  const [toToken, setToToken] = useState<SwapToken | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [showChainSelector, setShowChainSelector] = useState<'from' | 'to' | null>(null);

  // Auto-select tokens when chains change
  useEffect(() => {
    const fromChainTokens = POPULAR_TOKENS.filter(token => token.chain === fromChain);
    const toChainTokens = POPULAR_TOKENS.filter(token => token.chain === toChain);
    
    if (fromChainTokens.length > 0 && !fromToken) {
      setFromToken({
        ...fromChainTokens[0],
        address: '',
        decimals: 18,
        priceUSD: fromChainTokens[0].priceUSD
      });
    }
    
    if (toChainTokens.length > 0 && !toToken) {
      setToToken({
        ...toChainTokens[0],
        address: '',
        decimals: 18,
        priceUSD: toChainTokens[0].priceUSD
      });
    }
  }, [fromChain, toChain, fromToken, toToken]);

  // Calculate to amount when from amount changes
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const fromValue = parseFloat(fromAmount) * parseFloat(fromToken.priceUSD);
      const toValue = fromValue / parseFloat(toToken.priceUSD);
      setToAmount(toValue.toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setIsLoading(true);
    try {
      // Simulate API call to get quote
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockQuote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        priceImpact: 0.5,
        fee: '0.003',
        estimatedGas: '0.002',
        route: [fromChain, toChain],
        estimatedTime: 300
      };
      
      setQuote(mockQuote);
    } catch (error) {
      console.error('Error getting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    if (quote && onSwap) {
      onSwap(quote);
    }
  };

  const ChainSelector = ({ type }: { type: 'from' | 'to' }) => {
    const currentChain = type === 'from' ? fromChain : toChain;
    const setCurrentChain = type === 'from' ? setFromChain : setToChain;

    return (
      <AnimatePresence>
        {showChainSelector === type && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
          >
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CHAINS.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => {
                    setCurrentChain(chain.id);
                    setShowChainSelector(null);
                  }}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    currentChain === chain.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{chain.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{chain.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Chain Swap</h2>
        <p className="text-gray-600">Swap tokens across 17+ blockchain networks</p>
      </div>

      {/* From Chain & Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
        <div className="flex space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowChainSelector('from')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <span className="text-xl">{getChainIcon(fromChain)}</span>
              <span className="font-medium">{getChainName(fromChain)}</span>
              <span className="text-gray-400">▼</span>
            </button>
            <ChainSelector type="from" />
          </div>
          
          <div className="flex-1">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="font-medium">{fromToken?.symbol || 'Select'}</span>
              <span className="text-gray-400">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => {
            const tempChain = fromChain;
            const tempToken = fromToken;
            setFromChain(toChain);
            setToChain(tempChain);
            setFromToken(toToken);
            setToToken(tempToken);
          }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span className="text-xl">🔄</span>
        </button>
      </div>

      {/* To Chain & Token */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
        <div className="flex space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowChainSelector('to')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <span className="text-xl">{getChainIcon(toChain)}</span>
              <span className="font-medium">{getChainName(toChain)}</span>
              <span className="text-gray-400">▼</span>
            </button>
            <ChainSelector type="to" />
          </div>
          
          <div className="flex-1">
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div className="relative">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="font-medium">{toToken?.symbol || 'Select'}</span>
              <span className="text-gray-400">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Price Impact:</span>
              <span className="ml-2 font-medium">{quote.priceImpact}%</span>
            </div>
            <div>
              <span className="text-gray-600">Fee:</span>
              <span className="ml-2 font-medium">${quote.fee}</span>
            </div>
            <div>
              <span className="text-gray-600">Estimated Gas:</span>
              <span className="ml-2 font-medium">${quote.estimatedGas}</span>
            </div>
            <div>
              <span className="text-gray-600">Time:</span>
              <span className="ml-2 font-medium">{quote.estimatedTime}s</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleGetQuote}
          disabled={!fromToken || !toToken || !fromAmount || isLoading}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? 'Getting Quote...' : 'Get Quote'}
        </Button>
        
        <Button
          onClick={handleSwap}
          disabled={!quote}
          variant="gradient"
          className="flex-1"
        >
          Swap Now
        </Button>
      </div>

      {/* Supported Chains Grid */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Supported Networks</h3>
        <div className="grid grid-cols-6 gap-2">
          {SUPPORTED_CHAINS.map(chain => (
            <div
              key={chain.id}
              className="flex flex-col items-center p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <span className="text-lg mb-1">{chain.icon}</span>
              <span className="text-xs text-gray-600 text-center">{chain.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 