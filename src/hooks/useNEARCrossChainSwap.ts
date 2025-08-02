import { useState, useCallback } from 'react';
import { FusionPlusService, NEARCrossChainSwapParams } from '../services/fusion-plus';
import { NEARService, NEAR_CONFIGS } from '../services/near-service';

export interface UseNEARCrossChainSwapConfig {
  fusionPlusConfig: {
    apiKey: string;
    chainId: number;
    privateKey: string;
    rpcUrl: string;
  };
  nearConfig?: {
    networkId: string;
    nodeUrl: string;
    walletUrl: string;
    helperUrl: string;
    explorerUrl: string;
  };
}

export interface NEARCrossChainSwapState {
  // Quote state
  quote: any | null;
  quoteLoading: boolean;
  quoteError: string | null;
  
  // Swap state
  swapLoading: boolean;
  swapError: string | null;
  swapResult: any | null;
  
  // Status state
  swapStatus: any | null;
  statusLoading: boolean;
  statusError: string | null;
  
  // NEAR state
  nearAccountId: string | null;
  nearBalance: string | null;
  nearTokens: any[] | null;
}

export interface UseNEARCrossChainSwapReturn extends NEARCrossChainSwapState {
  // Actions
  getQuote: (params: Omit<NEARCrossChainSwapParams, 'toChain'>) => Promise<void>;
  executeSwap: (params: NEARCrossChainSwapParams) => Promise<void>;
  getSwapStatus: (swapId: string) => Promise<void>;
  
  // NEAR actions
  connectNEARWallet: () => Promise<void>;
  getNEARBalance: (accountId: string) => Promise<void>;
  getNEARTokens: () => Promise<void>;
  
  // Utility functions
  resetState: () => void;
}

export function useNEARCrossChainSwap(config: UseNEARCrossChainSwapConfig): UseNEARCrossChainSwapReturn {
  const [fusionPlusService] = useState(() => new FusionPlusService(config.fusionPlusConfig));
  const [nearService] = useState(() => new NEARService(config.nearConfig || NEAR_CONFIGS.mainnet));
  
  const [state, setState] = useState<NEARCrossChainSwapState>({
    quote: null,
    quoteLoading: false,
    quoteError: null,
    swapLoading: false,
    swapError: null,
    swapResult: null,
    swapStatus: null,
    statusLoading: false,
    statusError: null,
    nearAccountId: null,
    nearBalance: null,
    nearTokens: null
  });

  const getQuote = useCallback(async (params: Omit<NEARCrossChainSwapParams, 'toChain'>) => {
    setState(prev => ({ ...prev, quoteLoading: true, quoteError: null }));
    
    try {
      const quote = await fusionPlusService.getNEARCrossChainQuote({
        ...params,
        toChain: 'near'
      });
      
      setState(prev => ({ 
        ...prev, 
        quote, 
        quoteLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        quoteError: error instanceof Error ? error.message : 'Unknown error',
        quoteLoading: false 
      }));
    }
  }, [fusionPlusService]);

  const executeSwap = useCallback(async (params: NEARCrossChainSwapParams) => {
    setState(prev => ({ ...prev, swapLoading: true, swapError: null }));
    
    try {
      const result = await fusionPlusService.executeNEARCrossChainSwap(params);
      
      setState(prev => ({ 
        ...prev, 
        swapResult: result, 
        swapLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        swapError: error instanceof Error ? error.message : 'Unknown error',
        swapLoading: false 
      }));
    }
  }, [fusionPlusService]);

  const getSwapStatus = useCallback(async (swapId: string) => {
    setState(prev => ({ ...prev, statusLoading: true, statusError: null }));
    
    try {
      const status = await fusionPlusService.getNEARCrossChainSwapStatus(swapId);
      
      setState(prev => ({ 
        ...prev, 
        swapStatus: status, 
        statusLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        statusError: error instanceof Error ? error.message : 'Unknown error',
        statusLoading: false 
      }));
    }
  }, [fusionPlusService]);

  const connectNEARWallet = useCallback(async () => {
    try {
      await nearService.initializeWallet();
      // In a real implementation, this would connect to NEAR wallet
      // For now, we'll use a mock account ID
      setState(prev => ({ 
        ...prev, 
        nearAccountId: 'user.near' 
      }));
    } catch (error) {
      console.error('Error connecting NEAR wallet:', error);
    }
  }, [nearService]);

  const getNEARBalance = useCallback(async (accountId: string) => {
    try {
      const balance = await nearService.getAccountBalance(accountId);
      setState(prev => ({ 
        ...prev, 
        nearBalance: balance 
      }));
    } catch (error) {
      console.error('Error getting NEAR balance:', error);
    }
  }, [nearService]);

  const getNEARTokens = useCallback(async () => {
    try {
      const tokens = await nearService.getSupportedTokens();
      setState(prev => ({ 
        ...prev, 
        nearTokens: tokens 
      }));
    } catch (error) {
      console.error('Error getting NEAR tokens:', error);
    }
  }, [nearService]);

  const resetState = useCallback(() => {
    setState({
      quote: null,
      quoteLoading: false,
      quoteError: null,
      swapLoading: false,
      swapError: null,
      swapResult: null,
      swapStatus: null,
      statusLoading: false,
      statusError: null,
      nearAccountId: null,
      nearBalance: null,
      nearTokens: null
    });
  }, []);

  return {
    ...state,
    getQuote,
    executeSwap,
    getSwapStatus,
    connectNEARWallet,
    getNEARBalance,
    getNEARTokens,
    resetState
  };
} 