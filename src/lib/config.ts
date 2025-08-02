// Configuration for the application
export const config = {
  // Backend configuration
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003',
    port: process.env.NEXT_PUBLIC_BACKEND_PORT || '3003',
  },
  
  // 1inch API configuration
  oneinch: {
    apiKey: process.env.NEXT_PUBLIC_INCH_API_KEY || '',
    apiUrl: 'https://api.1inch.dev',
    fusionPlusUrl: 'https://fusion.1inch.io',
  },
  
  // AI configuration
  ai: {
    openaiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    anthropicKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  },
  
  // Blockchain configuration
  blockchain: {
    ethereum: {
      rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your_key',
      chainId: 1,
    },
    sepolia: {
      rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.drpc.org',
      chainId: 11155111,
    },
  },
  
  // Feature flags
  features: {
    enableAI: true,
    enableCrossChainSwaps: true,
    enableLimitOrders: true,
    enablePortfolioRebalancing: true,
  },
};

// Helper function to get backend URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${config.backend.url}${endpoint}`;
};

// Helper function to get 1inch API URL
export const getOneInchUrl = (endpoint: string = '') => {
  return `${config.oneinch.apiUrl}${endpoint}`;
}; 