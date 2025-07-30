const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: true,
      ai: true
    }
  });
});

// AI Intent Processing endpoint
app.post('/api/ai/process-intent', (req, res) => {
  try {
    const { intent, context } = req.body;

    if (!intent) {
      return res.status(400).json({
        error: 'Intent is required'
      });
    }

    console.log('Processing AI intent:', intent);

    // Mock AI processing
    const result = {
      success: true,
      data: {
        intent: intent,
        actions: [
          {
            type: 'portfolio_rebalancing',
            description: 'Rebalancing portfolio based on intent',
            status: 'pending'
          }
        ],
        confidence: 0.85,
        estimatedGas: 0.01
      },
      message: 'Intent processed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(result);

  } catch (error) {
    console.error('Failed to process intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Agent status endpoint
app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    agents: {
      'portfolio-manager': {
        name: 'Portfolio Manager',
        description: 'Manages portfolio rebalancing and risk assessment',
        capabilities: ['rebalancing', 'risk-assessment', 'diversification'],
        isActive: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 1inch API proxy endpoints
app.post('/api/1inch/quote', (req, res) => {
  try {
    const { fromToken, toToken, amount, chainId } = req.body;

    if (!fromToken || !toToken || !amount || !chainId) {
      return res.status(400).json({
        error: 'Missing required parameters: fromToken, toToken, amount, chainId'
      });
    }

    // Mock quote response
    const quote = {
      fromToken,
      toToken,
      amountIn: amount,
      amountOut: (parseFloat(amount) * 0.98).toString(), // 2% slippage
      priceImpact: 0.5,
      gasEstimate: 150000,
      gasCost: 0.01,
      route: ['Uniswap V3'],
      protocol: '1inch'
    };

    res.json({
      success: true,
      quote,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get swap quote:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get swap quote'
    });
  }
});

// Portfolio endpoints
app.get('/api/portfolio/balance/:address/:chainId', (req, res) => {
  try {
    const { address, chainId } = req.params;
    
    // Mock balance data
    const balance = {
      address,
      chainId,
      tokens: [
        { symbol: 'ETH', balance: '1.5', usdValue: '3000' },
        { symbol: 'USDC', balance: '1000', usdValue: '1000' },
        { symbol: 'BTC', balance: '0.05', usdValue: '2000' }
      ],
      totalUsdValue: '6000'
    };

    res.json({
      success: true,
      balance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get portfolio balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio balance'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
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
  console.log(`🚀 UniteAI Backend Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI endpoints available at http://localhost:${PORT}/api/ai/`);
  console.log(`💱 1inch endpoints available at http://localhost:${PORT}/api/1inch/`);
});

module.exports = app; 