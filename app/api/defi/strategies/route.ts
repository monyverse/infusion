import { NextRequest, NextResponse } from 'next/server';
import { createFusionPlusL1Extension, StrategyParams } from '../../../../src/services/fusion-plus-l1-extension';

export async function GET(request: NextRequest) {
  try {
    const fusionExtension = createFusionPlusL1Extension();
    const strategies = await fusionExtension.getAvailableStrategies();

    return NextResponse.json({
      success: true,
      strategies: strategies.map(strategy => ({
        name: strategy.name,
        description: strategy.description,
        riskLevel: strategy.riskLevel,
        expectedAPY: strategy.expectedAPY,
        minLockPeriod: strategy.minLockPeriod,
        maxLockPeriod: strategy.maxLockPeriod,
        supportedChains: strategy.supportedChains,
        supportedTokens: strategy.supportedTokens
      }))
    });

  } catch (error) {
    console.error('Error getting DeFi strategies:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get strategies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      strategyName,
      userAddress,
      amount,
      token,
      chain,
      duration,
      riskTolerance = 'medium'
    } = body;

    // Validate required fields
    if (!strategyName || !userAddress || !amount || !token || !chain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fusionExtension = createFusionPlusL1Extension();

    const params: StrategyParams = {
      userAddress,
      amount,
      token,
      chain,
      duration: duration || 30 * 24 * 60 * 60, // 30 days default
      riskTolerance
    };

    const result = await fusionExtension.executeDeFiStrategy(strategyName, params);

    return NextResponse.json({
      success: true,
      result,
      strategyName,
      userAddress,
      amount,
      token,
      chain
    });

  } catch (error) {
    console.error('Error executing DeFi strategy:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute strategy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 