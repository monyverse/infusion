import axios from 'axios';
import { Logger } from './logger';

export interface SwapQuoteRequest {
  chain: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippage?: number;
  recipient?: string;
}

export interface SwapQuoteResponse {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: number;
  gasCost: number;
  route: string[];
  protocol: string;
  tx: {
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
}

export interface SwapExecutionRequest {
  chain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number;
  recipient: string;
  tx: {
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
}

export interface LimitOrderRequest {
  chain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  price: string;
  expiry: number;
  maker: string;
}

export interface FusionPlusRequest {
  sourceChain: string;
  destinationChain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  recipient: string;
  deadline: number;
}

export class OneInchAPI {
  private apiKey: string;
  private baseUrl: string;
  private logger: Logger;

  constructor() {
    this.apiKey = process.env.INCH_API_KEY || '';
    this.baseUrl = process.env.INCH_API_URL || 'https://api.1inch.dev';
    this.logger = new Logger('OneInchAPI');

    if (!this.apiKey) {
      this.logger.warn('1inch API key not provided, some features may not work');
    }
  }

  /**
   * Get swap quote from 1inch
   */
  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse | null> {
    try {
      const chainId = this.getChainId(request.chain);
      const url = `${this.baseUrl}/swap/v6.0/${chainId}/quote`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params: {
          src: request.tokenIn,
          dst: request.tokenOut,
          amount: request.amount,
          from: request.recipient || '0x0000000000000000000000000000000000000000',
          slippage: request.slippage || 1,
        },
      });

      const data = response.data;
      
      return {
        tokenIn: data.src,
        tokenOut: data.dst,
        amountIn: data.srcAmount,
        amountOut: data.dstAmount,
        priceImpact: data.priceImpact,
        gasEstimate: data.gas,
        gasCost: this.calculateGasCost(data.gas, data.gasPrice),
        route: data.protocols || [],
        protocol: data.protocol || '1inch',
        tx: {
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value,
          gas: data.tx.gas,
          gasPrice: data.tx.gasPrice,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get swap quote: ${error}`);
      return null;
    }
  }

  /**
   * Execute swap using 1inch
   */
  async executeSwap(request: SwapExecutionRequest): Promise<any> {
    try {
      const chainId = this.getChainId(request.chain);
      const url = `${this.baseUrl}/swap/v6.0/${chainId}/swap`;
      
      const response = await axios.post(url, {
        src: request.tokenIn,
        dst: request.tokenOut,
        amount: request.amountIn,
        from: request.recipient,
        slippage: request.slippage,
        tx: request.tx,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to execute swap: ${error}`);
      throw error;
    }
  }

  /**
   * Create limit order using 1inch Limit Order Protocol
   */
  async createLimitOrder(request: LimitOrderRequest): Promise<any> {
    try {
      const chainId = this.getChainId(request.chain);
      const url = `${this.baseUrl}/limit-order/v4.0/${chainId}/order`;
      
      const response = await axios.post(url, {
        maker: request.maker,
        makerAsset: request.tokenIn,
        takerAsset: request.tokenOut,
        makingAmount: request.amountIn,
        takingAmount: request.price,
        salt: this.generateSalt(),
        expiration: request.expiry,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create limit order: ${error}`);
      throw error;
    }
  }

  /**
   * Get Fusion+ quote for cross-chain swaps
   */
  async getFusionPlusQuote(request: FusionPlusRequest): Promise<any> {
    try {
      const url = `${this.baseUrl}/fusion-plus/v1.0/quote`;
      
      const response = await axios.post(url, {
        sourceChain: request.sourceChain,
        destinationChain: request.destinationChain,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountIn: request.amountIn,
        recipient: request.recipient,
        deadline: request.deadline,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Fusion+ quote: ${error}`);
      throw error;
    }
  }

  /**
   * Execute Fusion+ cross-chain swap
   */
  async executeFusionPlusSwap(quote: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/fusion-plus/v1.0/execute`;
      
      const response = await axios.post(url, quote, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to execute Fusion+ swap: ${error}`);
      throw error;
    }
  }

  /**
   * Get token price from 1inch
   */
  async getTokenPrice(token: string, chain: string): Promise<number> {
    try {
      const chainId = this.getChainId(chain);
      const url = `${this.baseUrl}/price/v1.1/${chainId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          tokens: token,
          currency: 'USD',
        },
      });

      return response.data[token] || 0;
    } catch (error) {
      this.logger.error(`Failed to get token price: ${error}`);
      return 0;
    }
  }

  /**
   * Get supported tokens for a chain
   */
  async getSupportedTokens(chain: string): Promise<any[]> {
    try {
      const chainId = this.getChainId(chain);
      const url = `${this.baseUrl}/token/v1.2/${chainId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.tokens || [];
    } catch (error) {
      this.logger.error(`Failed to get supported tokens: ${error}`);
      return [];
    }
  }

  /**
   * Get limit orders for a user
   */
  async getLimitOrders(chain: string, maker: string): Promise<any[]> {
    try {
      const chainId = this.getChainId(chain);
      const url = `${this.baseUrl}/limit-order/v4.0/${chainId}/orders`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          maker,
        },
      });

      return response.data.orders || [];
    } catch (error) {
      this.logger.error(`Failed to get limit orders: ${error}`);
      return [];
    }
  }

  /**
   * Cancel a limit order
   */
  async cancelLimitOrder(chain: string, orderHash: string): Promise<any> {
    try {
      const chainId = this.getChainId(chain);
      const url = `${this.baseUrl}/limit-order/v4.0/${chainId}/cancel`;
      
      const response = await axios.post(url, {
        orderHash,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to cancel limit order: ${error}`);
      throw error;
    }
  }

  /**
   * Get chain ID from chain name
   */
  private getChainId(chain: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'polygon': 137,
      'arbitrum': 42161,
      'base': 8453,
      'sepolia': 11155111,
      'polygon_mumbai': 80001,
      'arbitrum_sepolia': 421614,
      'base_sepolia': 84532,
      'etherlink': 128123,
    };

    return chainMap[chain] || 1;
  }

  /**
   * Calculate gas cost in USD
   */
  private calculateGasCost(gas: number, gasPrice: string): number {
    const gasInWei = BigInt(gas) * BigInt(gasPrice);
    const gasInEth = Number(gasInWei) / 1e18;
    
    // Assume ETH price of $2000 for now
    // In production, this should fetch real-time price
    return gasInEth * 2000;
  }

  /**
   * Generate random salt for limit orders
   */
  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return [
      'ethereum',
      'polygon', 
      'arbitrum',
      'base',
      'sepolia',
      'polygon_mumbai',
      'arbitrum_sepolia',
      'base_sepolia',
      'etherlink',
    ];
  }

  /**
   * Check if chain supports Fusion+
   */
  supportsFusionPlus(chain: string): boolean {
    const fusionPlusChains = [
      'ethereum',
      'polygon',
      'arbitrum', 
      'base',
    ];
    return fusionPlusChains.includes(chain);
  }
} 