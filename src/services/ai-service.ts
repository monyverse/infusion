import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AIIntentRequest {
  intent: string;
  context: {
    walletAddress?: string;
    chainId?: number;
    portfolio?: PortfolioData;
    preferences?: UserPreferences;
    riskTolerance?: 'low' | 'medium' | 'high';
  };
}

export interface AIIntentResponse {
  success: boolean;
  confidence: number;
  intent: string;
  action: 'swap' | 'bridge' | 'stake' | 'lend' | 'rebalance' | 'analyze' | 'unknown';
  parameters: {
    fromToken?: string;
    toToken?: string;
    amount?: string;
    fromChain?: number;
    toChain?: number;
    strategy?: string;
    timeframe?: string;
    slippage?: number;
    gasPrice?: string;
  };
  reasoning: string;
  risks: string[];
  alternatives: string[];
  estimatedTime?: string;
  estimatedCost?: string;
  timestamp: string;
}

export interface PortfolioData {
  totalValue: number;
  tokens: Array<{
    symbol: string;
    balance: number;
    value: number;
    allocation: number;
    chainId: number;
    change24h: number;
  }>;
  chains: Array<{
    chainId: number;
    value: number;
    allocation: number;
  }>;
}

export interface UserPreferences {
  preferredChains: number[];
  favoriteTokens: string[];
  maxSlippage: number;
  autoRebalance: boolean;
  riskTolerance: 'low' | 'medium' | 'high';
  notifications: {
    priceAlerts: boolean;
    portfolioUpdates: boolean;
    strategyExecutions: boolean;
  };
}

export interface AIAnalysisRequest {
  type: 'portfolio' | 'market' | 'strategy' | 'risk';
  data: any;
  timeframe?: '1h' | '1d' | '1w' | '1m' | '3m' | '1y';
}

export interface AIAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    reasoning: string;
    expectedOutcome: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    strength: number;
    significance: string;
  }>;
  timestamp: string;
}

export interface StrategyRecommendation {
  id: string;
  name: string;
  description: string;
  type: 'yield' | 'arbitrage' | 'dca' | 'rebalance' | 'hedge';
  riskLevel: 'low' | 'medium' | 'high';
  expectedAPY: number;
  minAmount: number;
  maxAmount: number;
  timeHorizon: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  requirements: string[];
  steps: Array<{
    order: number;
    action: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  risks: string[];
  benefits: string[];
  suitableFor: string[];
}

// ============================================================================
// AI SERVICE ERROR HANDLING
// ============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_AI_FEATURES === 'true';
    
    if (this.enabled) {
      this.initializeClients();
    }
  }

  private initializeClients() {
    try {
      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 30000,
        });
        console.log('✅ OpenAI client initialized');
      }

      // Initialize Anthropic
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeout: 30000,
        });
        console.log('✅ Anthropic client initialized');
      }

      if (!this.openai && !this.anthropic) {
        console.warn('⚠️ No AI providers configured. AI features will be limited.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize AI clients:', error);
      throw new AIServiceError('Failed to initialize AI services', 'INIT_ERROR', 500);
    }
  }

  // ============================================================================
  // INTENT PROCESSING
  // ============================================================================

  async processIntent(request: AIIntentRequest): Promise<AIIntentResponse> {
    if (!this.enabled) {
      return this.getMockIntentResponse(request);
    }

    try {
      const systemPrompt = this.buildIntentSystemPrompt();
      const userPrompt = this.buildIntentUserPrompt(request);

      let response: string;

      if (this.openai) {
        response = await this.processWithOpenAI(systemPrompt, userPrompt);
      } else if (this.anthropic) {
        response = await this.processWithAnthropic(systemPrompt, userPrompt);
      } else {
        return this.getMockIntentResponse(request);
      }

      return this.parseIntentResponse(response, request);
    } catch (error) {
      console.error('Error processing intent:', error);
      throw new AIServiceError(
        'Failed to process intent',
        'INTENT_PROCESSING_ERROR',
        500
      );
    }
  }

  private buildIntentSystemPrompt(): string {
    return `You are an expert DeFi assistant specializing in cross-chain operations, yield optimization, and portfolio management. 

Your role is to:
1. Analyze user intents for DeFi operations
2. Provide specific, actionable recommendations
3. Assess risks and suggest alternatives
4. Optimize for user's risk tolerance and preferences

Supported actions:
- swap: Token swapping on same chain
- bridge: Cross-chain token transfers
- stake: Token staking for rewards
- lend: Lending tokens for yield
- rebalance: Portfolio rebalancing
- analyze: Portfolio or market analysis

Supported chains:
- Ethereum (1), Polygon (137), Arbitrum (42161), Base (8453)
- Optimism (10), BSC (56), Avalanche (43114), Fantom (250)

Always respond in valid JSON format with the following structure:
{
  "confidence": 0.0-1.0,
  "action": "action_type",
  "parameters": {...},
  "reasoning": "explanation",
  "risks": ["risk1", "risk2"],
  "alternatives": ["alt1", "alt2"],
  "estimatedTime": "time estimate",
  "estimatedCost": "cost estimate"
}`;
  }

  private buildIntentUserPrompt(request: AIIntentRequest): string {
    const { intent, context } = request;
    
    let prompt = `User Intent: "${intent}"\n\n`;
    
    if (context.walletAddress) {
      prompt += `Wallet: ${context.walletAddress}\n`;
    }
    
    if (context.chainId) {
      prompt += `Current Chain: ${context.chainId}\n`;
    }
    
    if (context.portfolio) {
      prompt += `Portfolio Value: $${context.portfolio.totalValue.toLocaleString()}\n`;
      prompt += `Top Holdings: ${context.portfolio.tokens.slice(0, 5).map(t => 
        `${t.symbol} (${t.allocation.toFixed(1)}%)`
      ).join(', ')}\n`;
    }
    
    if (context.riskTolerance) {
      prompt += `Risk Tolerance: ${context.riskTolerance}\n`;
    }

    prompt += '\nPlease analyze this intent and provide a specific action plan.';
    
    return prompt;
  }

  private async processWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.openai) throw new AIServiceError('OpenAI not initialized', 'OPENAI_NOT_INITIALIZED');

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    return completion.choices[0]?.message?.content || '{}';
  }

  private async processWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.anthropic) throw new AIServiceError('Anthropic not initialized', 'ANTHROPIC_NOT_INITIALIZED');

    const completion = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    return completion.content[0]?.type === 'text' ? completion.content[0].text : '{}';
  }

  private parseIntentResponse(response: string, request: AIIntentRequest): AIIntentResponse {
    try {
      const parsed = JSON.parse(response);
      
      return {
        success: true,
        confidence: parsed.confidence || 0.8,
        intent: request.intent,
        action: parsed.action || 'unknown',
        parameters: parsed.parameters || {},
        reasoning: parsed.reasoning || 'AI analysis completed',
        risks: parsed.risks || [],
        alternatives: parsed.alternatives || [],
        estimatedTime: parsed.estimatedTime,
        estimatedCost: parsed.estimatedCost,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getMockIntentResponse(request);
    }
  }

  private getMockIntentResponse(request: AIIntentRequest): AIIntentResponse {
    const intent = request.intent.toLowerCase();
    
    let action: AIIntentResponse['action'] = 'unknown';
    let parameters: any = {};
    
    if (intent.includes('swap') || intent.includes('trade')) {
      action = 'swap';
      parameters = {
        fromToken: 'USDC',
        toToken: 'ETH',
        amount: '100',
        slippage: 1
      };
    } else if (intent.includes('bridge') || intent.includes('cross')) {
      action = 'bridge';
      parameters = {
        fromChain: 1,
        toChain: 137,
        fromToken: 'USDC',
        amount: '100'
      };
    } else if (intent.includes('stake')) {
      action = 'stake';
      parameters = {
        token: 'ETH',
        amount: '1',
        strategy: 'eth2-staking'
      };
    } else if (intent.includes('rebalance')) {
      action = 'rebalance';
      parameters = {
        strategy: 'balanced',
        targetAllocations: { ETH: 40, BTC: 30, USDC: 30 }
      };
    }

    return {
      success: true,
      confidence: 0.75,
      intent: request.intent,
      action,
      parameters,
      reasoning: 'Mock AI response based on keyword matching',
      risks: ['Market volatility', 'Smart contract risk'],
      alternatives: ['Manual execution', 'Different timing'],
      estimatedTime: '2-5 minutes',
      estimatedCost: '$5-15',
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // PORTFOLIO ANALYSIS
  // ============================================================================

  async analyzePortfolio(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.enabled) {
      return this.getMockAnalysisResponse(request);
    }

    try {
      const systemPrompt = this.buildAnalysisSystemPrompt(request.type);
      const userPrompt = this.buildAnalysisUserPrompt(request);

      let response: string;

      if (this.openai) {
        response = await this.processWithOpenAI(systemPrompt, userPrompt);
      } else if (this.anthropic) {
        response = await this.processWithAnthropic(systemPrompt, userPrompt);
      } else {
        return this.getMockAnalysisResponse(request);
      }

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw new AIServiceError(
        'Failed to analyze portfolio',
        'ANALYSIS_ERROR',
        500
      );
    }
  }

  private buildAnalysisSystemPrompt(type: string): string {
    const basePrompt = `You are an expert DeFi portfolio analyst. Provide detailed, actionable insights.`;
    
    const typeSpecific = {
      portfolio: 'Focus on asset allocation, diversification, risk assessment, and optimization opportunities.',
      market: 'Focus on market trends, sentiment analysis, and timing considerations.',
      strategy: 'Focus on yield optimization, strategy comparison, and implementation recommendations.',
      risk: 'Focus on risk assessment, mitigation strategies, and worst-case scenarios.'
    };

    return `${basePrompt} ${typeSpecific[type as keyof typeof typeSpecific] || typeSpecific.portfolio}

Respond in JSON format:
{
  "analysis": "comprehensive analysis",
  "insights": ["insight1", "insight2"],
  "recommendations": [{"action": "", "priority": "", "reasoning": "", "expectedOutcome": "", "riskLevel": ""}],
  "trends": [{"metric": "", "direction": "", "strength": 0.0-1.0, "significance": ""}]
}`;
  }

  private buildAnalysisUserPrompt(request: AIAnalysisRequest): string {
    let prompt = `Analysis Type: ${request.type}\n`;
    prompt += `Timeframe: ${request.timeframe || '1d'}\n\n`;
    prompt += `Data: ${JSON.stringify(request.data, null, 2)}`;
    
    return prompt;
  }

  private parseAnalysisResponse(response: string): AIAnalysisResponse {
    try {
      const parsed = JSON.parse(response);
      
      return {
        analysis: parsed.analysis || 'Analysis completed',
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        trends: parsed.trends || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return this.getMockAnalysisResponse({ type: 'portfolio', data: {} });
    }
  }

  private getMockAnalysisResponse(request: AIAnalysisRequest): AIAnalysisResponse {
    const analysisTypes = {
      portfolio: 'Your portfolio shows good diversification across multiple chains. Consider rebalancing to optimize risk-return profile.',
      market: 'Current market conditions suggest cautious optimism. DeFi yields are attractive but watch for volatility.',
      strategy: 'Multiple yield opportunities available. Liquid staking offers good risk-adjusted returns.',
      risk: 'Overall risk level is moderate. Smart contract risks are the primary concern for your holdings.'
    };

    return {
      analysis: analysisTypes[request.type as keyof typeof analysisTypes] || analysisTypes.portfolio,
      insights: [
        'Diversification across multiple chains reduces risk',
        'Current gas fees favor certain operations',
        'Yield opportunities exist in staking protocols'
      ],
      recommendations: [
        {
          action: 'Rebalance portfolio',
          priority: 'medium',
          reasoning: 'Optimize allocation for current market conditions',
          expectedOutcome: '5-10% improvement in risk-adjusted returns',
          riskLevel: 'low'
        }
      ],
      trends: [
        {
          metric: 'Portfolio Value',
          direction: 'up',
          strength: 0.7,
          significance: 'Positive trend over last 7 days'
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // STRATEGY RECOMMENDATIONS
  // ============================================================================

  async getStrategyRecommendations(
    portfolio: PortfolioData,
    preferences: UserPreferences
  ): Promise<StrategyRecommendation[]> {
    if (!this.enabled) {
      return this.getMockStrategies();
    }

    try {
      const prompt = this.buildStrategyPrompt(portfolio, preferences);
      
      let response: string;
      if (this.openai) {
        response = await this.processWithOpenAI(
          'You are a DeFi strategy advisor. Recommend specific, actionable strategies based on user portfolio and preferences.',
          prompt
        );
      } else {
        return this.getMockStrategies();
      }

      return this.parseStrategyResponse(response);
    } catch (error) {
      console.error('Error getting strategy recommendations:', error);
      return this.getMockStrategies();
    }
  }

  private buildStrategyPrompt(portfolio: PortfolioData, preferences: UserPreferences): string {
    return `Portfolio: $${portfolio.totalValue.toLocaleString()}
Risk Tolerance: ${preferences.riskTolerance}
Preferred Chains: ${preferences.preferredChains.join(', ')}
Auto Rebalance: ${preferences.autoRebalance}

Current Holdings:
${portfolio.tokens.map(t => `${t.symbol}: $${t.value.toLocaleString()} (${t.allocation.toFixed(1)}%)`).join('\n')}

Recommend 3-5 specific DeFi strategies.`;
  }

  private parseStrategyResponse(response: string): StrategyRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.strategies || this.getMockStrategies();
    } catch (error) {
      return this.getMockStrategies();
    }
  }

  private getMockStrategies(): StrategyRecommendation[] {
    return [
      {
        id: 'liquid-staking-eth',
        name: 'Ethereum Liquid Staking',
        description: 'Stake ETH while maintaining liquidity through liquid staking derivatives',
        type: 'yield',
        riskLevel: 'low',
        expectedAPY: 4.2,
        minAmount: 0.1,
        maxAmount: 1000,
        timeHorizon: 'Long-term (6+ months)',
        complexity: 'simple',
        requirements: ['ETH holdings', 'Ethereum mainnet access'],
        steps: [
          {
            order: 1,
            action: 'stake',
            description: 'Stake ETH through liquid staking protocol',
            parameters: { protocol: 'lido', token: 'ETH' }
          }
        ],
        risks: ['Slashing risk', 'Smart contract risk'],
        benefits: ['Passive income', 'Maintains liquidity', 'Supports network security'],
        suitableFor: ['Conservative investors', 'ETH holders', 'Long-term strategies']
      },
      {
        id: 'cross-chain-arbitrage',
        name: 'Cross-Chain Yield Arbitrage',
        description: 'Exploit yield differences across different chains',
        type: 'arbitrage',
        riskLevel: 'medium',
        expectedAPY: 8.5,
        minAmount: 1000,
        maxAmount: 50000,
        timeHorizon: 'Medium-term (1-3 months)',
        complexity: 'moderate',
        requirements: ['Multi-chain setup', 'Bridge access', 'Active monitoring'],
        steps: [
          {
            order: 1,
            action: 'bridge',
            description: 'Bridge assets to higher-yield chain',
            parameters: { fromChain: 1, toChain: 137 }
          },
          {
            order: 2,
            action: 'lend',
            description: 'Deposit in high-yield protocol',
            parameters: { protocol: 'aave', chain: 137 }
          }
        ],
        risks: ['Bridge risk', 'Impermanent loss', 'Protocol risk'],
        benefits: ['Higher yields', 'Portfolio diversification', 'Cross-chain exposure'],
        suitableFor: ['Moderate risk tolerance', 'Active traders', 'Multi-chain users']
      }
    ];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isEnabled(): boolean {
    return this.enabled;
  }

  async healthCheck(): Promise<{ status: string; providers: string[] }> {
    const providers = [];
    
    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('anthropic');
    
    return {
      status: this.enabled ? 'active' : 'disabled',
      providers
    };
  }

  // Rate limiting helper
  private async rateLimitCheck(): Promise<void> {
    // Implement rate limiting logic here
    // For now, just a simple delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let aiService: AIService | null = null;

export const getAIService = (): AIService => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

export default getAIService;