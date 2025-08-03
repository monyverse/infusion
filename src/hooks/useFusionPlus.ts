import { useState, useCallback, useEffect } from 'react';
import { 
  FusionPlusService, 
  createFusionPlusService, 
  FUSION_PLUS_CONFIGS,
  type SwapQuote,
  type CrossChainSwapParams 
} from '@/services/fusion-plus';

export interface UseFusionPlusConfig {
  chainId: number;
  apiKey: string;
  privateKey: string;
  rpcUrl?: string;
}

export interface UseFusionPlusReturn {
  // Service instance
  service: FusionPlusService | null;
  
  // Quote state
  quote: SwapQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  
  // Swap state
  swapLoading: boolean;
  swapError: string | null;
  swapResult: any | null;
  
  // Cross-chain state
  crossChainQuote: any | null;
  crossChainLoading: boolean;
  crossChainError: string | null;
  crossChainResult: any | null;
  
  // Actions
  getQuote: (params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
  }) => Promise<void>;
  
  executeSwap: (params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    userAddress: string;
    deadline?: number;
  }) => Promise<void>;
  
  getCrossChainQuote: (params: CrossChainSwapParams) => Promise<void>;
  
  executeCrossChainSwap: (params: CrossChainSwapParams) => Promise<void>;
  
  // Utility functions
  getOrderStatus: (orderHash: string) => Promise<any>;
  getSwapStatus: (swapHash: string) => Promise<any>;
  cancelOrder: (orderHash: string) => Promise<any>;
  getSupportedTokens: (chainId: number) => Promise<any>;
  getActiveOrders: (userAddress: string) => Promise<any>;
}

export function useFusionPlus(config: UseFusionPlusConfig): UseFusionPlusReturn {
  const [service, setService] = useState<FusionPlusService | null>(null);
  
  // Quote state
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  // Swap state
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<any | null>(null);
  
  // Cross-chain state
  const [crossChainQuote, setCrossChainQuote] = useState<any | null>(null);
  const [crossChainLoading, setCrossChainLoading] = useState(false);
  const [crossChainError, setCrossChainError] = useState<string | null>(null);
  const [crossChainResult, setCrossChainResult] = useState<any | null>(null);

  // Initialize service
  useEffect(() => {
    if (config.apiKey && config.privateKey) {
      const rpcUrl = config.rpcUrl || FUSION_PLUS_CONFIGS.mainnet.rpcUrl;
      
      const fusionService = createFusionPlusService({
        apiKey: config.apiKey,
        chainId: config.chainId,
        privateKey: config.privateKey,
        rpcUrl,
      });
      
      setService(fusionService);
    }
  }, [config.apiKey, config.privateKey, config.chainId, config.rpcUrl]);

  // Get quote
  const getQuote = useCallback(async (params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
  }) => {
    if (!service) {
      setQuoteError('Service not initialized');
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);
    
    try {
      const result = await service.getQuote({
        ...params,
        chainId: config.chainId,
      });
      
      setQuote(result);
    } catch (error) {
      setQuoteError(error instanceof Error ? error.message : 'Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  }, [service, config.chainId]);

  // Execute swap
  const executeSwap = useCallback(async (params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    userAddress: string;
    deadline?: number;
  }) => {
    if (!service) {
      setSwapError('Service not initialized');
      return;
    }

    setSwapLoading(true);
    setSwapError(null);
    
    try {
      const result = await service.executeSwap(params);
      setSwapResult(result);
    } catch (error) {
      setSwapError(error instanceof Error ? error.message : 'Failed to execute swap');
    } finally {
      setSwapLoading(false);
    }
  }, [service]);

  // Get cross-chain quote
  const getCrossChainQuote = useCallback(async (params: CrossChainSwapParams) => {
    if (!service) {
      setCrossChainError('Service not initialized');
      return;
    }

    setCrossChainLoading(true);
    setCrossChainError(null);
    
    try {
      const result = await service.getCrossChainQuote(params);
      setCrossChainQuote(result);
    } catch (error) {
      setCrossChainError(error instanceof Error ? error.message : 'Failed to get cross-chain quote');
    } finally {
      setCrossChainLoading(false);
    }
  }, [service]);

  // Execute cross-chain swap
  const executeCrossChainSwap = useCallback(async (params: CrossChainSwapParams) => {
    if (!service) {
      setCrossChainError('Service not initialized');
      return;
    }

    setCrossChainLoading(true);
    setCrossChainError(null);
    
    try {
      const result = await service.executeCrossChainSwap(params);
      setCrossChainResult(result);
    } catch (error) {
      setCrossChainError(error instanceof Error ? error.message : 'Failed to execute cross-chain swap');
    } finally {
      setCrossChainLoading(false);
    }
  }, [service]);

  // Utility functions
  const getOrderStatus = useCallback(async (orderHash: string) => {
    if (!service) throw new Error('Service not initialized');
    return await service.getOrderStatus(orderHash);
  }, [service]);

  const getSwapStatus = useCallback(async (swapHash: string) => {
    if (!service) throw new Error('Service not initialized');
    return await service.getSwapStatus(swapHash);
  }, [service]);

  const cancelOrder = useCallback(async (orderHash: string) => {
    if (!service) throw new Error('Service not initialized');
    return await service.cancelOrder(orderHash);
  }, [service]);

  const getSupportedTokens = useCallback(async (chainId: number) => {
    if (!service) throw new Error('Service not initialized');
    return await service.getSupportedTokens(chainId);
  }, [service]);

  const getActiveOrders = useCallback(async (userAddress: string) => {
    if (!service) throw new Error('Service not initialized');
    return await service.getActiveOrders(userAddress);
  }, [service]);

  return {
    service,
    quote,
    quoteLoading,
    quoteError,
    swapLoading,
    swapError,
    swapResult,
    crossChainQuote,
    crossChainLoading,
    crossChainError,
    crossChainResult,
    getQuote,
    executeSwap,
    getCrossChainQuote,
    executeCrossChainSwap,
    getOrderStatus,
    getSwapStatus,
    cancelOrder,
    getSupportedTokens,
    getActiveOrders,
  };
} 