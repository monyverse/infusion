const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3003;

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
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
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
app.post('/api/ai/process-intent', async (req, res) => {
  try {
    const { intent, context } = req.body;
    
    if (!intent) {
      return res.status(400).json({ error: 'Intent is required' });
    }

    console.log('Processing AI intent:', { intent, context });
    
    // Mock AI response
    const result = {
      success: true,
      intent: intent,
      confidence: 0.95,
      actions: [
        {
          type: 'swap',
          chain: 'ethereum',
          fromToken: 'USDC',
          toToken: 'ETH',
          amount: '100',
          estimatedGas: '50000',
        }
      ],
      timestamp: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing AI intent:', error);
    res.status(500).json({
      error: 'Failed to process intent',
      message: error.message || 'Unknown error',
    });
  }
});

// AI Agent Status
app.get('/api/ai/status', (req, res) => {
  try {
    const status = {
      agents: {
        portfolio: { status: 'active', lastActivity: new Date().toISOString() },
        trading: { status: 'active', lastActivity: new Date().toISOString() },
        security: { status: 'active', lastActivity: new Date().toISOString() },
      },
      totalIntents: 150,
      successRate: 0.98,
    };
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({
      error: 'Failed to get AI status',
      message: error.message || 'Unknown error',
    });
  }
});

// Fusion+ Quote
app.post('/api/fusion-plus/quote', async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, chainId } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !chainId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Mock quote response
    const quote = {
      fromToken,
      toToken,
      fromAmount,
      toAmount: (parseFloat(fromAmount) * 0.98).toString(), // 2% slippage
      price: '2000',
      gasEstimate: '50000',
      protocols: ['1inch-fusion'],
      route: [
        {
          protocol: '1inch-fusion',
          fromToken,
          toToken,
          amount: fromAmount,
          fee: '0.003',
        }
      ],
    };
    
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting Fusion+ quote:', error);
    res.status(500).json({
      error: 'Failed to get quote',
      message: error.message || 'Unknown error',
    });
  }
});

// Fusion+ Swap
app.post('/api/fusion-plus/swap', async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, toAmount, userAddress, deadline } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !toAmount || !userAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Mock swap response
    const result = {
      orderHash: '0x' + Math.random().toString(36).substr(2, 9),
      status: 'submitted',
      txHash: '0x' + Math.random().toString(36).substr(2, 9),
      gasUsed: '50000',
      gasPrice: '20000000000',
    };
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error executing Fusion+ swap:', error);
    res.status(500).json({
      error: 'Failed to execute swap',
      message: error.message || 'Unknown error',
    });
  }
});

// NEAR Cross-Chain Quote
app.post('/api/near/cross-chain-quote', async (req, res) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, toAmount, userAddress, nearAccountId } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Mock cross-chain quote
    const quote = {
      fromChain,
      toChain: 'near',
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      estimatedTime: 300,
      gasEstimate: '50000',
      totalFee: '0.005',
      route: [
        {
          chain: fromChain,
          protocol: '1inch-fusion',
          fromToken,
          toToken,
          amount: fromAmount,
          fee: '0.003',
        },
        {
          chain: 'near',
          protocol: 'ref-finance',
          fromToken: toToken,
          toToken: fromToken,
          amount: toAmount,
          fee: '0.002',
        }
      ],
    };
    
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting NEAR cross-chain quote:', error);
    res.status(500).json({
      error: 'Failed to get cross-chain quote',
      message: error.message || 'Unknown error',
    });
  }
});

// NEAR Cross-Chain Swap
app.post('/api/near/cross-chain-swap', async (req, res) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, toAmount, userAddress, nearAccountId, deadline, timelock } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Mock cross-chain swap
    const result = {
      evmOrder: {
        orderHash: '0x' + Math.random().toString(36).substr(2, 9),
        status: 'submitted',
        txHash: '0x' + Math.random().toString(36).substr(2, 9),
      },
      nearOrder: {
        orderId: 'order_' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        hashlock: '0x' + Math.random().toString(36).substr(2, 9),
        secret: 'secret_' + Math.random().toString(36).substr(2, 9),
        expiresAt: Date.now() + (timelock || 3600) * 1000,
      },
      crossChainSwapId: 'cc_swap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      status: 'initiated',
      estimatedTime: timelock || 3600,
      nextSteps: [
        '1. Wait for EVM order to be filled',
        '2. Execute NEAR swap using revealed secret',
        '3. Complete cross-chain transfer'
      ],
    };
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error executing NEAR cross-chain swap:', error);
    res.status(500).json({
      error: 'Failed to execute cross-chain swap',
      message: error.message || 'Unknown error',
    });
  }
});

// NEAR Account Balance
app.get('/api/near/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Mock balance response
    const balance = '1000000000000000000000000'; // 1 NEAR
    
    res.json({
      success: true,
      data: { accountId, balance },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting NEAR balance:', error);
    res.status(500).json({
      error: 'Failed to get balance',
      message: error.message || 'Unknown error',
    });
  }
});

// Order Management
app.post('/api/orders/create', async (req, res) => {
  try {
    const { type, maker, taker, timelock } = req.body;
    
    if (!type || !maker || !taker || !timelock) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Mock order creation
    const order = {
      id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      status: 'created',
      maker,
      taker,
      timelock,
      createdAt: Date.now(),
      expiresAt: Date.now() + timelock * 1000,
    };
    
    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message || 'Unknown error',
    });
  }
});

// Portfolio Management
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Mock portfolio response
    const portfolio = {
      address,
      chains: {
        ethereum: { 
          balance: '1.5', 
          tokens: [
            { symbol: 'ETH', balance: '1.5', usdValue: '3000' },
            { symbol: 'USDC', balance: '1000', usdValue: '1000' }
          ] 
        },
        near: { 
          balance: '10', 
          tokens: [
            { symbol: 'NEAR', balance: '10', usdValue: '50' },
            { symbol: 'USDC', balance: '500', usdValue: '500' }
          ] 
        },
        bitcoin: { 
          balance: '0.1', 
          tokens: [
            { symbol: 'BTC', balance: '0.1', usdValue: '4000' }
          ] 
        },
      },
      totalValue: '8550',
      lastUpdated: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      error: 'Failed to get portfolio',
      message: error.message || 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI endpoints: http://localhost:${PORT}/api/ai/`);
  console.log(`💱 Fusion+ endpoints: http://localhost:${PORT}/api/fusion-plus/`);
  console.log(`🌐 NEAR endpoints: http://localhost:${PORT}/api/near/`);
  console.log(`📋 Order endpoints: http://localhost:${PORT}/api/orders/`);
  console.log(`💼 Portfolio endpoints: http://localhost:${PORT}/api/portfolio/`);
});

module.exports = app; 