import { NextRequest, NextResponse } from 'next/server';
import { createCrossChainCoordinator } from '@/services/cross-chain-coordinator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromChain, toChain, fromToken, toToken, fromAmount, userAddress, recipientAddress, timelock } = body;

    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const coordinator = createCrossChainCoordinator();
    
    const swapStatus = await coordinator.initiateCrossChainSwap({
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      userAddress,
      recipientAddress,
      timelock
    });

    return NextResponse.json({
      success: true,
      swapStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error initiating cross-chain swap:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 