import { NextRequest, NextResponse } from 'next/server';
import { createCrossChainCoordinator } from '@/services/cross-chain-coordinator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swapId, userAddress } = body;

    if (!swapId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const coordinator = createCrossChainCoordinator();
    
    const result = await coordinator.executeCrossChainSwap(swapId);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing cross-chain swap:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 