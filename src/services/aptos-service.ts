import { AptosClient, AptosAccount, TxnBuilderTypes, BCS, MaybeHexString } from 'aptos';

export interface AptosConfig {
  nodeUrl: string;
  faucetUrl?: string;
  privateKey?: string;
  accountAddress?: string;
}

export interface AptosHTLCParams {
  hashlock: string;
  timelock: number;
  recipient: string;
  sender: string;
  amount: string;
  tokenAddress: string;
}

export interface AptosSwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  gasEstimate: string;
  protocols: string[];
  route: AptosSwapRoute[];
}

export interface AptosSwapRoute {
  protocol: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fee: string;
  poolId?: string;
}

export class AptosService {
  private client: AptosClient;
  private config: AptosConfig;
  private account: AptosAccount | null = null;

  constructor(config: AptosConfig) {
    this.config = config;
    this.client = new AptosClient(config.nodeUrl);
  }

  /**
   * Initialize Aptos account
   */
  async initializeAccount(privateKey?: string): Promise<void> {
    try {
      const key = privateKey || this.config.privateKey;
      if (!key) {
        throw new Error('Private key is required for Aptos account initialization');
      }

      const privateKeyBytes = new Uint8Array(Buffer.from(key, 'hex'));
      this.account = new AptosAccount(privateKeyBytes);
      
      console.log('Aptos account initialized:', this.account.address().toString());
    } catch (error) {
      console.error('Error initializing Aptos account:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountAddress: string, tokenAddress: string): Promise<string> {
    try {
      const resource = await this.client.getAccountResource(
        accountAddress,
        `0x1::coin::CoinStore<${tokenAddress}>`
      );
      
      return (resource.data as any).coin.value;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return '0';
    }
  }

  /**
   * Create HTLC lock transaction
   */
  async createHTLCLock(params: AptosHTLCParams): Promise<string> {
    if (!this.account) {
      throw new Error('Aptos account not initialized');
    }

    try {
      const payload = {
        function: `${this.account.address()}::htlc::lock`,
        type_arguments: [params.tokenAddress],
        arguments: [
          params.hashlock,
          params.timelock.toString(),
          params.recipient,
          params.amount
        ]
      };

      const transaction = await this.client.generateTransaction(
        this.account.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(this.account, transaction);
      const result = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error) {
      console.error('Error creating HTLC lock:', error);
      throw error;
    }
  }

  /**
   * Redeem HTLC with preimage
   */
  async redeemHTLC(htlcAddress: string, preimage: string, tokenAddress: string): Promise<string> {
    if (!this.account) {
      throw new Error('Aptos account not initialized');
    }

    try {
      const payload = {
        function: `${htlcAddress}::htlc::redeem`,
        type_arguments: [tokenAddress],
        arguments: [preimage]
      };

      const transaction = await this.client.generateTransaction(
        this.account.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(this.account, transaction);
      const result = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error) {
      console.error('Error redeeming HTLC:', error);
      throw error;
    }
  }

  /**
   * Refund HTLC after timelock expires
   */
  async refundHTLC(htlcAddress: string, tokenAddress: string): Promise<string> {
    if (!this.account) {
      throw new Error('Aptos account not initialized');
    }

    try {
      const payload = {
        function: `${htlcAddress}::htlc::refund`,
        type_arguments: [tokenAddress],
        arguments: []
      };

      const transaction = await this.client.generateTransaction(
        this.account.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(this.account, transaction);
      const result = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error) {
      console.error('Error refunding HTLC:', error);
      throw error;
    }
  }

  /**
   * Get swap quote from Aptos DEX
   */
  async getSwapQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    dexAddress?: string;
  }): Promise<AptosSwapQuote> {
    try {
      // Mock implementation - replace with actual DEX API call
      const mockQuote: AptosSwapQuote = {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: (parseFloat(params.fromAmount) * 0.98).toString(), // Mock 2% slippage
        price: '1.0',
        gasEstimate: '1000',
        protocols: ['PancakeSwap', 'LiquidSwap'],
        route: [
          {
            protocol: 'PancakeSwap',
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
   * Execute swap on Aptos
   */
  async executeSwap(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    dexAddress: string;
  }): Promise<string> {
    if (!this.account) {
      throw new Error('Aptos account not initialized');
    }

    try {
      const payload = {
        function: `${params.dexAddress}::router::swap_exact_input`,
        type_arguments: [params.fromToken, params.toToken],
        arguments: [
          params.fromAmount,
          params.toAmount,
          this.account.address().toString()
        ]
      };

      const transaction = await this.client.generateTransaction(
        this.account.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(this.account, transaction);
      const result = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens on Aptos
   */
  async getSupportedTokens(): Promise<Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }>> {
    return [
      {
        address: '0x1::aptos_coin::AptosCoin',
        symbol: 'APT',
        name: 'Aptos Coin',
        decimals: 8
      },
      {
        address: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      {
        address: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
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
    return this.account?.address().toString() || null;
  }

  /**
   * Check if account is initialized
   */
  isInitialized(): boolean {
    return this.account !== null;
  }
}

/**
 * Default Aptos configurations
 */
export const APTOS_CONFIGS = {
  mainnet: {
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    faucetUrl: undefined,
  },
  testnet: {
    nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
  },
  devnet: {
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
  }
};

/**
 * Create Aptos service instance
 */
export function createAptosService(config: AptosConfig): AptosService {
  return new AptosService(config);
} 