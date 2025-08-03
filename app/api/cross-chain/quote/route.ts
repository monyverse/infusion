import { NextRequest, NextResponse } from 'next/server';
import { createFusionPlusL1Extension, CrossChainSwapRequest } from '../../../../src/services/fusion-plus-l1-extension';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      userAddress,
      slippageTolerance = 0.5,
      strategy = 'atomic'
    } = body;

    // Validate required fields
    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize the fusion extension
    const fusionExtension = createFusionPlusL1Extension();

    // Create the swap request
    const swapRequest: CrossChainSwapRequest = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      userAddress,
      slippageTolerance,
      strategy
    };

    // Get the quote
    const quote = await fusionExtension.getCrossChainQuote(swapRequest);

    return NextResponse.json({
      success: true,
      quote,
      request: swapRequest
    });

  } catch (error) {
    console.error('Error getting cross-chain quote:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 