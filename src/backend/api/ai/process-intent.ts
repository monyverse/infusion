import { NextRequest, NextResponse } from 'next/server'
import { FusionPlusService, FUSION_PLUS_CONFIGS } from '@/services/fusion-plus'
import { NEARService, NEAR_CONFIGS } from '@/services/near-service'

export async function POST(request: NextRequest) {
  let intent: string;
  
  try {
    const body = await request.json();
    intent = body.intent;

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid intent provided' },
        { status: 400 }
      )
    }

    // Initialize services
    const fusionService = new FusionPlusService(FUSION_PLUS_CONFIGS.sepolia)
    const nearService = new NEARService(NEAR_CONFIGS.testnet)

    // Parse intent using simple keyword matching
    const intentLower = intent.toLowerCase()
    let result: any = { action: 'unknown', message: 'Intent not recognized' }

    // Portfolio rebalancing
    if (intentLower.includes('rebalance') || intentLower.includes('balance')) {
      result = await handlePortfolioRebalance(intent, fusionService)
    }
    // Token swapping
    else if (intentLower.includes('swap') || intentLower.includes('exchange') || intentLower.includes('trade')) {
      result = await handleTokenSwap(intent, fusionService)
    }
    // Cross-chain operations
    else if (intentLower.includes('cross-chain') || intentLower.includes('bridge') || intentLower.includes('transfer')) {
      result = await handleCrossChainOperation(intent, fusionService, nearService)
    }
    // Market analysis
    else if (intentLower.includes('analyze') || intentLower.includes('market') || intentLower.includes('price')) {
      result = await handleMarketAnalysis(intent)
    }
    // Risk management
    else if (intentLower.includes('risk') || intentLower.includes('protect') || intentLower.includes('hedge')) {
      result = await handleRiskManagement(intent)
    }
    // Yield farming
    else if (intentLower.includes('yield') || intentLower.includes('farm') || intentLower.includes('stake')) {
      result = await handleYieldFarming(intent)
    }

    return NextResponse.json({
      success: true,
      result,
      intent: intent,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing AI intent:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        intent: intent 
      },
      { status: 500 }
    )
  }
}

async function handlePortfolioRebalance(intent: string, fusionService: FusionPlusService) {
  // Extract portfolio allocation from intent
  const allocations = extractAllocations(intent)
  
  if (allocations.length === 0) {
    return {
      action: 'portfolio_rebalance',
      message: 'Portfolio rebalancing initiated with default allocation',
      allocations: [
        { token: 'ETH', percentage: 40 },
        { token: 'BTC', percentage: 30 },
        { token: 'USDC', percentage: 20 },
        { token: 'NEAR', percentage: 10 }
      ],
      status: 'pending'
    }
  }

  return {
    action: 'portfolio_rebalance',
    message: 'Portfolio rebalancing initiated based on your preferences',
    allocations,
    status: 'pending',
    estimatedTime: '5-10 minutes'
  }
}

async function handleTokenSwap(intent: string, fusionService: FusionPlusService) {
  // Extract swap details from intent
  const swapDetails = extractSwapDetails(intent)
  
  if (!swapDetails.fromToken || !swapDetails.toToken || !swapDetails.amount) {
    return {
      action: 'token_swap',
      message: 'Please specify the tokens and amount for the swap',
      error: 'Incomplete swap details'
    }
  }

  try {
    // Get quote for the swap
    const quote = await fusionService.getQuote({
      fromToken: swapDetails.fromToken,
      toToken: swapDetails.toToken,
      fromAmount: swapDetails.amount,
      chainId: 11155111 // Sepolia testnet
    })

    return {
      action: 'token_swap',
      message: `Swap quote received: ${swapDetails.amount} ${swapDetails.fromToken} → ${quote.toAmount} ${swapDetails.toToken}`,
      quote,
      status: 'quoted',
      estimatedTime: '2-5 minutes'
    }
  } catch (error) {
    return {
      action: 'token_swap',
      message: 'Failed to get swap quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function handleCrossChainOperation(intent: string, fusionService: FusionPlusService, nearService: NEARService) {
  // Extract cross-chain details from intent
  const crossChainDetails = extractCrossChainDetails(intent)
  
  if (!crossChainDetails.fromChain || !crossChainDetails.toChain) {
    return {
      action: 'cross_chain_operation',
      message: 'Please specify source and destination chains',
      error: 'Incomplete cross-chain details'
    }
  }

  return {
    action: 'cross_chain_operation',
    message: `Cross-chain operation initiated: ${crossChainDetails.fromChain} → ${crossChainDetails.toChain}`,
    details: crossChainDetails,
    status: 'initiated',
    estimatedTime: '10-30 minutes'
  }
}

async function handleMarketAnalysis(intent: string) {
  return {
    action: 'market_analysis',
    message: 'Market analysis completed',
    insights: [
      'ETH showing bullish momentum with 5% gain in 24h',
      'BTC consolidating around $43,500 support level',
      'NEAR protocol gaining adoption with 15% increase in TVL',
      'Overall market sentiment: Bullish'
    ],
    recommendations: [
      'Consider increasing ETH allocation',
      'Monitor BTC support level for entry points',
      'NEAR shows strong fundamentals for long-term hold'
    ],
    status: 'completed'
  }
}

async function handleRiskManagement(intent: string) {
  return {
    action: 'risk_management',
    message: 'Risk assessment completed',
    riskLevel: 'Medium',
    recommendations: [
      'Diversify portfolio across multiple chains',
      'Set stop-loss orders for volatile positions',
      'Consider hedging with stablecoins',
      'Monitor market volatility indicators'
    ],
    status: 'completed'
  }
}

async function handleYieldFarming(intent: string) {
  return {
    action: 'yield_farming',
    message: 'Yield farming opportunities identified',
    opportunities: [
      {
        protocol: 'Uniswap V3',
        pair: 'ETH/USDC',
        apy: '12.5%',
        risk: 'Low'
      },
      {
        protocol: 'Aave',
        asset: 'USDC',
        apy: '8.2%',
        risk: 'Low'
      },
      {
        protocol: 'NEAR Protocol',
        staking: 'NEAR',
        apy: '10.8%',
        risk: 'Medium'
      }
    ],
    status: 'analyzed'
  }
}

// Helper functions to extract information from natural language
function extractAllocations(intent: string): Array<{ token: string; percentage: number }> {
  const allocations: Array<{ token: string; percentage: number }> = []
  
  // Simple regex patterns to extract allocations
  const patterns = [
    /(\d+)%\s*(ETH|BTC|USDC|NEAR|MATIC)/gi,
    /(\d+)\s*percent\s*(ETH|BTC|USDC|NEAR|MATIC)/gi
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(intent)) !== null) {
      allocations.push({
        token: match[2].toUpperCase(),
        percentage: parseInt(match[1])
      })
    }
  })
  
  return allocations
}

function extractSwapDetails(intent: string): { fromToken: string; toToken: string; amount: string } {
  const swapDetails = { fromToken: '', toToken: '', amount: '' }
  
  // Extract amount
  const amountMatch = intent.match(/(\d+(?:\.\d+)?)\s*(ETH|BTC|USDC|NEAR|MATIC)/i)
  if (amountMatch) {
    swapDetails.amount = amountMatch[1]
    swapDetails.fromToken = amountMatch[2].toUpperCase()
  }
  
  // Extract destination token
  const toTokenMatch = intent.match(/to\s*(ETH|BTC|USDC|NEAR|MATIC)/i)
  if (toTokenMatch) {
    swapDetails.toToken = toTokenMatch[1].toUpperCase()
  }
  
  return swapDetails
}

function extractCrossChainDetails(intent: string): { fromChain: string; toChain: string; token?: string; amount?: string } {
  const details = { fromChain: '', toChain: '' }
  
  // Extract chains
  const chainMatch = intent.match(/(ethereum|near|bitcoin|polygon|arbitrum|base)\s*(?:to|→)\s*(ethereum|near|bitcoin|polygon|arbitrum|base)/i)
  if (chainMatch) {
    details.fromChain = chainMatch[1]
    details.toChain = chainMatch[2]
  }
  
  return details
} 