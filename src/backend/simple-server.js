require('dotenv').config({ path: './env.local' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// NEAR Cross-Chain Swap endpoints
app.post('/api/near/cross-chain-quote', async (req, res) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, userAddress, nearAccountId } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Mock NEAR cross-chain quote
    const mockQuote = {
      fromChain,
      toChain: 'near',
      fromToken,
      toToken,
      fromAmount,
      toAmount: (parseFloat(fromAmount) * 0.98).toString(), // Mock 2% slippage
      evmQuote: {
        fromToken,
        toToken,
        fromAmount,
        toAmount: (parseFloat(fromAmount) * 0.985).toString(),
        price: '1.0',
        gasEstimate: '300000',
        protocols: ['1inch-fusion'],
        route: [{
          chain: fromChain,
          protocol: '1inch-fusion',
          fromToken,
          toToken,
          amount: fromAmount,
          fee: '0.003'
        }]
      },
      nearQuote: {
        fromToken: toToken,
        toToken: fromToken,
        fromAmount: (parseFloat(fromAmount) * 0.98).toString(),
        toAmount: fromAmount,
        price: '1.0',
        gasEstimate: '30000000000000',
        protocols: ['ref-finance'],
        route: [{
          protocol: 'ref-finance',
          fromToken: toToken,
          toToken: fromToken,
          amount: (parseFloat(fromAmount) * 0.98).toString(),
          fee: '0.002',
          poolId: '1'
        }]
      },
      estimatedTime: 300,
      gasEstimate: '300000',
      totalFee: '0.005',
      route: [
        {
          chain: fromChain,
          protocol: '1inch-fusion',
          fromToken,
          toToken,
          amount: fromAmount,
          fee: '0.003'
        },
        {
          chain: 'near',
          protocol: 'ref-finance',
          fromToken: toToken,
          toToken: fromToken,
          amount: (parseFloat(fromAmount) * 0.98).toString(),
          fee: '0.002'
        }
      ]
    };

    res.json({
      success: true,
      data: mockQuote,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NEAR cross-chain quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get NEAR cross-chain quote'
    });
  }
});

app.post('/api/near/cross-chain-swap', async (req, res) => {
  try {
    const { fromChain, fromToken, toToken, fromAmount, toAmount, userAddress, nearAccountId, deadline, timelock } = req.body;
    
    if (!fromChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !nearAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Mock NEAR cross-chain swap execution
    const mockResult = {
      evmOrder: {
        orderHash: `0x${Math.random().toString(36).substr(2, 40)}`,
        status: 'submitted',
        txHash: `0x${Math.random().toString(36).substr(2, 64)}`
      },
      nearOrder: {
        orderId: `near_fusion_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        status: 'pending',
        hashlock: `0x${Math.random().toString(36).substr(2, 64)}`,
        secret: `0x${Math.random().toString(36).substr(2, 64)}`,
        expiresAt: Date.now() + (timelock || 3600) * 1000
      },
      crossChainSwapId: `cc_swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'initiated',
      estimatedTime: timelock || 3600,
      nextSteps: [
        '1. Wait for EVM order to be filled',
        '2. Execute NEAR swap using revealed secret',
        '3. Complete cross-chain transfer'
      ]
    };

    res.json({
      success: true,
      data: mockResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NEAR cross-chain swap error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute NEAR cross-chain swap'
    });
  }
});

app.get('/api/near/swap-status/:swapId', async (req, res) => {
  try {
    const { swapId } = req.params;
    
    if (!swapId) {
      return res.status(400).json({
        success: false,
        error: 'Swap ID is required'
      });
    }

    // Mock swap status
    const mockStatus = {
      swapId,
      status: 'pending',
      evmStatus: 'filled',
      nearStatus: 'pending',
      progress: Math.floor(Math.random() * 100),
      estimatedCompletion: Date.now() + 1800000, // 30 minutes
      lastUpdated: Date.now()
    };

    res.json({
      success: true,
      data: mockStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NEAR swap status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get NEAR swap status'
    });
  }
});

// Enhanced 1inch API proxy with validation
app.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Validate URL to ensure it's a 1inch API endpoint
    if (!url.startsWith('https://api.1inch.dev') && !url.startsWith('https://fusion.1inch.io')) {
      return res.status(400).json({
        success: false,
        error: 'URL must be a valid 1inch API endpoint'
      });
    }

    console.log('Proxying request to:', url);

    // Get the 1inch API key from environment
    const inchApiKey = process.env.INCH_API_KEY;
    
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Make the request to 1inch API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'UniteAI-Wallet/1.0'
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data || 'Request failed',
        status: error.response.status
      });
    } else if (error.request) {
      res.status(500).json({
        success: false,
        error: 'No response received from 1inch API'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Request setup failed'
      });
    }
  }
});

// POST proxy endpoint for 1inch API
app.post('/', async (req, res) => {
  try {
    const { url, data } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Validate URL to ensure it's a 1inch API endpoint
    if (!url.startsWith('https://api.1inch.dev') && !url.startsWith('https://fusion.1inch.io')) {
      return res.status(400).json({
        success: false,
        error: 'URL must be a valid 1inch API endpoint'
      });
    }

    console.log('Proxying POST request to:', url);

    // Get the 1inch API key from environment
    const inchApiKey = process.env.INCH_API_KEY;
    
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Make the POST request to 1inch API
    const response = await axios.post(url, data || req.body, {
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'UniteAI-Wallet/1.0'
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('POST proxy error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data || 'Request failed',
        status: error.response.status
      });
    } else if (error.request) {
      res.status(500).json({
        success: false,
        error: 'No response received from 1inch API'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Request setup failed'
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: true,
      ai: true,
      oneinch: !!process.env.INCH_API_KEY
    }
  });
});

// AI endpoints
app.post('/api/ai/process-intent', (req, res) => {
  const { intent, context } = req.body;
  
  console.log('Processing AI intent:', intent);
  
  // Mock AI processing
  const response = {
    intent: intent,
    action: 'swap',
    parameters: {
      fromToken: 'USDC',
      toToken: 'ETH',
      amount: '100',
      chain: 'ethereum'
    },
    confidence: 0.95,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: response
  });
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    status: 'active',
    agents: ['portfolio-manager', 'risk-assessor'],
    uptime: '2h 15m',
    timestamp: new Date().toISOString()
  });
});

// Enhanced 1inch API proxy endpoints
app.get('/api/1inch/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    console.log('Proxying 1inch request to:', url);

    // Get the 1inch API key from environment
    const inchApiKey = process.env.INCH_API_KEY;
    
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Make the request to 1inch API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'UniteAI-Wallet/1.0'
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('1inch proxy error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data || '1inch API request failed',
        status: error.response.status
      });
    } else if (error.request) {
      res.status(500).json({
        success: false,
        error: 'No response received from 1inch API'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || '1inch request setup failed'
      });
    }
  }
});

// Consolidated Fusion+ endpoints
app.post('/api/fusion-plus/quote', async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, chainId, userAddress } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !chainId || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const inchApiKey = process.env.INCH_API_KEY;
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Get quote from 1inch Fusion+ API
    const response = await axios.get(`https://fusion.1inch.io/quote/v1.0/${chainId}/quote`, {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: fromAmount,
        walletAddress: userAddress,
        source: '1inch',
        disableEstimate: false,
        allowPartialFill: true
      },
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Accept': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fusion+ quote error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Fusion+ quote'
    });
  }
});

app.post('/api/fusion-plus/swap', async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, toAmount, userAddress, chainId, deadline } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !toAmount || !userAddress || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const inchApiKey = process.env.INCH_API_KEY;
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Create order with 1inch Fusion+ API
    const orderResponse = await axios.post(`https://fusion.1inch.io/order/v1.0/${chainId}/order`, {
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      amount: fromAmount,
      walletAddress: userAddress,
      source: '1inch',
      disableEstimate: false,
      allowPartialFill: true,
      deadline: deadline || Math.floor(Date.now() / 1000) + 3600
    }, {
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: orderResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fusion+ swap error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute Fusion+ swap'
    });
  }
});

app.post('/api/fusion-plus/cross-chain-quote', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, fromAmount, userAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !fromAmount || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const inchApiKey = process.env.INCH_API_KEY;
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Get cross-chain quote from 1inch API
    const response = await axios.get(`https://api.1inch.dev/swap/v6.0/${fromChainId}/quote`, {
      params: {
        src: fromToken,
        dst: toToken,
        amount: fromAmount,
        from: userAddress,
        chainId: toChainId
      },
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Accept': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cross-chain quote error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cross-chain quote'
    });
  }
});

app.post('/api/fusion-plus/cross-chain-swap', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, fromAmount, toAmount, userAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const inchApiKey = process.env.INCH_API_KEY;
    if (!inchApiKey) {
      return res.status(500).json({
        success: false,
        error: '1inch API key not configured'
      });
    }

    // Execute cross-chain swap with 1inch API
    const response = await axios.post(`https://api.1inch.dev/swap/v6.0/${fromChainId}/swap`, {
      src: fromToken,
      dst: toToken,
      amount: fromAmount,
      from: userAddress,
      chainId: toChainId,
      toAmount: toAmount
    }, {
      headers: {
        'Authorization': `Bearer ${inchApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cross-chain swap error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute cross-chain swap'
    });
  }
});

// Legacy 1inch API endpoints (for backward compatibility)
app.post('/api/1inch/quote', (req, res) => {
  const { fromToken, toToken, amount, chainId } = req.body;
  
  // Mock 1inch quote response
  const mockQuote = {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount: (parseFloat(amount) * 0.99).toString(), // 1% slippage
    price: '0.99',
    gas: '0.002',
    protocols: ['Uniswap V3', '1inch Fusion+'],
    estimatedTime: 300,
    protocol: '1inch'
  };
  
  res.json({
    success: true,
    data: mockQuote,
    timestamp: new Date().toISOString()
  });
});

// Portfolio balance endpoint
app.get('/api/portfolio/balance/:address/:chainId', (req, res) => {
  const { address, chainId } = req.params;
  
  // Mock portfolio balance
  const mockBalance = {
    address,
    chainId: parseInt(chainId),
    tokens: [
      {
        symbol: 'ETH',
        balance: '2.5',
        valueUSD: '7500',
        priceUSD: '3000'
      },
      {
        symbol: 'USDC',
        balance: '5000',
        valueUSD: '5000',
        priceUSD: '1'
      }
    ],
    totalValueUSD: '12500',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockBalance
  });
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
  console.log(`🔥 Fusion+ endpoints available at http://localhost:${PORT}/api/fusion-plus/`);
  console.log(`🌐 General proxy available at http://localhost:${PORT}/?url=...`);
  console.log(`🔗 1inch proxy available at http://localhost:${PORT}/api/1inch/proxy?url=...`);
  console.log(`✅ 1inch API Key: ${process.env.INCH_API_KEY ? 'Configured' : 'NOT SET'}`);
});

module.exports = app; 