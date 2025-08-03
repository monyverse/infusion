import { NextRequest, NextResponse } from 'next/server';
import { AgentManager } from '../../../../src/ai/agent-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput, userAddress, chainId, intent } = body;

    if (!userInput || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize agent manager
    const agentManager = new AgentManager();

    // Process the intent - pass userInput as the intent string
    const result = await agentManager.processIntent(userInput, {
      userAddress,
      chainId: chainId || 1,
      intent: intent || 'auto'
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing AI intent:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        intent: 'unknown'
      },
      { status: 500 }
    );
  }
} 