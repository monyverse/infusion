import { connect, keyStores, KeyPair, Contract, utils } from 'near-api-js';
import * as crypto from 'crypto';

export interface NEARConfig {
  networkId: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  accountId?: string;
  privateKey?: string;
  contracts?: {
    escrow: string;
    solver: string;
    pool: string;
  };
}

export interface NEARToken {
  contractId: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  icon?: string;
}

export interface NEARSwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  gasEstimate: string;
  protocols: string[];
  route: NEARSwapRoute[];
}

export interface NEARSwapRoute {
  protocol: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fee: string;
  poolId?: string;
}

export interface NEARFusionOrder {
  orderId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  secret?: string;
  createdAt: number;
  expiresAt: number;
}

export class NEARService {
  private config: NEARConfig;
  private near: any;
  private wallet: any = null;
  private account: any = null;
  private keyStore: any;
  private contracts: {
    escrow?: any;
    solver?: any;
    pool?: any;
  } = {};

  constructor(config: NEARConfig) {
    this.config = config;
    this.keyStore = new keyStores.InMemoryKeyStore();
    this.initializeNEAR();
  }

  private async initializeNEAR() {
    try {
      const nearConfig = {
        networkId: this.config.networkId,
        nodeUrl: this.config.nodeUrl,
        keyStore: this.keyStore,
        headers: {},
        walletUrl: this.config.walletUrl,
        helperUrl: this.config.helperUrl,
        explorerUrl: this.config.explorerUrl,
      };

      this.near = await connect(nearConfig);
      console.log('✅ NEAR connection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NEAR:', error);
    }
  }

  async initializeWallet(): Promise<void> {
    try {
      // For frontend usage, this would connect to NEAR Wallet
      // For now, we'll use the account if provided
      if (this.config.accountId) {
        this.account = await this.near.account(this.config.accountId);
        console.log(`✅ Connected to account: ${this.config.accountId}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize wallet:', error);
    }
  }

  async initializeWithPrivateKey(accountId: string, privateKey: string): Promise<void> {
    try {
      const keyPair = KeyPair.fromString(privateKey as any);
      await this.keyStore.setKey(this.config.networkId, accountId, keyPair);
      
      this.account = await this.near.account(accountId);
      this.config.accountId = accountId;
      
      // Initialize contract instances if contracts are configured
      if (this.config.contracts) {
        await this.initializeContracts();
      }
      
      console.log(`✅ Initialized with private key for account: ${accountId}`);
    } catch (error) {
      console.error('❌ Failed to initialize with private key:', error);
      throw error;
    }
  }

  private async initializeContracts() {
    if (!this.config.contracts || !this.account) return;

    try {
      // Initialize escrow contract
      if (this.config.contracts.escrow) {
        this.contracts.escrow = new Contract(
          this.account,
          this.config.contracts.escrow,
          {
            viewMethods: ['get_order', 'get_swap', 'get_user_orders', 'get_statistics', 'get_quote'],
            changeMethods: ['create_order', 'fund_order', 'claim_order', 'refund_order', 'create_cross_chain_swap', 'update_swap_status'],
            useLocalViewExecution: false
          }
        );
      }

      // Initialize solver contract
      if (this.config.contracts.solver) {
        this.contracts.solver = new Contract(
          this.account,
          this.config.contracts.solver,
          {
            viewMethods: ['get_solver', 'get_pool', 'get_order', 'get_user_orders', 'get_statistics', 'get_active_solvers'],
            changeMethods: ['register_solver', 'create_pool', 'add_liquidity', 'request_quote', 'provide_quote', 'create_order', 'execute_order', 'verify_signature'],
            useLocalViewExecution: false
          }
        );
      }

      // Initialize pool contract
      if (this.config.contracts.pool) {
        this.contracts.pool = new Contract(
          this.account,
          this.config.contracts.pool,
          {
            viewMethods: ['get_pool', 'get_provider', 'get_reward', 'get_user_pools', 'get_statistics'],
            changeMethods: ['create_pool', 'deposit_liquidity', 'withdraw_liquidity', 'claim_rewards', 'add_rewards'],
            useLocalViewExecution: false
          }
        );
      }

      console.log('✅ Contract instances initialized');
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error);
    }
  }

  async getAccountBalance(accountId: string): Promise<string> {
    try {
      const account = await this.near.account(accountId);
      const balance = await account.getAccountBalance();
      return balance.total;
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      throw error;
    }
  }

  async getTokenBalance(accountId: string, tokenContractId: string): Promise<string> {
    try {
      const account = await this.near.account(accountId);
      const contract = new Contract(
        account,
        tokenContractId,
        {
          viewMethods: ['ft_balance_of'],
          changeMethods: [],
          useLocalViewExecution: false
        }
      );

      const balance = await (contract as any).ft_balance_of({ account_id: accountId });
      return balance;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      return '0';
    }
  }

  async transferNEAR(toAccountId: string, amount: string): Promise<string> {
    if (!this.account) {
      throw new Error('Account not initialized');
    }

    try {
      const result = await this.account.sendMoney(toAccountId, utils.format.parseNearAmount(amount));
      return result.transaction.hash;
    } catch (error) {
      console.error('❌ Failed to transfer NEAR:', error);
      throw error;
    }
  }

  async transferFT(
    tokenContractId: string,
    receiverId: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    if (!this.account) {
      throw new Error('Account not initialized');
    }

    try {
      const contract = new Contract(
        this.account,
        tokenContractId,
        {
          viewMethods: [],
          changeMethods: ['ft_transfer'],
          useLocalViewExecution: false
        }
      );

      const result = await (contract as any).ft_transfer({
        receiver_id: receiverId,
        amount: amount,
        memo: memo || ''
      });

      return result.transaction.hash;
    } catch (error) {
      console.error('❌ Failed to transfer FT:', error);
      throw error;
    }
  }

  async createFusionOrder(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    userAddress: string;
    timelock: number;
  }): Promise<NEARFusionOrder> {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      const { secret, hashlock } = this.generateSecretAndHashlock();
      const now = Date.now();
      
      // Create order using the smart contract
      const result = await (this.contracts.escrow as any).create_order({
        taker: params.userAddress,
        from_token: params.fromToken,
        to_token: params.toToken,
        from_amount: params.fromAmount,
        to_amount: params.toAmount,
        hashlock: hashlock,
        timelock: params.timelock
      });

      const order: NEARFusionOrder = {
        orderId: result.transaction.hash,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        userAddress: params.userAddress,
        hashlock: hashlock,
        timelock: params.timelock,
        status: 'pending',
        secret: secret,
        createdAt: now,
        expiresAt: now + (params.timelock * 1000)
      };

      return order;
    } catch (error) {
      console.error('❌ Failed to create Fusion order:', error);
      throw error;
    }
  }

  async getSwapQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    dexContractId?: string;
  }): Promise<NEARSwapQuote> {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      // Get quote from the smart contract
      const quote = await (this.contracts.escrow as any).get_quote({
        from_token: params.fromToken,
        to_token: params.toToken,
        from_amount: params.fromAmount
      });

      return {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: quote.to_amount,
        price: quote.price,
        gasEstimate: quote.gas_estimate,
        protocols: quote.protocols,
        route: quote.route
      };
    } catch (error) {
      console.error('❌ Failed to get swap quote:', error);
      // Fallback to mock quote
      return this.getMockSwapQuote(params);
    }
  }

  private getMockSwapQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
  }): NEARSwapQuote {
    const toAmount = (parseFloat(params.fromAmount) * 0.98).toString();
    
    return {
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount,
      price: '1.0',
      gasEstimate: '30000000000000',
      protocols: ['ref-finance'],
      route: [{
        protocol: 'ref-finance',
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.fromAmount,
        fee: '0.003',
        poolId: '1'
      }]
    };
  }

  async executeSwap(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    userAddress: string;
    dexContractId?: string;
  }): Promise<string> {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      // Create and fund an escrow order
      const order = await this.createFusionOrder({
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        userAddress: params.userAddress,
        timelock: 3600 // 1 hour
      });

      // Fund the order
      await (this.contracts.escrow as any).fund_order({
        order_id: order.orderId
      });

      return order.orderId;
    } catch (error) {
      console.error('❌ Failed to execute swap:', error);
      throw error;
    }
  }

  private generateSecretAndHashlock(): { secret: string; hashlock: string } {
    const secret = crypto.randomBytes(32).toString('hex');
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
    return { secret, hashlock };
  }

  verifySecret(secret: string, hashlock: string): boolean {
    const computedHashlock = crypto.createHash('sha256').update(secret).digest('hex');
    return computedHashlock === hashlock;
  }

  async getSupportedTokens(): Promise<NEARToken[]> {
    // Mock supported tokens for now
    return [
      {
        contractId: 'testnet',
        symbol: 'NEAR',
        name: 'NEAR Protocol',
        decimals: 24,
        totalSupply: '1000000000000000000000000000',
        icon: '🌐'
      },
      {
        contractId: 'usdc.fakes.testnet',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        totalSupply: '1000000000000',
        icon: '💵'
      },
      {
        contractId: 'usdt.fakes.testnet',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        totalSupply: '1000000000000',
        icon: '💵'
      }
    ];
  }

  async getAccountInfo(accountId: string) {
    try {
      const account = await this.near.account(accountId);
      const balance = await account.getAccountBalance();
      
      return {
        accountId,
        balance: balance.total,
        codeHash: account.connection.provider.query(`account/${accountId}`, '').then((r: any) => r.code_hash),
        storageUsage: account.connection.provider.query(`account/${accountId}`, '').then((r: any) => r.storage_usage)
      };
    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      throw error;
    }
  }

  async accountExists(accountId: string): Promise<boolean> {
    try {
      await this.near.account(accountId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Contract-specific methods
  async getEscrowOrder(orderId: string) {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      return await (this.contracts.escrow as any).get_order({ order_id: orderId });
    } catch (error) {
      console.error('❌ Failed to get escrow order:', error);
      throw error;
    }
  }

  async fundEscrowOrder(orderId: string) {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      return await (this.contracts.escrow as any).fund_order({ order_id: orderId });
    } catch (error) {
      console.error('❌ Failed to fund escrow order:', error);
      throw error;
    }
  }

  async claimEscrowOrder(orderId: string, secret: string) {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      return await (this.contracts.escrow as any).claim_order({
        order_id: orderId,
        secret: secret
      });
    } catch (error) {
      console.error('❌ Failed to claim escrow order:', error);
      throw error;
    }
  }

  async createCrossChainSwap(params: {
    evmOrderHash: string;
    evmAddress: string;
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    hashlock: string;
    timelock: number;
  }) {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      return await (this.contracts.escrow as any).create_cross_chain_swap({
        evm_order_hash: params.evmOrderHash,
        evm_address: params.evmAddress,
        from_chain: params.fromChain,
        to_chain: params.toChain,
        from_token: params.fromToken,
        to_token: params.toToken,
        from_amount: params.fromAmount,
        to_amount: params.toAmount,
        hashlock: params.hashlock,
        timelock: params.timelock
      });
    } catch (error) {
      console.error('❌ Failed to create cross-chain swap:', error);
      throw error;
    }
  }

  async getCrossChainSwap(swapId: string) {
    if (!this.contracts.escrow) {
      throw new Error('Escrow contract not initialized');
    }

    try {
      return await (this.contracts.escrow as any).get_swap({ swap_id: swapId });
    } catch (error) {
      console.error('❌ Failed to get cross-chain swap:', error);
      throw error;
    }
  }
}

/**
 * Default NEAR configurations for different networks
 */
export const NEAR_CONFIGS = {
  mainnet: {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org',
    contracts: {
      escrow: 'escrow.near',
      solver: 'solver.near',
      pool: 'pool.near',
    },
  },
  testnet: {
    networkId: 'testnet',
    nodeUrl: 'https://testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    contracts: {
      escrow: 'defiunite.testnet', // Using main account for now
      solver: 'defiunite.testnet', // Using main account for now
      pool: 'defiunite.testnet',   // Using main account for now
    },
  },
};

export function createNEARService(config: NEARConfig): NEARService {
  return new NEARService(config);
} 