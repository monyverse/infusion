export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: string;
  gasToken: string;
  supportsEIP1559: boolean;
  explorerUrl?: string;
  blockTime?: number;
}

export interface AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  walletAddress: string;
  apiKeys: {
    openai: string;
    oneinch: string;
  };
  maxRetries: number;
  timeout: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  model: string;
  temperature: number;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
  gasUsed?: number;
  cost?: number;
}

export interface SwapAction {
  action_type: 'swap';
  chain: string;
  parameters: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage: number;
    recipient: string;
  };
  estimated_cost: number;
  priority: number;
}

export interface TransferAction {
  action_type: 'transfer';
  chain: string;
  parameters: {
    token: string;
    amount: string;
    recipient: string;
  };
  estimated_cost: number;
  priority: number;
}

export interface LimitOrderAction {
  action_type: 'limit_order';
  chain: string;
  parameters: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    price: string;
    expiry: number;
  };
  estimated_cost: number;
  priority: number;
}

export interface ArbitrageAction {
  action_type: 'arbitrage';
  chains: string[];
  parameters: {
    token: string;
    amount: string;
    minProfit: number;
  };
  estimated_cost: number;
  priority: number;
}

export type Action = SwapAction | TransferAction | LimitOrderAction | ArbitrageAction;

export interface PortfolioAllocation {
  [token: string]: number; // percentage (0-1)
}

export interface RebalancingStrategy {
  targetAllocation: PortfolioAllocation;
  rebalanceThreshold: number;
  maxSlippage: number;
  gasOptimization: boolean;
}

export interface RiskProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxDrawdown: number;
  stopLossPercentage: number;
  diversificationTarget: number;
}

export interface TradingStrategy {
  name: string;
  type: 'dca' | 'twap' | 'limit' | 'arbitrage' | 'yield';
  parameters: Record<string, any>;
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CrossChainSwap {
  sourceChain: string;
  destinationChain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  slippage: number;
  deadline: number;
  htlcSecret?: string;
  htlcHash?: string;
}

export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: number;
  gasCost: number;
  route: string[];
  protocol: string;
}

export interface LimitOrder {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  price: string;
  expiry: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  filledAt?: number;
  txHash?: string;
}

export interface WalletState {
  address: string;
  balances: Record<string, string>;
  transactions: Transaction[];
  pendingActions: Action[];
  riskMetrics: RiskMetrics;
}

export interface Transaction {
  hash: string;
  chain: string;
  type: 'swap' | 'transfer' | 'limit_order' | 'arbitrage';
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: number;
  gasCost: number;
  timestamp: number;
  details: any;
}

export interface RiskMetrics {
  portfolioValue: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  correlation: number;
  beta: number;
}

export interface AIAgentMetrics {
  totalIntents: number;
  successfulIntents: number;
  averageResponseTime: number;
  totalGasUsed: number;
  totalCost: number;
  errorRate: number;
}

export interface ChainMetrics {
  chain: string;
  totalTransactions: number;
  totalVolume: number;
  averageGasPrice: number;
  successRate: number;
  averageConfirmationTime: number;
} 