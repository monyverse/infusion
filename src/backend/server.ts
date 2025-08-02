const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { json } = require('body-parser');
const { createFusionPlusService, FUSION_PLUS_CONFIGS } = require('../services/fusion-plus');
const { createNEARService, NEAR_CONFIGS } = require('../services/near-service');
const { AgentManager } = require('../ai/agent-manager');
const { OrderManager } = require('../orders/order-manager');
const { ReverseOrderManager } = require('../reverse/reverse-order-manager');
const { Logger } = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 3003;
const logger = new Logger('BackendServer');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(json({ limit: '10mb' }));

// Initialize services
const fusionPlusService = createFusionPlusService(FUSION_PLUS_CONFIGS.sepolia);
const nearService = createNEARService(NEAR_CONFIGS.testnet);
const agentManager = new AgentManager();
const orderManager = new OrderManager();
const reverseOrderManager = new ReverseOrderManager();

// Health check endpoint
app.get('/api/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      fusionPlus: 'active',
      near: 'active',
      ai: 'active',
      orders: 'active',
    },
  });
});

// AI Intent Processing
app.post('/api/ai/process-intent', async (req: any, res: any) => {
  try {
    const { intent, context } = req.body;
    
    if (!intent) {
      return res.status(400).json({ error: 'Intent is required' });
    }

    logger.info('Processing AI intent', { intent, context });
    
    const result = await agentManager.processIntent(intent, context);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error processing AI intent', error);
    res.status(500).json({
      error: 'Failed to process intent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// AI Agent Status
app.get('/api/ai/status', (req: any, res: any) => {
  try {
    const status = agentManager.getAgentStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting AI status', error);
    res.status(500).json({
      error: 'Failed to get AI status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Fusion+ Quote
app.post('/api/fusion-plus/quote', async (req: any, res: any) => {
  try {
    const { fromToken, toToken, fromAmount, chainId } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !chainId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const quote = await fusionPlusService.getQuote({
      fromToken,
      toToken,
      fromAmount,
      chainId,
    });
    
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting Fusion+ quote', error);
    res.status(500).json({
      error: 'Failed to get quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Fusion+ Swap
app.post('/api/fusion-plus/swap', async (req: any, res: any) => {
  try {
    const { fromToken, toToken, fromAmount, toAmount, userAddress, deadline } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !toAmount || !userAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await fusionPlusService.executeSwap({
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      deadline,
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing Fusion+ swap', error);
    res.status(500).json({
      error: 'Failed to execute swap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// NEAR Cross-Chain Quote
app.post('/api/near/cross-chain-quote', async (req: any, res: any) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, toAmount, userAddress, nearAccountId } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const quote = await fusionPlusService.getNEARCrossChainQuote({
      fromChain,
      toChain: 'near',
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      nearAccountId,
    });
    
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting NEAR cross-chain quote', error);
    res.status(500).json({
      error: 'Failed to get cross-chain quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// NEAR Cross-Chain Swap
app.post('/api/near/cross-chain-swap', async (req: any, res: any) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, toAmount, userAddress, nearAccountId, deadline, timelock } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await fusionPlusService.executeNEARCrossChainSwap({
      fromChain,
      toChain: 'near',
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      nearAccountId,
      deadline,
      timelock,
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing NEAR cross-chain swap', error);
    res.status(500).json({
      error: 'Failed to execute cross-chain swap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// NEAR Account Balance
app.get('/api/near/balance/:accountId', async (req: any, res: any) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const balance = await nearService.getAccountBalance(accountId);
    
    res.json({
      success: true,
      data: { accountId, balance },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting NEAR balance', error);
    res.status(500).json({
      error: 'Failed to get balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// NEAR Token Balance
app.get('/api/near/token-balance/:accountId/:tokenContractId', async (req: any, res: any) => {
  try {
    const { accountId, tokenContractId } = req.params;
    
    if (!accountId || !tokenContractId) {
      return res.status(400).json({ error: 'Account ID and token contract ID are required' });
    }

    const balance = await nearService.getTokenBalance(accountId, tokenContractId);
    
    res.json({
      success: true,
      data: { accountId, tokenContractId, balance },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting NEAR token balance', error);
    res.status(500).json({
      error: 'Failed to get token balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Order Management
app.post('/api/orders/create', async (req: any, res: any) => {
  try {
    const { type, maker, taker, timelock } = req.body;
    
    if (!type || !maker || !taker || !timelock) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const order = orderManager.createOrder(type, maker, taker, timelock);
    
    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating order', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/orders/:orderId', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = orderManager.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting order', error);
    res.status(500).json({
      error: 'Failed to get order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/orders', async (req: any, res: any) => {
  try {
    const { status, type } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const orders = orderManager.listOrders(filter);
    
    res.json({
      success: true,
      data: orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error listing orders', error);
    res.status(500).json({
      error: 'Failed to list orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Portfolio Management
app.get('/api/portfolio/:address', async (req: any, res: any) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Get balances from multiple chains
    const portfolio = {
      address,
      chains: {
        ethereum: { balance: '0', tokens: [] },
        near: { balance: '0', tokens: [] },
        bitcoin: { balance: '0', tokens: [] },
      },
      totalValue: '0',
      lastUpdated: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting portfolio', error);
    res.status(500).json({
      error: 'Failed to get portfolio',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 