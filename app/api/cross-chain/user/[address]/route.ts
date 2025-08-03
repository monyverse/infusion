import { NextRequest, NextResponse } from 'next/server';
import { createFusionPlusL1Extension } from '../../../../../src/services/fusion-plus-l1-extension';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    const fusionExtension = createFusionPlusL1Extension();
    const userSwaps = fusionExtension.getUserSwaps(address);

    return NextResponse.json({
      success: true,
      swaps: userSwaps,
      totalSwaps: userSwaps.length,
      completedSwaps: userSwaps.filter(swap => swap.status === 'completed').length,
      failedSwaps: userSwaps.filter(swap => swap.status === 'failed').length,
      pendingSwaps: userSwaps.filter(swap => swap.status === 'initiated' || swap.status === 'source_locked' || swap.status === 'destination_locked').length
    });

  } catch (error) {
    console.error('Error getting user swaps:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user swaps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 