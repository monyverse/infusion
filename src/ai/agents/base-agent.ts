import { OpenAI } from 'openai';
import { z } from 'zod';
import { Logger } from '@/utils/logger';
import { ChainConfig, AgentConfig, AgentResponse } from '@/types/ai';

abstract class BaseAgent {
  protected openai: OpenAI;
  protected logger: Logger;
  public config: AgentConfig;
  protected chainConfigs: Map<string, ChainConfig>;

  constructor(config: AgentConfig) {
    this.config = config;
    this.logger = new Logger(this.constructor.name);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.chainConfigs = new Map();
  }

  /**
   * Initialize the agent with chain configurations
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing agent...');
    
    // Load chain configurations
    await this.loadChainConfigs();
    
    // Validate configuration
    this.validateConfig();
    
    this.logger.info('Agent initialized successfully');
  }

  /**
   * Process a user intent and return an action plan
   */
  async processIntent(intent: string, context?: any): Promise<AgentResponse> {
    try {
      this.logger.info(`Processing intent: ${intent}`);
      
      // Validate intent
      const validatedIntent = await this.validateIntent(intent);
      
      // Generate action plan
      const actionPlan = await this.generateActionPlan(validatedIntent, context);
      
      // Execute actions
      const result = await this.executeActions(actionPlan);
      
      return {
        success: true,
        data: result,
        message: 'Intent processed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error processing intent: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate user intent using AI
   */
  protected async validateIntent(intent: string): Promise<string> {
    const validationSchema = z.object({
      intent: z.string().min(1),
      confidence: z.number().min(0).max(1),
      risk_level: z.enum(['low', 'medium', 'high']),
      estimated_gas: z.number().optional(),
    });

    const prompt = `
      Analyze the following DeFi intent and validate it:
      Intent: "${intent}"
      
      Return a JSON object with:
      - intent: validated and clarified intent
      - confidence: confidence score (0-1)
      - risk_level: low/medium/high
      - estimated_gas: estimated gas cost in USD (optional)
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return validationSchema.parse(result).intent;
  }

  /**
   * Generate action plan using AI
   */
  protected async generateActionPlan(intent: string, context?: any): Promise<any[]> {
    const prompt = `
      Generate a detailed action plan for the following DeFi intent:
      Intent: "${intent}"
      Context: ${JSON.stringify(context || {})}
      
      Available chains: ${Array.from(this.chainConfigs.keys()).join(', ')}
      
      Return a JSON array of actions with:
      - action_type: swap/transfer/limit_order/arbitrage/etc
      - chain: target blockchain
      - parameters: action-specific parameters
      - estimated_cost: estimated cost in USD
      - priority: 1-5 (1=highest)
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '[]');
  }

  /**
   * Execute a list of actions
   */
  protected async executeActions(actions: any[]): Promise<any[]> {
    const results = [];
    
    for (const action of actions) {
      try {
        this.logger.info(`Executing action: ${action.action_type}`);
        const result = await this.executeAction(action);
        results.push({ ...action, result, success: true });
      } catch (error) {
        this.logger.error(`Action failed: ${action.action_type} - ${error}`);
        results.push({ ...action, error, success: false });
      }
    }
    
    return results;
  }

  /**
   * Execute a single action - to be implemented by subclasses
   */
  protected abstract executeAction(action: any): Promise<any>;

  /**
   * Load chain configurations
   */
  protected async loadChainConfigs(): Promise<void> {
    // Ethereum
    this.chainConfigs.set('ethereum', {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: process.env.ETHEREUM_RPC_URL!,
      nativeToken: 'ETH',
      gasToken: 'ETH',
      supportsEIP1559: true,
    });

    // Bitcoin
    this.chainConfigs.set('bitcoin', {
      chainId: 0,
      name: 'Bitcoin',
      rpcUrl: process.env.BITCOIN_RPC_URL!,
      nativeToken: 'BTC',
      gasToken: 'BTC',
      supportsEIP1559: false,
    });

    // Stellar
    this.chainConfigs.set('stellar', {
      chainId: 148,
      name: 'Stellar',
      rpcUrl: process.env.STELLAR_RPC_URL!,
      nativeToken: 'XLM',
      gasToken: 'XLM',
      supportsEIP1559: false,
    });

    // NEAR
    this.chainConfigs.set('near', {
      chainId: 1313161554,
      name: 'NEAR',
      rpcUrl: process.env.NEAR_RPC_URL!,
      nativeToken: 'NEAR',
      gasToken: 'NEAR',
      supportsEIP1559: false,
    });

    // Etherlink
    this.chainConfigs.set('etherlink', {
      chainId: 128123,
      name: 'Etherlink',
      rpcUrl: process.env.ETHERLINK_RPC_URL!,
      nativeToken: 'XTZ',
      gasToken: 'XTZ',
      supportsEIP1559: true,
    });
  }

  /**
   * Validate agent configuration
   */
  protected validateConfig(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    if (!this.config.maxRetries || this.config.maxRetries < 1) {
      throw new Error('maxRetries must be at least 1');
    }

    if (!this.config.timeout || this.config.timeout < 1000) {
      throw new Error('timeout must be at least 1000ms');
    }
  }

  /**
   * Get chain configuration
   */
  protected getChainConfig(chainName: string): ChainConfig {
    const config = this.chainConfigs.get(chainName);
    if (!config) {
      throw new Error(`Chain configuration not found for: ${chainName}`);
    }
    return config;
  }

  /**
   * Calculate gas cost for an action
   */
  protected async calculateGasCost(action: any): Promise<number> {
    // Implementation depends on the specific chain
    const chainConfig = this.getChainConfig(action.chain);
    
    // Default gas estimation
    const baseGas = 21000; // Basic transfer
    const gasPrice = await this.getGasPrice(action.chain);
    
    return Number((BigInt(baseGas) * gasPrice) / BigInt(1e18)); // Convert to ETH
  }

  /**
   * Get current gas price for a chain
   */
  protected async getGasPrice(chainName: string): Promise<bigint> {
    const chainConfig = this.getChainConfig(chainName);
    
    // This would typically call the chain's RPC
    // For now, return a default value
    return BigInt(20000000000); // 20 gwei
  }

  /**
   * Log agent activity
   */
  protected logActivity(activity: string, data?: any): void {
    this.logger.info(activity, data);
  }

  /**
   * Handle errors gracefully
   */
  protected handleError(error: any, context?: string): void {
    this.logger.error(`Error in ${context || 'unknown context'}:`, error);
    
    // Could add error reporting to external services here
    if (process.env.SENTRY_DSN) {
      // Sentry.error(error);
    }
  }
}

export { BaseAgent }; 