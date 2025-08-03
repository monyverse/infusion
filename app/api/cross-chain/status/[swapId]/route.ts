import { NextRequest, NextResponse } from 'next/server';
import { createFusionPlusL1Extension } from '../../../../../src/services/fusion-plus-l1-extension';

export async function GET(
  request: NextRequest,
  { params }: { params: { swapId: string } }
) {
  try {
    const { swapId } = params;

    if (!swapId) {
      return NextResponse.json(
        { error: 'Swap ID is required' },
        { status: 400 }
      );
    }

    const fusionExtension = createFusionPlusL1Extension();
    const swapStatus = fusionExtension.getSwapStatus(swapId);

    if (!swapStatus) {
      return NextResponse.json(
        { error: 'Swap not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      swap: swapStatus
    });

  } catch (error) {
    console.error('Error getting swap status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get swap status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 