import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  supportsFusionPlus: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface SwapQuoteRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  chainId: number;
}

export interface SwapQuoteResponse {
  toAmount: string;
  fromAmount: string;
  protocols: Array<{
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
  }>;
  estimatedGas: string;
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface CrossChainQuoteRequest {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
}

export interface CrossChainQuoteResponse {
  route: {
    fromChainId: number;
    toChainId: number;
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    estimatedGas: string;
    bridgeFee: string;
    totalTime: number; // seconds
    steps: Array<{
      type: 'swap' | 'bridge';
      chainId: number;
      protocol: string;
      fromToken: Token;
      toToken: Token;
      fromAmount: string;
      toAmount: string;
    }>;
  };
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface SwapExecutionRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: number;
  chainId: number;
  userWalletAddress: string;
}

export interface SwapExecutionResponse {
  transactionHash: string;
  orderId?: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'expired';
  fromAmount: string;
  toAmount: string;
  filledAmount: string;
  remainingAmount: string;
  createdAt: string;
  updatedAt: string;
  txHash?: string;
}

export interface LimitOrderRequest {
  makerAsset: string;
  takerAsset: string;
  makerAmount: string;
  takerAmount: string;
  maker: string;
  chainId: number;
  expiration?: number;
  nonce?: number;
}

export interface LimitOrderResponse {
  orderId: string;
  orderHash: string;
  status: string;
  signature: string;
  order: {
    makerAsset: string;
    takerAsset: string;
    makerAmount: string;
    takerAmount: string;
    maker: string;
    expiration: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  description?: string;
  statusCode: number;
  meta?: Record<string, any>;
}

// ============================================================================
// SUPPORTED CHAINS CONFIGURATION
// ============================================================================

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Ethereum
  1: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/demo'],
    blockExplorerUrls: ['https://etherscan.io'],
    supportsFusionPlus: true,
  },
  11155111: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia.infura.io/v3/demo'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    supportsFusionPlus: true,
  },
  // Polygon
  137: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    supportsFusionPlus: true,
  },
  80001: {
    id: 80001,
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    supportsFusionPlus: true,
  },
  // Arbitrum
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    supportsFusionPlus: true,
  },
  421614: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    supportsFusionPlus: true,
  },
  // Base
  8453: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    supportsFusionPlus: true,
  },
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    supportsFusionPlus: true,
  },
  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    supportsFusionPlus: true,
  },
  11155420: {
    id: 11155420,
    name: 'Optimism Sepolia',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia.optimism.io'],
    blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
    supportsFusionPlus: true,
  },
  // BSC
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    supportsFusionPlus: true,
  },
  97: {
    id: 97,
    name: 'BSC Testnet',
    symbol: 'tBNB',
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    supportsFusionPlus: true,
  },
  // Avalanche
  43114: {
    id: 43114,
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    supportsFusionPlus: true,
  },
  43113: {
    id: 43113,
    name: 'Avalanche Fuji',
    symbol: 'AVAX',
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
    supportsFusionPlus: true,
  },
  // Fantom
  250: {
    id: 250,
    name: 'Fantom Opera',
    symbol: 'FTM',
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    supportsFusionPlus: true,
  },
  4002: {
    id: 4002,
    name: 'Fantom Testnet',
    symbol: 'FTM',
    rpcUrls: ['https://rpc.testnet.fantom.network'],
    blockExplorerUrls: ['https://testnet.ftmscan.com'],
    supportsFusionPlus: true,
  },
};

// ============================================================================
// FUSION PLUS API CLIENT
// ============================================================================

class FusionPlusAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'FusionPlusAPIError';
  }
}

export class FusionPlusAPI {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_INCH_API_KEY || '';
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'InFusion-DeFi/1.0',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey && config.headers) {
          config.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error.response?.data || error.message);
        
        if (error.response) {
          throw new FusionPlusAPIError(
            error.response.data?.error || error.response.data?.message || 'API Error',
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          throw new FusionPlusAPIError('Network Error', 0);
        } else {
          throw new FusionPlusAPIError(error.message, 0);
        }
      }
    );
  }

  // ============================================================================
  // TOKEN METHODS
  // ============================================================================

  async getTokens(chainId: number): Promise<Token[]> {
    try {
      const response = await this.client.get(`/api/1inch/proxy`, {
        params: {
          url: `https://api.1inch.dev/swap/v6.0/${chainId}/tokens`
        }
      });
      
      const tokens = response.data.tokens || {};
      return Object.values(tokens).map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        chainId
      }));
    } catch (error) {
      console.error(`Error fetching tokens for chain ${chainId}:`, error);
      throw error;
    }
  }

  async searchTokens(chainId: number, query: string): Promise<Token[]> {
    const tokens = await this.getTokens(chainId);
    const searchTerm = query.toLowerCase();
    
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchTerm) ||
      token.name.toLowerCase().includes(searchTerm) ||
      token.address.toLowerCase() === searchTerm
    );
  }

  // ============================================================================
  // SWAP QUOTE METHODS
  // ============================================================================

  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      if (!SUPPORTED_CHAINS[request.chainId]?.supportsFusionPlus) {
        throw new FusionPlusAPIError(`Chain ${request.chainId} not supported by Fusion+`, 400);
      }

      const params = new URLSearchParams({
        src: request.fromTokenAddress,
        dst: request.toTokenAddress,
        amount: request.amount,
        from: request.fromAddress,
        slippage: (request.slippage || 1).toString(),
        disableEstimate: (request.disableEstimate || false).toString(),
        allowPartialFill: (request.allowPartialFill || true).toString(),
      });

      const response = await this.client.get(`/api/1inch/proxy`, {
        params: {
          url: `https://api.1inch.dev/swap/v6.0/${request.chainId}/quote?${params.toString()}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  async getCrossChainQuote(request: CrossChainQuoteRequest): Promise<CrossChainQuoteResponse> {
    try {
      const response = await this.client.post('/api/fusion-plus/cross-chain-quote', request);
      return response.data.data;
    } catch (error) {
      console.error('Error getting cross-chain quote:', error);
      throw error;
    }
  }

  // ============================================================================
  // SWAP EXECUTION METHODS
  // ============================================================================

  async executeSwap(request: SwapExecutionRequest): Promise<SwapExecutionResponse> {
    try {
      if (!SUPPORTED_CHAINS[request.chainId]?.supportsFusionPlus) {
        throw new FusionPlusAPIError(`Chain ${request.chainId} not supported by Fusion+`, 400);
      }

      const response = await this.client.post('/api/fusion-plus/swap', {
        fromToken: request.fromTokenAddress,
        toToken: request.toTokenAddress,
        fromAmount: request.amount,
        userAddress: request.userWalletAddress,
        chainId: request.chainId,
        slippage: request.slippage,
      });

      return response.data.data;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  async executeCrossChainSwap(request: CrossChainQuoteRequest & { userWalletAddress: string }): Promise<SwapExecutionResponse> {
    try {
      const response = await this.client.post('/api/fusion-plus/cross-chain-swap', {
        ...request,
        userAddress: request.userWalletAddress,
      });

      return response.data.data;
    } catch (error) {
      console.error('Error executing cross-chain swap:', error);
      throw error;
    }
  }

  // ============================================================================
  // ORDER MANAGEMENT METHODS
  // ============================================================================

  async createLimitOrder(request: LimitOrderRequest): Promise<LimitOrderResponse> {
    try {
      const response = await this.client.post(`/api/1inch/proxy`, {
        url: `https://api.1inch.dev/orderbook/v4.0/${request.chainId}/order`,
        data: {
          makerAsset: request.makerAsset,
          takerAsset: request.takerAsset,
          makerAmount: request.makerAmount,
          takerAmount: request.takerAmount,
          maker: request.maker,
          expiration: request.expiration || Math.floor(Date.now() / 1000) + 86400, // 24 hours
          nonce: request.nonce || Date.now(),
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating limit order:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string, chainId: number): Promise<OrderStatus> {
    try {
      const response = await this.client.get(`/api/1inch/proxy`, {
        params: {
          url: `https://api.1inch.dev/orderbook/v4.0/${chainId}/order/${orderId}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  async getActiveOrders(maker: string, chainId: number): Promise<OrderStatus[]> {
    try {
      const response = await this.client.get(`/api/1inch/proxy`, {
        params: {
          url: `https://api.1inch.dev/orderbook/v4.0/${chainId}/order/maker/${maker}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting active orders:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, chainId: number): Promise<boolean> {
    try {
      await this.client.delete(`/api/1inch/proxy`, {
        data: {
          url: `https://api.1inch.dev/orderbook/v4.0/${chainId}/order/${orderId}`
        }
      });

      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getSupportedChains(): ChainConfig[] {
    return Object.values(SUPPORTED_CHAINS).filter(chain => chain.supportsFusionPlus);
  }

  isChainSupported(chainId: number): boolean {
    return SUPPORTED_CHAINS[chainId]?.supportsFusionPlus || false;
  }

  getChainConfig(chainId: number): ChainConfig | undefined {
    return SUPPORTED_CHAINS[chainId];
  }

  formatAmount(amount: string, decimals: number): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    return (num / Math.pow(10, decimals)).toFixed(6);
  }

  parseAmount(amount: string, decimals: number): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    return Math.floor(num * Math.pow(10, decimals)).toString();
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: string; timestamp: string; services: Record<string, boolean> }> {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let fusionPlusAPI: FusionPlusAPI | null = null;

export const getFusionPlusAPI = (): FusionPlusAPI => {
  if (!fusionPlusAPI) {
    fusionPlusAPI = new FusionPlusAPI();
  }
  return fusionPlusAPI;
};

export default getFusionPlusAPI;