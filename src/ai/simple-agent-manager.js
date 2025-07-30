const PORT = process.env.AI_PORT || 3002;

// Simple AI Agent Manager
class SimpleAgentManager {
  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    console.log('🤖 Initializing AI Agents...');
    
    // Mock portfolio manager agent
    this.agents.set('portfolio-manager', {
      name: 'Portfolio Manager',
      description: 'Manages portfolio rebalancing and risk assessment',
      capabilities: ['rebalancing', 'risk-assessment', 'diversification'],
      isActive: true
    });

    console.log('✅ Portfolio Manager Agent initialized successfully');
  }

  processIntent(intent, context = {}) {
    console.log('🧠 Processing intent:', intent);
    
    // Simple intent routing
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('rebalance') || 
        intentLower.includes('portfolio') || 
        intentLower.includes('diversify') ||
        intentLower.includes('risk')) {
      
      return {
        success: true,
        agent: 'portfolio-manager',
        data: {
          intent: intent,
          actions: [
            {
              type: 'portfolio_rebalancing',
              description: 'Rebalancing portfolio based on intent',
              status: 'pending',
              estimatedGas: 0.01
            }
          ],
          confidence: 0.85,
          riskLevel: 'medium'
        },
        message: 'Intent processed by Portfolio Manager Agent',
        timestamp: new Date().toISOString()
      };
    }

    // Default response
    return {
      success: true,
      agent: 'default',
      data: {
        intent: intent,
        actions: [
          {
            type: 'general_processing',
            description: 'Processing general intent',
            status: 'pending'
          }
        ],
        confidence: 0.7
      },
      message: 'Intent processed by default agent',
      timestamp: new Date().toISOString()
    };
  }

  getAgentStatus() {
    const status = {};
    
    for (const [name, agent] of this.agents) {
      status[name] = {
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        isActive: agent.isActive
      };
    }

    return status;
  }

  healthCheck() {
    try {
      for (const [name, agent] of this.agents) {
        if (!agent.isActive) {
          console.error(`Agent ${name} is not active`);
          return false;
        }
      }

      console.log('✅ All agents are healthy');
      return true;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const agentManager = new SimpleAgentManager();

// Start the agent manager
console.log('🚀 Starting UniteAI Agent Manager...');

const isHealthy = agentManager.healthCheck();
if (isHealthy) {
  console.log('✅ Agent Manager is healthy and ready');
  console.log('📊 Agent Status:', agentManager.getAgentStatus());
} else {
  console.error('❌ Agent Manager health check failed');
  process.exit(1);
}

// Export for use in other modules
module.exports = { agentManager }; 