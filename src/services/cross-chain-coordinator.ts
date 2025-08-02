import { ethers } from 'ethers';
import { FusionPlusService, FUSION_PLUS_CONFIGS } from './fusion-plus';
import { NEARService, NEAR_CONFIGS } from './near-service';
import { AptosService, APTOS_CONFIGS } from './aptos-service';
import { SuiService, SUI_CONFIGS } from './sui-service';

export interface CrossChainSwapRequest {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  userAddress: string;
  recipientAddress?: string;
  timelock?: number;
}

export interface CrossChainSwapStatus {
  swapId: string;
  status: 'initiated' | 'locked' | 'redeemed' | 'completed' | 'refunded' | 'expired' | 'failed';
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  recipientAddress: string;
  hashlock: string;
  secret?: string;
  timelock: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  transactions: {
    fromChainTx?: string;
    toChainTx?: string;
    redeemTx?: string;
    refundTx?: string;
  };
  error?: string;
}

export interface HTLCConfig {
  hashlock: string;
  timelock: number;
  recipient: string;
  sender: string;
  amount: string;
}

export class CrossChainCoordinator {
  private fusionService: FusionPlusService;
  private nearService: NEARService;
  private aptosService: AptosService;
  private suiService: SuiService;
  private swaps: Map<string, CrossChainSwapStatus> = new Map();

  constructor() {
    // Initialize services
    this.fusionService = new FusionPlusService(FUSION_PLUS_CONFIGS.sepolia);
    this.nearService = new NEARService(NEAR_CONFIGS.testnet);
    this.aptosService = new AptosService(APTOS_CONFIGS.testnet);
    this.suiService = new SuiService(SUI_CONFIGS.testnet);
  }

  /**
   * Initialize cross-chain swap
   */
  async initiateCrossChainSwap(request: CrossChainSwapRequest): Promise<CrossChainSwapStatus> {
    try {
      const swapId = this.generateSwapId();
      const { secret, hashlock } = this.generateSecretAndHashlock();
      const timelock = request.timelock || 3600; // Default 1 hour
      const recipientAddress = request.recipientAddress || request.userAddress;

      const swapStatus: CrossChainSwapStatus = {
        swapId,
        status: 'initiated',
        fromChain: request.fromChain,
        toChain: request.toChain,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: request.fromAmount,
        toAmount: '0', // Will be calculated
        userAddress: request.userAddress,
        recipientAddress,
        hashlock,
        secret,
        timelock,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (timelock * 1000),
        transactions: {}
      };

      // Store swap status
      this.swaps.set(swapId, swapStatus);

      // Get quote for the swap
      const quote = await this.getCrossChainQuote(request);
      swapStatus.toAmount = quote.toAmount;
      swapStatus.updatedAt = Date.now();

      return swapStatus;
    } catch (error) {
      console.error('Error initiating cross-chain swap:', error);
      throw error;
    }
  }

  /**
   * Execute cross-chain swap
   */
  async executeCrossChainSwap(swapId: string): Promise<CrossChainSwapStatus> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    try {
      // Step 1: Lock funds on source chain
      const lockTx = await this.lockFundsOnSourceChain(swap);
      swap.transactions.fromChainTx = lockTx;
      swap.status = 'locked';
      swap.updatedAt = Date.now();

      // Step 2: Lock funds on destination chain
      const destLockTx = await this.lockFundsOnDestinationChain(swap);
      swap.transactions.toChainTx = destLockTx;
      swap.updatedAt = Date.now();

      // Step 3: Redeem on destination chain
      const redeemTx = await this.redeemOnDestinationChain(swap);
      swap.transactions.redeemTx = redeemTx;
      swap.status = 'redeemed';
      swap.updatedAt = Date.now();

      // Step 4: Redeem on source chain
      const sourceRedeemTx = await this.redeemOnSourceChain(swap);
      swap.transactions.redeemTx = sourceRedeemTx;
      swap.status = 'completed';
      swap.updatedAt = Date.now();

      return swap;
    } catch (error) {
      console.error('Error executing cross-chain swap:', error);
      swap.status = 'failed';
      swap.error = error instanceof Error ? error.message : 'Unknown error';
      swap.updatedAt = Date.now();
      throw error;
    }
  }

  /**
   * Get cross-chain quote
   */
  async getCrossChainQuote(request: CrossChainSwapRequest): Promise<{
    toAmount: string;
    price: string;
    gasEstimate: string;
  }> {
    try {
      if (request.toChain === 'near') {
        const quote = await this.fusionService.getNEARCrossChainQuote({
          fromChain: request.fromChain as any,
          toChain: 'near',
          fromToken: request.fromToken,
          toToken: request.toToken,
          fromAmount: request.fromAmount,
          toAmount: '0',
          userAddress: request.userAddress,
          nearAccountId: request.recipientAddress || request.userAddress
        });
        return {
          toAmount: quote.toAmount,
          price: quote.price,
          gasEstimate: quote.gasEstimate
        };
      } else if (request.toChain === 'aptos') {
        const quote = await this.aptosService.getSwapQuote({
          fromToken: request.fromToken,
          toToken: request.toToken,
          fromAmount: request.fromAmount
        });
        return {
          toAmount: quote.toAmount,
          price: quote.price,
          gasEstimate: quote.gasEstimate
        };
      } else if (request.toChain === 'sui') {
        const quote = await this.suiService.getSwapQuote({
          fromToken: request.fromToken,
          toToken: request.toToken,
          fromAmount: request.fromAmount
        });
        return {
          toAmount: quote.toAmount,
          price: quote.price,
          gasEstimate: quote.gasEstimate
        };
      } else {
        // EVM to EVM cross-chain
        const quote = await this.fusionService.getCrossChainQuote({
          fromChainId: this.getChainId(request.fromChain),
          toChainId: this.getChainId(request.toChain),
          fromToken: request.fromToken,
          toToken: request.toToken,
          fromAmount: request.fromAmount,
          toAmount: '0',
          userAddress: request.userAddress
        });
        return {
          toAmount: quote.toAmount,
          price: quote.price,
          gasEstimate: quote.gasEstimate
        };
      }
    } catch (error) {
      console.error('Error getting cross-chain quote:', error);
      throw error;
    }
  }

  /**
   * Lock funds on source chain
   */
  private async lockFundsOnSourceChain(swap: CrossChainSwapStatus): Promise<string> {
    try {
      if (this.isEVMChain(swap.fromChain)) {
        // Use Fusion+ for EVM chains
        const result = await this.fusionService.executeCrossChainSwap({
          fromChainId: this.getChainId(swap.fromChain),
          toChainId: this.getChainId(swap.toChain),
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          fromAmount: swap.fromAmount,
          toAmount: swap.toAmount,
          userAddress: swap.userAddress
        });
        return result.orderHash;
      } else if (swap.fromChain === 'near') {
        // Use NEAR service
        const result = await this.nearService.createFusionOrder({
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          fromAmount: swap.fromAmount,
          toAmount: swap.toAmount,
          userAddress: swap.userAddress,
          timelock: swap.timelock
        });
        return result.orderId;
      } else if (swap.fromChain === 'aptos') {
        // Use Aptos service
        const htlcParams = {
          hashlock: swap.hashlock,
          timelock: swap.timelock,
          recipient: swap.recipientAddress,
          sender: swap.userAddress,
          amount: swap.fromAmount,
          tokenAddress: swap.fromToken
        };
        return await this.aptosService.createHTLCLock(htlcParams);
      } else if (swap.fromChain === 'sui') {
        // Use Sui service
        const htlcParams = {
          hashlock: swap.hashlock,
          timelock: swap.timelock,
          recipient: swap.recipientAddress,
          sender: swap.userAddress,
          amount: swap.fromAmount,
          coinType: swap.fromToken
        };
        return await this.suiService.createHTLCLock(htlcParams);
      }
      throw new Error(`Unsupported source chain: ${swap.fromChain}`);
    } catch (error) {
      console.error('Error locking funds on source chain:', error);
      throw error;
    }
  }

  /**
   * Lock funds on destination chain
   */
  private async lockFundsOnDestinationChain(swap: CrossChainSwapStatus): Promise<string> {
    try {
      if (swap.toChain === 'near') {
        // Use NEAR service
        const result = await this.nearService.createFusionOrder({
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          fromAmount: swap.fromAmount,
          toAmount: swap.toAmount,
          userAddress: swap.recipientAddress,
          timelock: swap.timelock
        });
        return result.orderId;
      } else if (swap.toChain === 'aptos') {
        // Use Aptos service
        const htlcParams = {
          hashlock: swap.hashlock,
          timelock: swap.timelock,
          recipient: swap.recipientAddress,
          sender: swap.userAddress,
          amount: swap.toAmount,
          tokenAddress: swap.toToken
        };
        return await this.aptosService.createHTLCLock(htlcParams);
      } else if (swap.toChain === 'sui') {
        // Use Sui service
        const htlcParams = {
          hashlock: swap.hashlock,
          timelock: swap.timelock,
          recipient: swap.recipientAddress,
          sender: swap.userAddress,
          amount: swap.toAmount,
          coinType: swap.toToken
        };
        return await this.suiService.createHTLCLock(htlcParams);
      }
      throw new Error(`Unsupported destination chain: ${swap.toChain}`);
    } catch (error) {
      console.error('Error locking funds on destination chain:', error);
      throw error;
    }
  }

  /**
   * Redeem on destination chain
   */
  private async redeemOnDestinationChain(swap: CrossChainSwapStatus): Promise<string> {
    if (!swap.secret) {
      throw new Error('Secret not available for redemption');
    }

    try {
      if (swap.toChain === 'near') {
        // Use NEAR service
        return await this.nearService.claimEscrowOrder(swap.transactions.toChainTx!, swap.secret);
      } else if (swap.toChain === 'aptos') {
        // Use Aptos service
        return await this.aptosService.redeemHTLC(swap.transactions.toChainTx!, swap.secret, swap.toToken);
      } else if (swap.toChain === 'sui') {
        // Use Sui service
        return await this.suiService.redeemHTLC(swap.transactions.toChainTx!, swap.secret, swap.toToken);
      }
      throw new Error(`Unsupported destination chain: ${swap.toChain}`);
    } catch (error) {
      console.error('Error redeeming on destination chain:', error);
      throw error;
    }
  }

  /**
   * Redeem on source chain
   */
  private async redeemOnSourceChain(swap: CrossChainSwapStatus): Promise<string> {
    if (!swap.secret) {
      throw new Error('Secret not available for redemption');
    }

    try {
      if (this.isEVMChain(swap.fromChain)) {
        // Use Fusion+ for EVM chains
        const result = await this.fusionService.executeCrossChainSwap({
          fromChainId: this.getChainId(swap.fromChain),
          toChainId: this.getChainId(swap.toChain),
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          fromAmount: swap.fromAmount,
          toAmount: swap.toAmount,
          userAddress: swap.userAddress
        });
        return result.orderHash;
      } else if (swap.fromChain === 'near') {
        // Use NEAR service
        return await this.nearService.claimEscrowOrder(swap.transactions.fromChainTx!, swap.secret);
      } else if (swap.fromChain === 'aptos') {
        // Use Aptos service
        return await this.aptosService.redeemHTLC(swap.transactions.fromChainTx!, swap.secret, swap.fromToken);
      } else if (swap.fromChain === 'sui') {
        // Use Sui service
        return await this.suiService.redeemHTLC(swap.transactions.fromChainTx!, swap.secret, swap.fromToken);
      }
      throw new Error(`Unsupported source chain: ${swap.fromChain}`);
    } catch (error) {
      console.error('Error redeeming on source chain:', error);
      throw error;
    }
  }

  /**
   * Get swap status
   */
  getSwapStatus(swapId: string): CrossChainSwapStatus | null {
    return this.swaps.get(swapId) || null;
  }

  /**
   * Get all swaps for a user
   */
  getUserSwaps(userAddress: string): CrossChainSwapStatus[] {
    return Array.from(this.swaps.values()).filter(swap => 
      swap.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }

  /**
   * Refund expired swap
   */
  async refundSwap(swapId: string): Promise<string> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    if (swap.status !== 'locked' && swap.status !== 'redeemed') {
      throw new Error('Swap cannot be refunded');
    }

    if (Date.now() < swap.expiresAt) {
      throw new Error('Swap has not expired yet');
    }

    try {
      let refundTx: string;

      if (this.isEVMChain(swap.fromChain)) {
        // Use Fusion+ for EVM chains
        const result = await this.fusionService.cancelOrder(swap.transactions.fromChainTx!);
        refundTx = result.txHash;
      } else if (swap.fromChain === 'near') {
        // Use NEAR service
        refundTx = await this.nearService.refundEscrowOrder(swap.transactions.fromChainTx!);
      } else if (swap.fromChain === 'aptos') {
        // Use Aptos service
        refundTx = await this.aptosService.refundHTLC(swap.transactions.fromChainTx!, swap.fromToken);
      } else if (swap.fromChain === 'sui') {
        // Use Sui service
        refundTx = await this.suiService.refundHTLC(swap.transactions.fromChainTx!, swap.fromToken);
      } else {
        throw new Error(`Unsupported source chain: ${swap.fromChain}`);
      }

      swap.status = 'refunded';
      swap.transactions.refundTx = refundTx;
      swap.updatedAt = Date.now();

      return refundTx;
    } catch (error) {
      console.error('Error refunding swap:', error);
      throw error;
    }
  }

  /**
   * Clean up expired swaps
   */
  cleanupExpiredSwaps(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [swapId, swap] of this.swaps.entries()) {
      if (now > swap.expiresAt && swap.status === 'locked') {
        swap.status = 'expired';
        swap.updatedAt = now;
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Generate unique swap ID
   */
  private generateSwapId(): string {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate secret and hashlock
   */
  private generateSecretAndHashlock(): { secret: string; hashlock: string } {
    const secret = crypto.randomUUID();
    const hashlock = this.sha256(secret);
    return { secret, hashlock };
  }

  /**
   * Check if chain is EVM-compatible
   */
  private isEVMChain(chain: string): boolean {
    const evmChains = ['ethereum', 'sepolia', 'polygon', 'arbitrum', 'base', 'optimism', 'bsc', 'avalanche', 'fantom', 'etherlink'];
    return evmChains.includes(chain.toLowerCase());
  }

  /**
   * Get chain ID for EVM chains
   */
  private getChainId(chain: string): number {
    const chainMap: { [key: string]: number } = {
      'ethereum': 1,
      'sepolia': 11155111,
      'polygon': 137,
      'arbitrum': 42161,
      'base': 8453,
      'optimism': 10,
      'bsc': 56,
      'avalanche': 43114,
      'fantom': 250,
      'etherlink': 128123
    };
    return chainMap[chain.toLowerCase()] || 1;
  }

  /**
   * Simple SHA256 implementation
   */
  private sha256(str: string): string {
    // This is a simplified implementation - use a proper crypto library in production
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
  }
}

/**
 * Create cross-chain coordinator instance
 */
export function createCrossChainCoordinator(): CrossChainCoordinator {
  return new CrossChainCoordinator();
} 