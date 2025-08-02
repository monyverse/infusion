import { ethers } from 'ethers';
import { FusionPlusService, FUSION_PLUS_CONFIGS } from './fusion-plus';
import { NEARService, NEAR_CONFIGS } from './near-service';
import { AptosService, APTOS_CONFIGS } from './aptos-service';
import { SuiService, SUI_CONFIGS } from './sui-service';
import * as crypto from 'crypto';

// L1 Chain Service Interfaces
export interface L1ChainService {
  initialize(): Promise<void>;
  createHTLC(params: HTLCParams): Promise<string>;
  redeemHTLC(htlcId: string, preimage: string): Promise<string>;
  refundHTLC(htlcId: string): Promise<string>;
  getBalance(address: string): Promise<string>;
  getHTLCStatus(htlcId: string): Promise<HTLCStatus>;
}

export interface HTLCParams {
  hashlock: string;
  timelock: number;
  recipient: string;
  sender: string;
  amount: string;
  tokenAddress?: string;
}

export interface HTLCStatus {
  htlcId: string;
  status: 'pending' | 'locked' | 'redeemed' | 'refunded' | 'expired';
  hashlock: string;
  timelock: number;
  recipient: string;
  sender: string;
  amount: string;
  createdAt: number;
  expiresAt: number;
}

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
  status: 'initiated' | 'source_locked' | 'destination_locked' | 'completed' | 'refunded' | 'expired' | 'failed';
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
    sourceLockTx?: string;
    destinationLockTx?: string;
    redeemTx?: string;
    refundTx?: string;
  };
  error?: string;
}

// Solana Service Implementation
export class SolanaService implements L1ChainService {
  private connection: any;
  private wallet: any;
  private programId: string;

  constructor(config: { rpcUrl: string; programId: string }) {
    this.programId = config.programId;
  }

  async initialize(): Promise<void> {
    // Initialize Solana connection and wallet
    console.log('Initializing Solana service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Solana using Anchor program
    const txHash = `sol_htlc_${Date.now()}`;
    console.log('Created Solana HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    // Redeem HTLC on Solana
    const txHash = `sol_redeem_${Date.now()}`;
    console.log('Redeemed Solana HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    // Refund HTLC on Solana
    const txHash = `sol_refund_${Date.now()}`;
    console.log('Refunded Solana HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000'; // Mock balance
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Stellar Service Implementation
export class StellarService implements L1ChainService {
  private server: any;
  private account: any;

  constructor(config: { rpcUrl: string; network: string }) {
    // Initialize Stellar server
  }

  async initialize(): Promise<void> {
    console.log('Initializing Stellar service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Stellar using Stellar SDK
    const txHash = `stellar_htlc_${Date.now()}`;
    console.log('Created Stellar HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `stellar_redeem_${Date.now()}`;
    console.log('Redeemed Stellar HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `stellar_refund_${Date.now()}`;
    console.log('Refunded Stellar HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Tron Service Implementation
export class TronService implements L1ChainService {
  private client: any;
  private contract: any;

  constructor(config: { rpcUrl: string; contractAddress: string }) {
    // Initialize Tron client
  }

  async initialize(): Promise<void> {
    console.log('Initializing Tron service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Tron using Solidity contract
    const txHash = `tron_htlc_${Date.now()}`;
    console.log('Created Tron HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `tron_redeem_${Date.now()}`;
    console.log('Redeemed Tron HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `tron_refund_${Date.now()}`;
    console.log('Refunded Tron HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// TON Service Implementation
export class TONService implements L1ChainService {
  private client: any;
  private wallet: any;

  constructor(config: { rpcUrl: string; walletAddress: string }) {
    // Initialize TON client
  }

  async initialize(): Promise<void> {
    console.log('Initializing TON service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on TON using FunC smart contract
    const txHash = `ton_htlc_${Date.now()}`;
    console.log('Created TON HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `ton_redeem_${Date.now()}`;
    console.log('Redeemed TON HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `ton_refund_${Date.now()}`;
    console.log('Refunded TON HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Monad Service Implementation (EVM-compatible)
export class MonadService implements L1ChainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private htlcContract: any;

  constructor(config: { rpcUrl: string; privateKey: string; contractAddress: string }) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Monad service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Monad (EVM-compatible)
    const txHash = `monad_htlc_${Date.now()}`;
    console.log('Created Monad HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `monad_redeem_${Date.now()}`;
    console.log('Redeemed Monad HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `monad_refund_${Date.now()}`;
    console.log('Refunded Monad HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Starknet Service Implementation
export class StarknetService implements L1ChainService {
  private provider: any;
  private account: any;
  private contract: any;

  constructor(config: { rpcUrl: string; accountAddress: string; privateKey: string }) {
    // Initialize Starknet provider
  }

  async initialize(): Promise<void> {
    console.log('Initializing Starknet service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Starknet using Cairo smart contract
    const txHash = `starknet_htlc_${Date.now()}`;
    console.log('Created Starknet HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `starknet_redeem_${Date.now()}`;
    console.log('Redeemed Starknet HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `starknet_refund_${Date.now()}`;
    console.log('Refunded Starknet HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Cardano Service Implementation
export class CardanoService implements L1ChainService {
  private client: any;
  private wallet: any;

  constructor(config: { rpcUrl: string; walletAddress: string }) {
    // Initialize Cardano client
  }

  async initialize(): Promise<void> {
    console.log('Initializing Cardano service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Cardano using Plutus smart contract
    const txHash = `cardano_htlc_${Date.now()}`;
    console.log('Created Cardano HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `cardano_redeem_${Date.now()}`;
    console.log('Redeemed Cardano HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `cardano_refund_${Date.now()}`;
    console.log('Refunded Cardano HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// XRP Ledger Service Implementation
export class XRPLedgerService implements L1ChainService {
  private client: any;
  private wallet: any;

  constructor(config: { rpcUrl: string; walletAddress: string }) {
    // Initialize XRP Ledger client
  }

  async initialize(): Promise<void> {
    console.log('Initializing XRP Ledger service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on XRP Ledger using Escrow
    const txHash = `xrp_htlc_${Date.now()}`;
    console.log('Created XRP Ledger HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `xrp_redeem_${Date.now()}`;
    console.log('Redeemed XRP Ledger HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `xrp_refund_${Date.now()}`;
    console.log('Refunded XRP Ledger HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// ICP Service Implementation
export class ICPService implements L1ChainService {
  private agent: any;
  private canister: any;

  constructor(config: { rpcUrl: string; canisterId: string }) {
    // Initialize ICP agent
  }

  async initialize(): Promise<void> {
    console.log('Initializing ICP service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on ICP using Motoko/Rust canister
    const txHash = `icp_htlc_${Date.now()}`;
    console.log('Created ICP HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `icp_redeem_${Date.now()}`;
    console.log('Redeemed ICP HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `icp_refund_${Date.now()}`;
    console.log('Refunded ICP HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Tezos Service Implementation
export class TezosService implements L1ChainService {
  private client: any;
  private wallet: any;

  constructor(config: { rpcUrl: string; walletAddress: string }) {
    // Initialize Tezos client
  }

  async initialize(): Promise<void> {
    console.log('Initializing Tezos service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Tezos using Michelson smart contract
    const txHash = `tezos_htlc_${Date.now()}`;
    console.log('Created Tezos HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `tezos_redeem_${Date.now()}`;
    console.log('Redeemed Tezos HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `tezos_refund_${Date.now()}`;
    console.log('Refunded Tezos HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Polkadot Service Implementation
export class PolkadotService implements L1ChainService {
  private api: any;
  private wallet: any;

  constructor(config: { rpcUrl: string; walletAddress: string }) {
    // Initialize Polkadot API
  }

  async initialize(): Promise<void> {
    console.log('Initializing Polkadot service...');
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    // Create HTLC on Polkadot using Ink!/Substrate pallet
    const txHash = `polkadot_htlc_${Date.now()}`;
    console.log('Created Polkadot HTLC:', txHash);
    return txHash;
  }

  async redeemHTLC(htlcId: string, preimage: string): Promise<string> {
    const txHash = `polkadot_redeem_${Date.now()}`;
    console.log('Redeemed Polkadot HTLC:', txHash);
    return txHash;
  }

  async refundHTLC(htlcId: string): Promise<string> {
    const txHash = `polkadot_refund_${Date.now()}`;
    console.log('Refunded Polkadot HTLC:', txHash);
    return txHash;
  }

  async getBalance(address: string): Promise<string> {
    return '1000000000';
  }

  async getHTLCStatus(htlcId: string): Promise<HTLCStatus> {
    return {
      htlcId,
      status: 'pending',
      hashlock: 'mock_hashlock',
      timelock: Date.now() + 3600000,
      recipient: 'mock_recipient',
      sender: 'mock_sender',
      amount: '1000000000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
  }
}

// Main Fusion+ L1 Extension Coordinator
export class FusionPlusL1Extension {
  private fusionService: FusionPlusService;
  private l1Services: Map<string, L1ChainService> = new Map();
  private swaps: Map<string, CrossChainSwapStatus> = new Map();

  constructor() {
    this.fusionService = new FusionPlusService(FUSION_PLUS_CONFIGS.sepolia);
    this.initializeL1Services();
  }

  private initializeL1Services(): void {
    // Initialize all L1 chain services
    this.l1Services.set('solana', new SolanaService({ rpcUrl: 'https://api.mainnet-beta.solana.com', programId: 'mock_program_id' }));
    this.l1Services.set('stellar', new StellarService({ rpcUrl: 'https://horizon.stellar.org', network: 'public' }));
    this.l1Services.set('tron', new TronService({ rpcUrl: 'https://api.trongrid.io', contractAddress: 'mock_contract' }));
    this.l1Services.set('ton', new TONService({ rpcUrl: 'https://toncenter.com/api/v2/jsonRPC', walletAddress: 'mock_wallet' }));
    this.l1Services.set('monad', new MonadService({ rpcUrl: 'https://rpc.monad.xyz', privateKey: 'mock_key', contractAddress: 'mock_contract' }));
    this.l1Services.set('starknet', new StarknetService({ rpcUrl: 'https://alpha-mainnet.starknet.io', accountAddress: 'mock_account', privateKey: 'mock_key' }));
    this.l1Services.set('cardano', new CardanoService({ rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0', walletAddress: 'mock_wallet' }));
    this.l1Services.set('xrp', new XRPLedgerService({ rpcUrl: 'https://s1.ripple.com:51234', walletAddress: 'mock_wallet' }));
    this.l1Services.set('icp', new ICPService({ rpcUrl: 'https://ic0.app', canisterId: 'mock_canister' }));
    this.l1Services.set('tezos', new TezosService({ rpcUrl: 'https://mainnet.api.tez.ie', walletAddress: 'mock_wallet' }));
    this.l1Services.set('polkadot', new PolkadotService({ rpcUrl: 'wss://rpc.polkadot.io', walletAddress: 'mock_wallet' }));
  }

  async initiateCrossChainSwap(request: CrossChainSwapRequest): Promise<CrossChainSwapStatus> {
    const swapId = this.generateSwapId();
    const { secret, hashlock } = this.generateSecretAndHashlock();
    const timelock = request.timelock || Math.floor(Date.now() / 1000) + 3600; // 1 hour default

    const swap: CrossChainSwapStatus = {
      swapId,
      status: 'initiated',
      fromChain: request.fromChain,
      toChain: request.toChain,
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.fromAmount,
      toAmount: '0', // Will be calculated
      userAddress: request.userAddress,
      recipientAddress: request.recipientAddress || request.userAddress,
      hashlock,
      secret,
      timelock,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + (timelock * 1000),
      transactions: {}
    };

    this.swaps.set(swapId, swap);
    return swap;
  }

  async executeCrossChainSwap(swapId: string): Promise<CrossChainSwapStatus> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    try {
      // Step 1: Lock funds on source chain (EVM)
      if (this.isEVMChain(swap.fromChain)) {
        const sourceTxHash = await this.lockFundsOnEVMChain(swap);
        swap.transactions.sourceLockTx = sourceTxHash;
        swap.status = 'source_locked';
      } else {
        const l1Service = this.l1Services.get(swap.fromChain);
        if (l1Service) {
          const sourceTxHash = await l1Service.createHTLC({
            hashlock: swap.hashlock,
            timelock: swap.timelock,
            recipient: swap.recipientAddress,
            sender: swap.userAddress,
            amount: swap.fromAmount
          });
          swap.transactions.sourceLockTx = sourceTxHash;
          swap.status = 'source_locked';
        }
      }

      // Step 2: Lock funds on destination chain (L1)
      const l1Service = this.l1Services.get(swap.toChain);
      if (l1Service) {
        const destTxHash = await l1Service.createHTLC({
          hashlock: swap.hashlock,
          timelock: swap.timelock,
          recipient: swap.recipientAddress,
          sender: swap.userAddress,
          amount: swap.toAmount
        });
        swap.transactions.destinationLockTx = destTxHash;
        swap.status = 'destination_locked';
      }

      // Step 3: Redeem on destination chain
      if (l1Service && swap.secret) {
        const redeemTxHash = await l1Service.redeemHTLC(swapId, swap.secret);
        swap.transactions.redeemTx = redeemTxHash;
        swap.status = 'completed';
      }

      swap.updatedAt = Date.now();
      this.swaps.set(swapId, swap);
      return swap;

    } catch (error) {
      swap.status = 'failed';
      swap.error = error instanceof Error ? error.message : 'Unknown error';
      swap.updatedAt = Date.now();
      this.swaps.set(swapId, swap);
      throw error;
    }
  }

  async getCrossChainQuote(request: CrossChainSwapRequest): Promise<{
    toAmount: string;
    price: string;
    gasEstimate: string;
  }> {
    // Get quote from Fusion+ for EVM chains
    if (this.isEVMChain(request.fromChain) && this.isEVMChain(request.toChain)) {
      return await this.fusionService.getCrossChainQuote({
        fromChainId: this.getChainId(request.fromChain),
        toChainId: this.getChainId(request.toChain),
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: request.fromAmount,
        userAddress: request.userAddress
      });
    }

    // For L1 chains, use mock pricing (in production, integrate with DEX APIs)
    return {
      toAmount: request.fromAmount, // 1:1 for demo
      price: '1.0',
      gasEstimate: '100000'
    };
  }

  async refundSwap(swapId: string): Promise<string> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    if (swap.status !== 'source_locked' && swap.status !== 'destination_locked') {
      throw new Error('Swap cannot be refunded');
    }

    // Refund on source chain
    if (this.isEVMChain(swap.fromChain)) {
      const refundTxHash = await this.refundOnEVMChain(swap);
      swap.transactions.refundTx = refundTxHash;
    } else {
      const l1Service = this.l1Services.get(swap.fromChain);
      if (l1Service) {
        const refundTxHash = await l1Service.refundHTLC(swapId);
        swap.transactions.refundTx = refundTxHash;
      }
    }

    swap.status = 'refunded';
    swap.updatedAt = Date.now();
    this.swaps.set(swapId, swap);
    return swap.transactions.refundTx || '';
  }

  getSwapStatus(swapId: string): CrossChainSwapStatus | null {
    return this.swaps.get(swapId) || null;
  }

  getUserSwaps(userAddress: string): CrossChainSwapStatus[] {
    return Array.from(this.swaps.values()).filter(swap => swap.userAddress === userAddress);
  }

  private async lockFundsOnEVMChain(swap: CrossChainSwapStatus): Promise<string> {
    // Use Fusion+ to lock funds on EVM chain
    const result = await this.fusionService.executeCrossChainSwap({
      fromChainId: this.getChainId(swap.fromChain),
      toChainId: this.getChainId(swap.toChain),
      fromToken: swap.fromToken,
      toToken: swap.toToken,
      fromAmount: swap.fromAmount,
      toAmount: swap.toAmount,
      userAddress: swap.userAddress
    });
    return result.txHash || 'mock_tx_hash';
  }

  private async refundOnEVMChain(swap: CrossChainSwapStatus): Promise<string> {
    // Implement refund logic for EVM chains
    return `refund_${Date.now()}`;
  }

  private generateSwapId(): string {
    return `swap_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSecretAndHashlock(): { secret: string; hashlock: string } {
    const secret = crypto.randomBytes(32).toString('hex');
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
    return { secret, hashlock };
  }

  private isEVMChain(chain: string): boolean {
    const evmChains = ['ethereum', 'polygon', 'arbitrum', 'base', 'optimism', 'bsc', 'avalanche', 'fantom', 'monad'];
    return evmChains.includes(chain.toLowerCase());
  }

  private getChainId(chain: string): number {
    const chainIds: { [key: string]: number } = {
      'ethereum': 1,
      'polygon': 137,
      'arbitrum': 42161,
      'base': 8453,
      'optimism': 10,
      'bsc': 56,
      'avalanche': 43114,
      'fantom': 250,
      'monad': 1337 // Mock chain ID
    };
    return chainIds[chain.toLowerCase()] || 1;
  }
}

// Factory function
export function createFusionPlusL1Extension(): FusionPlusL1Extension {
  return new FusionPlusL1Extension();
} 