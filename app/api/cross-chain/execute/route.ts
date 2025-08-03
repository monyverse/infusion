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

    // Initiate the cross-chain swap
    const swap = await fusionExtension.initiateCrossChainSwap(swapRequest);

    // Execute the swap
    const executedSwap = await fusionExtension.executeCrossChainSwap(swap.swapId);

    return NextResponse.json({
      success: true,
      swap: executedSwap,
      swapId: executedSwap.swapId,
      status: executedSwap.status,
      transactions: executedSwap.transactions
    });

  } catch (error) {
    console.error('Error executing cross-chain swap:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute swap',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 