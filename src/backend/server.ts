const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { agentManager } = require('../ai/agent-manager');
const { Logger } = require('../utils/logger');
const { OneInchAPI } = require('../utils/1inch-api');

const app = express();
const logger = new Logger('backend');
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const isHealthy = await agentManager.healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        agentManager: isHealthy,
        oneinch: true // TODO: Add actual health check
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// AI Intent Processing endpoint
app.post('/api/ai/process-intent', async (req, res) => {
  try {
    const { intent, context } = req.body;

    if (!intent) {
      return res.status(400).json({
        error: 'Intent is required'
      });
    }

    logger.info('Processing AI intent', { intent, context });

    const result = await agentManager.processIntent(intent, context);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to process intent', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Agent status endpoint
app.get('/api/ai/status', (req, res) => {
  try {
    const status = agentManager.getAgentStatus();
    res.json({
      success: true,
      agents: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get agent status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent status'
    });
  }
});

// 1inch API proxy endpoints
const oneInchAPI = new OneInchAPI();

// Get swap quote
app.post('/api/1inch/quote', async (req, res) => {
  try {
    const { fromToken, toToken, amount, chainId } = req.body;

    if (!fromToken || !toToken || !amount || !chainId) {
      return res.status(400).json({
        error: 'Missing required parameters: fromToken, toToken, amount, chainId'
      });
    }

    const quote = await oneInchAPI.getSwapQuote({
      chain: chainId.toString(),
      tokenIn: fromToken,
      tokenOut: toToken,
      amount: amount.toString()
    });

    res.json({
      success: true,
      quote,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get swap quote', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap quote'
    });
  }
});

// Execute swap
app.post('/api/1inch/swap', async (req, res) => {
  try {
    const { fromToken, toToken, amount, chainId, fromAddress, slippage } = req.body;

    if (!fromToken || !toToken || !amount || !chainId || !fromAddress) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    const swapResult = await oneInchAPI.executeSwap({
      chain: chainId.toString(),
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn: amount.toString(),
      slippage: slippage || 1,
      recipient: fromAddress,
      tx: {
        to: '',
        data: '',
        value: '0',
        gas: 0,
        gasPrice: '0'
      }
    });

    res.json({
      success: true,
      result: swapResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to execute swap', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute swap'
    });
  }
});

// Get supported tokens
app.get('/api/1inch/tokens/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const tokens = await oneInchAPI.getSupportedTokens(chainId);

    res.json({
      success: true,
      tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get supported tokens', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported tokens'
    });
  }
});

// Get token price
app.get('/api/1inch/price/:token/:chainId', async (req, res) => {
  try {
    const { token, chainId } = req.params;
    const price = await oneInchAPI.getTokenPrice(token, chainId);

    res.json({
      success: true,
      price,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get token price', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token price'
    });
  }
});

// Portfolio endpoints
app.get('/api/portfolio/balance/:address/:chainId', async (req, res) => {
  try {
    const { address, chainId } = req.params;
    
    // TODO: Implement actual balance fetching
    const mockBalance = {
      address,
      chainId,
      tokens: [
        { symbol: 'ETH', balance: '1.5', usdValue: '3000' },
        { symbol: 'USDC', balance: '1000', usdValue: '1000' }
      ],
      totalUsdValue: '4000'
    };

    res.json({
      success: true,
      balance: mockBalance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get portfolio balance', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio balance'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 UniteAI Backend Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/api/health`);
  logger.info(`🤖 AI endpoints available at http://localhost:${PORT}/api/ai/`);
  logger.info(`💱 1inch endpoints available at http://localhost:${PORT}/api/1inch/`);
});

module.exports = app; 