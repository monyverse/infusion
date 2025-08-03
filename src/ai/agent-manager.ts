import { PortfolioManagerAgent } from './agents/portfolio-agent';
import { BaseAgent } from './agents/base-agent';
import { Logger } from '../utils/logger';

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AgentManager');
    this.initializeAgents();
  }

  private initializeAgents(): void {
    try {
      // Initialize portfolio manager agent
      const portfolioAgent = new PortfolioManagerAgent({
        name: 'portfolio-manager',
        description: 'Manages portfolio rebalancing and risk assessment',
        capabilities: ['rebalancing', 'risk-assessment', 'diversification'],
        walletAddress: process.env.WALLET_ADDRESS || '',
        apiKeys: {
          openai: process.env.OPENAI_API_KEY || '',
          oneinch: process.env.ONEINCH_API_KEY || '',
        },
        maxRetries: 3,
        timeout: 30000,
        enableLogging: true,
        enableMetrics: true,
        model: 'gpt-4',
        temperature: 0.1
      });

      this.agents.set('portfolio-manager', portfolioAgent);
      this.logger.info('Portfolio Manager Agent initialized successfully');

      // TODO: Initialize other agents (TradingAgent, CrossChainAgent, SecurityAgent)
      // this.agents.set('trading', new TradingAgent(config));
      // this.agents.set('cross-chain', new CrossChainAgent(config));
      // this.agents.set('security', new SecurityAgent(config));

    } catch (error) {
      this.logger.error('Failed to initialize agents', error);
      throw error;
    }
  }

  public async processIntent(intent: string, context?: any): Promise<any> {
    try {
      this.logger.info('Processing intent', { intent, context });

      // Determine which agent should handle this intent
      const agent = this.selectAgent(intent);
      if (!agent) {
        throw new Error(`No suitable agent found for intent: ${intent}`);
      }

      // Process the intent with the selected agent
      const result = await agent.processIntent(intent, context);
      
      this.logger.info('Intent processed successfully', { intent, result });
      return result;

    } catch (error) {
      this.logger.error('Failed to process intent', { intent, error });
      throw error;
    }
  }

  private selectAgent(intent: string): BaseAgent | null {
    // Simple intent routing logic
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('rebalance') || 
        intentLower.includes('portfolio') || 
        intentLower.includes('diversify') ||
        intentLower.includes('risk')) {
      return this.agents.get('portfolio-manager') || null;
    }

    // TODO: Add routing for other agents
    // if (intentLower.includes('trade') || intentLower.includes('swap')) {
    //   return this.agents.get('trading') || null;
    // }

    // Default to portfolio manager for now
    return this.agents.get('portfolio-manager') || null;
  }

  public getAgentStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, agent] of this.agents) {
      status[name] = {
        name: agent.config.name,
        description: agent.config.description,
        capabilities: agent.config.capabilities,
        isActive: true
      };
    }

    return status;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Check if all agents are properly initialized
      for (const [name, agent] of this.agents) {
        if (!agent) {
          this.logger.error(`Agent ${name} is not properly initialized`);
          return false;
        }
      }

      this.logger.info('All agents are healthy');
      return true;

    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}

// Export singleton instance
const agentManager = new AgentManager();
module.exports = { agentManager };

// Start the agent manager if this file is run directly
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Starting InFusion Agent Manager...');
      
      const isHealthy = await agentManager.healthCheck();
      if (isHealthy) {
        console.log('✅ Agent Manager is healthy and ready');
        console.log('📊 Agent Status:', agentManager.getAgentStatus());
      } else {
        console.error('❌ Agent Manager health check failed');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Failed to start Agent Manager:', error);
      process.exit(1);
    }
  })();
} 