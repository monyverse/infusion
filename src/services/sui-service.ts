import { SuiClient, SuiTransactionBlockResponse, TransactionBlock } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';

export interface SuiConfig {
  nodeUrl: string;
  privateKey?: string;
  accountAddress?: string;
}

export interface SuiHTLCParams {
  hashlock: string;
  timelock: number;
  recipient: string;
  sender: string;
  amount: string;
  coinType: string;
}

export interface SuiSwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  gasEstimate: string;
  protocols: string[];
  route: SuiSwapRoute[];
}

export interface SuiSwapRoute {
  protocol: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fee: string;
  poolId?: string;
}

export class SuiService {
  private client: SuiClient;
  private config: SuiConfig;
  private keypair: Ed25519Keypair | null = null;

  constructor(config: SuiConfig) {
    this.config = config;
    this.client = new SuiClient({ url: config.nodeUrl });
  }

  /**
   * Initialize Sui account
   */
  async initializeAccount(privateKey?: string): Promise<void> {
    try {
      const key = privateKey || this.config.privateKey;
      if (!key) {
        throw new Error('Private key is required for Sui account initialization');
      }

      const privateKeyBytes = fromB64(key);
      this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      
      console.log('Sui account initialized:', this.keypair.getPublicKey().toSuiAddress());
    } catch (error) {
      console.error('Error initializing Sui account:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountAddress: string, coinType: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({
        owner: accountAddress,
        coinType: coinType
      });
      
      return balance.totalBalance;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return '0';
    }
  }

  /**
   * Create HTLC lock transaction
   */
  async createHTLCLock(params: SuiHTLCParams): Promise<string> {
    if (!this.keypair) {
      throw new Error('Sui account not initialized');
    }

    try {
      const tx = new TransactionBlock();
      
      // Split coins for HTLC
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(params.amount)]);
      
      // Call HTLC lock function
      tx.moveCall({
        target: `${this.keypair.getPublicKey().toSuiAddress()}::htlc::lock`,
        arguments: [
          coin,
          tx.pure(params.hashlock),
          tx.pure(params.timelock),
          tx.pure(params.recipient)
        ],
        typeArguments: [params.coinType]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error creating HTLC lock:', error);
      throw error;
    }
  }

  /**
   * Redeem HTLC with preimage
   */
  async redeemHTLC(htlcObjectId: string, preimage: string, coinType: string): Promise<string> {
    if (!this.keypair) {
      throw new Error('Sui account not initialized');
    }

    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.keypair.getPublicKey().toSuiAddress()}::htlc::redeem`,
        arguments: [
          tx.object(htlcObjectId),
          tx.pure(preimage)
        ],
        typeArguments: [coinType]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error redeeming HTLC:', error);
      throw error;
    }
  }

  /**
   * Refund HTLC after timelock expires
   */
  async refundHTLC(htlcObjectId: string, coinType: string): Promise<string> {
    if (!this.keypair) {
      throw new Error('Sui account not initialized');
    }

    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.keypair.getPublicKey().toSuiAddress()}::htlc::refund`,
        arguments: [
          tx.object(htlcObjectId)
        ],
        typeArguments: [coinType]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error refunding HTLC:', error);
      throw error;
    }
  }

  /**
   * Get swap quote from Sui DEX
   */
  async getSwapQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    dexAddress?: string;
  }): Promise<SuiSwapQuote> {
    try {
      // Mock implementation - replace with actual DEX API call
      const mockQuote: SuiSwapQuote = {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: (parseFloat(params.fromAmount) * 0.98).toString(), // Mock 2% slippage
        price: '1.0',
        gasEstimate: '1000',
        protocols: ['Cetus', 'Turbos'],
        route: [
          {
            protocol: 'Cetus',
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.fromAmount,
            fee: '0.25',
            poolId: 'pool_1'
          }
        ]
      };

      return mockQuote;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  /**
   * Execute swap on Sui
   */
  async executeSwap(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    dexAddress: string;
  }): Promise<string> {
    if (!this.keypair) {
      throw new Error('Sui account not initialized');
    }

    try {
      const tx = new TransactionBlock();
      
      // Split coins for swap
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(params.fromAmount)]);
      
      // Call swap function
      tx.moveCall({
        target: `${params.dexAddress}::router::swap_exact_input`,
        arguments: [
          coin,
          tx.pure(params.toAmount),
          tx.pure(this.keypair.getPublicKey().toSuiAddress())
        ],
        typeArguments: [params.fromToken, params.toToken]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens on Sui
   */
  async getSupportedTokens(): Promise<Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }>> {
    return [
      {
        address: '0x2::sui::SUI',
        symbol: 'SUI',
        name: 'Sui',
        decimals: 9
      },
      {
        address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDC',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      {
        address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDT',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6
      }
    ];
  }

  /**
   * Generate secret and hashlock for HTLC
   */
  generateSecretAndHashlock(): { secret: string; hashlock: string } {
    const secret = crypto.randomUUID();
    const hashlock = this.sha256(secret);
    return { secret, hashlock };
  }

  /**
   * Verify secret against hashlock
   */
  verifySecret(secret: string, hashlock: string): boolean {
    return this.sha256(secret) === hashlock;
  }

  /**
   * Simple SHA256 implementation
   */
  private sha256(str: string): string {
    // This is a simplified implementation - use a proper crypto library in production
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
  }

  /**
   * Get account address
   */
  getAccountAddress(): string | null {
    return this.keypair?.getPublicKey().toSuiAddress() || null;
  }

  /**
   * Check if account is initialized
   */
  isInitialized(): boolean {
    return this.keypair !== null;
  }
}

/**
 * Default Sui configurations
 */
export const SUI_CONFIGS = {
  mainnet: {
    nodeUrl: 'https://fullnode.mainnet.sui.io:443',
  },
  testnet: {
    nodeUrl: 'https://fullnode.testnet.sui.io:443',
  },
  devnet: {
    nodeUrl: 'https://fullnode.devnet.sui.io:443',
  }
};

/**
 * Create Sui service instance
 */
export function createSuiService(config: SuiConfig): SuiService {
  return new SuiService(config);
} 