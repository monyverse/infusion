import { ethers } from 'ethers';
import { FusionSDK } from '@1inch/fusion-sdk';
import { NEARService, NEAR_CONFIGS, NEARFusionOrder } from './near-service';

export interface FusionPlusConfig {
  apiKey: string;
  chainId: number;
  privateKey: string;
  rpcUrl: string;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  gasEstimate: string;
  protocols: string[];
  tx?: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
  };
}

export interface CrossChainSwapParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  deadline?: number;
}

export interface NEARCrossChainSwapParams {
  fromChain: 'ethereum' | 'polygon' | 'arbitrum' | 'base';
  toChain: 'near';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  nearAccountId: string;
  deadline?: number;
  timelock?: number;
}

export interface OrderStatus {
  orderHash: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  filledAmount?: string;
  remainingAmount?: string;
  timestamp: number;
}

export class FusionPlusService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private config: FusionPlusConfig;
  private apiKey: string;
  private fusionSDK: FusionSDK;
  private nearService: NEARService | null = null;

  constructor(config: FusionPlusConfig) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    // Initialize Fusion SDK v2
    this.fusionSDK = new FusionSDK({
      url: 'https://fusion.1inch.io',
      network: config.chainId,
      authKey: config.apiKey,
    });

    // Initialize NEAR service for cross-chain swaps
    this.initializeNEARService();
  }

  /**
   * Initialize NEAR service for cross-chain swaps
   */
  private initializeNEARService(): void {
    try {
      const nearConfig = NEAR_CONFIGS.mainnet; // Default to mainnet
      this.nearService = new NEARService(nearConfig);
    } catch (error) {
      console.error('Error initializing NEAR service:', error);
    }
  }

  /**
   * Get a quote for a token swap using 1inch Fusion+ API
   */
  async getQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    chainId: number;
  }): Promise<SwapQuote> {
    try {
      // Use Fusion SDK v2 for quote
      const quote = await this.fusionSDK.getQuote({
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        amount: params.fromAmount,
        walletAddress: this.wallet.address,
      });

      return {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: quote.toTokenAmount,
        price: quote.prices?.usd?.toToken || '0',
        gasEstimate: '0', // Fusion+ doesn't provide gas estimate in quote
        protocols: [], // Fusion+ doesn't provide protocols in quote
        tx: undefined, // Fusion+ doesn't provide tx in quote
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a swap using 1inch Fusion+ API
   */
  async executeSwap(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    userAddress: string;
    deadline?: number;
  }) {
    try {
      // Use Fusion SDK v2 for swap execution
      const preparedOrder = await this.fusionSDK.createOrder({
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        amount: params.fromAmount,
        walletAddress: params.userAddress,
        receiver: params.userAddress,
      });

      // Sign and submit the order
      const signature = await this.wallet.signMessage(preparedOrder.hash);
      
      const submittedOrder = await this.fusionSDK.submitOrder(preparedOrder.order, preparedOrder.quoteId);

      return {
        orderHash: submittedOrder.orderHash,
        status: 'submitted',
        txHash: undefined, // Fusion+ doesn't provide txHash immediately
        order: submittedOrder,
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cross-chain quote using Fusion+ API
   * Note: Fusion SDK v2 doesn't have built-in cross-chain support
   * This would need to be implemented using the 1inch API directly
   */
  async getCrossChainQuote(params: CrossChainSwapParams) {
    try {
      // For cross-chain quotes, we need to use the 1inch API directly
      // This is a placeholder implementation
      throw new Error('Cross-chain quotes not implemented in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error getting cross-chain quote:', error);
      throw new Error(`Failed to get cross-chain quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute cross-chain swap using Fusion+ API
   * Note: Fusion SDK v2 doesn't have built-in cross-chain support
   * This would need to be implemented using the 1inch API directly
   */
  async executeCrossChainSwap(params: CrossChainSwapParams) {
    try {
      // For cross-chain swaps, we need to use the 1inch API directly
      // This is a placeholder implementation
      throw new Error('Cross-chain swaps not implemented in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error executing cross-chain swap:', error);
      throw new Error(`Failed to execute cross-chain swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get quote for EVM to NEAR cross-chain swap
   */
  async getNEARCrossChainQuote(params: NEARCrossChainSwapParams) {
    try {
      if (!this.nearService) {
        throw new Error('NEAR service not initialized');
      }

      // Get quote from source chain (EVM)
      const evmQuote = await this.getQuote({
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        chainId: this.getChainIdFromName(params.fromChain)
      });

      // Get quote from NEAR side
      const nearQuote = await this.nearService.getSwapQuote({
        fromToken: params.toToken,
        toToken: params.fromToken,
        fromAmount: params.toAmount
      });

      return {
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        evmQuote,
        nearQuote,
        estimatedTime: 300, // 5 minutes
        gasEstimate: evmQuote.gasEstimate,
        totalFee: '0.005', // 0.5% total fee
        route: [
          {
            chain: params.fromChain,
            protocol: '1inch-fusion',
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.fromAmount,
            fee: '0.003'
          },
          {
            chain: 'near',
            protocol: 'ref-finance',
            fromToken: params.toToken,
            toToken: params.fromToken,
            amount: params.toAmount,
            fee: '0.002'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting NEAR cross-chain quote:', error);
      throw new Error(`Failed to get NEAR cross-chain quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute EVM to NEAR cross-chain swap
   */
  async executeNEARCrossChainSwap(params: NEARCrossChainSwapParams) {
    try {
      if (!this.nearService) {
        throw new Error('NEAR service not initialized');
      }

      // Create Fusion+ order on EVM side
      const evmOrder = await this.executeSwap({
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        userAddress: params.userAddress,
        deadline: params.deadline
      });

      // Create NEAR Fusion order
      const timelock = params.timelock || 3600; // 1 hour default
      const nearOrder = await this.nearService.createFusionOrder({
        fromToken: params.toToken,
        toToken: params.fromToken,
        fromAmount: params.toAmount,
        toAmount: params.fromAmount,
        userAddress: params.nearAccountId,
        timelock
      });

      return {
        evmOrder: {
          orderHash: evmOrder.orderHash,
          status: evmOrder.status,
          txHash: evmOrder.txHash
        },
        nearOrder: {
          orderId: nearOrder.orderId,
          status: nearOrder.status,
          hashlock: nearOrder.hashlock,
          secret: nearOrder.secret,
          expiresAt: nearOrder.expiresAt
        },
        crossChainSwapId: `cc_swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'initiated',
        estimatedTime: timelock,
        nextSteps: [
          '1. Wait for EVM order to be filled',
          '2. Execute NEAR swap using revealed secret',
          '3. Complete cross-chain transfer'
        ]
      };
    } catch (error) {
      console.error('Error executing NEAR cross-chain swap:', error);
      throw new Error(`Failed to execute NEAR cross-chain swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get NEAR cross-chain swap status
   */
  async getNEARCrossChainSwapStatus(swapId: string) {
    try {
      // This would query the status of a cross-chain swap
      // For now, returning mock status
      return {
        swapId,
        status: 'pending',
        evmStatus: 'filled',
        nearStatus: 'pending',
        progress: 50,
        estimatedCompletion: Date.now() + 1800000, // 30 minutes
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error getting NEAR cross-chain swap status:', error);
      throw new Error(`Failed to get NEAR cross-chain swap status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get order status using Fusion+ API
   */
  async getOrderStatus(orderHash: string): Promise<OrderStatus> {
    try {
      const status = await this.fusionSDK.getOrderStatus(orderHash);
      
      return {
        orderHash,
        status: this.mapOrderStatus(status.status),
        filledAmount: status.fills.length > 0 ? status.fills[0].filledMakerAmount : undefined,
        remainingAmount: undefined, // Not provided in OrderStatusResponse
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting order status:', error);
      throw new Error(`Failed to get order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get swap status using Fusion+ API
   * Note: Fusion SDK v2 doesn't have getSwapStatus method
   */
  async getSwapStatus(swapHash: string) {
    try {
      // Fusion SDK v2 doesn't have getSwapStatus method
      // This would need to be implemented using the 1inch API directly
      throw new Error('getSwapStatus not available in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error getting swap status:', error);
      throw new Error(`Failed to get swap status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get supported tokens for a chain
   * Note: Fusion SDK v2 doesn't have getSupportedTokens method
   */
  async getSupportedTokens(chainId: number) {
    try {
      // Fusion SDK v2 doesn't have getSupportedTokens method
      // This would need to be implemented using the 1inch API directly
      throw new Error('getSupportedTokens not available in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      throw new Error(`Failed to get supported tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active orders for a user
   */
  async getActiveOrders(userAddress: string) {
    try {
      const orders = await this.fusionSDK.getActiveOrders({ page: 1, limit: 100 });
      return orders;
    } catch (error) {
      console.error('Error getting active orders:', error);
      throw new Error(`Failed to get active orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel an order
   * Note: Fusion SDK v2 doesn't have cancelOrder method
   */
  async cancelOrder(orderHash: string) {
    try {
      // Fusion SDK v2 doesn't have cancelOrder method
      // This would need to be implemented using the 1inch API directly
      throw new Error('cancelOrder not available in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Estimate gas for a swap
   * Note: Fusion SDK v2 doesn't have estimateGas method
   */
  async estimateGas(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    userAddress: string;
  }) {
    try {
      // Fusion SDK v2 doesn't have estimateGas method
      // This would need to be implemented using the 1inch API directly
      throw new Error('estimateGas not available in Fusion SDK v2. Use 1inch API directly.');
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return this.config.chainId;
  }

  /**
   * Get Fusion SDK instance
   */
  getFusionSDK(): FusionSDK {
    return this.fusionSDK;
  }

  /**
   * Get chain ID from chain name
   */
  private getChainIdFromName(chainName: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'polygon': 137,
      'arbitrum': 42161,
      'base': 8453,
      'sepolia': 11155111,
      'polygon-mumbai': 80001,
      'arbitrum-sepolia': 421614,
      'base-sepolia': 84532
    };
    
    return chainMap[chainName] || 1; // Default to Ethereum mainnet
  }

  /**
   * Map Fusion SDK OrderStatus to our OrderStatus
   */
  private mapOrderStatus(status: any): 'pending' | 'filled' | 'cancelled' | 'expired' {
    switch (status) {
      case 'pending':
      case 'partially-filled':
        return 'pending';
      case 'filled':
        return 'filled';
      case 'cancelled':
        return 'cancelled';
      case 'expired':
      case 'false-predicate':
      case 'not-enough-balance-or-allowance':
      case 'wrong-permit':
      case 'invalid-signature':
        return 'expired';
      default:
        return 'pending';
    }
  }
}

export function createFusionPlusService(config: FusionPlusConfig): FusionPlusService {
  return new FusionPlusService(config);
}

/**
 * Default Fusion+ configurations for different networks
 */
export const FUSION_PLUS_CONFIGS = {
  mainnet: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 1,
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your_key',
  },
  sepolia: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 11155111,
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.drpc.org',
  },
  arbitrum: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 42161,
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  },
  polygon: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 137,
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  },
  base: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 8453,
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
  near: {
    apiKey: process.env.INCH_API_KEY || '',
    chainId: 1313161554, // NEAR chain ID for Fusion+
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.NEAR_RPC_URL || 'https://rpc.mainnet.near.org',
  },
}; 