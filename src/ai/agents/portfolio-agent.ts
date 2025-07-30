import { BaseAgent } from './base-agent';
import { AgentConfig, PortfolioAllocation, RebalancingStrategy, RiskProfile } from '@/types/ai';
import { OneInchAPI } from '@/utils/1inch-api';

export class PortfolioManagerAgent extends BaseAgent {
  private oneInchAPI: OneInchAPI;

  constructor(config: AgentConfig) {
    super(config);
    this.oneInchAPI = new OneInchAPI();
  }

  /**
   * Rebalance portfolio according to target allocation
   */
  async rebalance(strategy: RebalancingStrategy): Promise<any> {
    this.logActivity('Starting portfolio rebalancing', strategy);

    try {
      // Get current portfolio state
      const currentAllocation = await this.getCurrentAllocation();
      
      // Calculate required trades
      const trades = this.calculateRebalancingTrades(currentAllocation, strategy.targetAllocation);
      
      // Execute trades with gas optimization
      const results = await this.executeRebalancingTrades(trades, strategy);
      
      this.logActivity('Portfolio rebalancing completed', { results });
      return results;
    } catch (error) {
      this.handleError(error, 'portfolio rebalancing');
      throw error;
    }
  }

  /**
   * Get current portfolio allocation across all chains
   */
  private async getCurrentAllocation(): Promise<PortfolioAllocation> {
    const allocation: PortfolioAllocation = {};
    
    // Get balances from all supported chains
    for (const [chainName, chainConfig] of this.chainConfigs) {
      try {
        const balances = await this.getChainBalances(chainName);
        for (const [token, balance] of Object.entries(balances)) {
          const value = await this.getTokenValue(token, balance, chainName);
          allocation[token] = (allocation[token] || 0) + value;
        }
      } catch (error) {
        this.logger.warn(`Failed to get balances for ${chainName}: ${error}`);
      }
    }

    // Normalize to percentages
    const totalValue = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    if (totalValue > 0) {
      for (const token in allocation) {
        allocation[token] = allocation[token] / totalValue;
      }
    }

    return allocation;
  }

  /**
   * Calculate required trades to reach target allocation
   */
  private calculateRebalancingTrades(
    current: PortfolioAllocation, 
    target: PortfolioAllocation
  ): any[] {
    const trades = [];
    const threshold = 0.05; // 5% threshold for rebalancing

    for (const [token, targetAllocation] of Object.entries(target)) {
      const currentAllocation = current[token] || 0;
      const difference = targetAllocation - currentAllocation;

      if (Math.abs(difference) > threshold) {
        trades.push({
          token,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference),
          priority: Math.abs(difference) > 0.1 ? 1 : 2, // Higher priority for larger differences
        });
      }
    }

    return trades.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute rebalancing trades with gas optimization
   */
  private async executeRebalancingTrades(trades: any[], strategy: RebalancingStrategy): Promise<any[]> {
    const results = [];

    for (const trade of trades) {
      try {
        // Find best route for the trade
        const route = await this.findOptimalRoute(trade);
        
        if (route) {
          // Execute the trade
          const result = await this.executeTrade(route, strategy.maxSlippage);
          results.push({ trade, route, result, success: true });
        } else {
          results.push({ trade, success: false, error: 'No route found' });
        }
      } catch (error) {
        results.push({ trade, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Find optimal route for a trade across all chains
   */
  private async findOptimalRoute(trade: any): Promise<any> {
    const routes = [];

    // Check routes on each chain
    for (const [chainName, chainConfig] of this.chainConfigs) {
      try {
        const route = await this.oneInchAPI.getSwapQuote({
          chain: chainName,
          tokenIn: trade.action === 'buy' ? 'USDC' : trade.token,
          tokenOut: trade.action === 'buy' ? trade.token : 'USDC',
          amount: trade.amount.toString(),
        });

        if (route) {
          routes.push({
            ...route,
            chain: chainName,
            estimatedCost: route.gasCost + route.priceImpact,
          });
        }
      } catch (error) {
        this.logger.debug(`No route found on ${chainName}: ${error}`);
      }
    }

    // Return the route with lowest cost
    return routes.sort((a, b) => a.estimatedCost - b.estimatedCost)[0];
  }

  /**
   * Execute a trade using 1inch API
   */
  private async executeTrade(route: any, maxSlippage: number): Promise<any> {
    try {
      const swapResult = await this.oneInchAPI.executeSwap({
        ...route,
        slippage: maxSlippage,
        recipient: this.config.walletAddress,
      });

      this.logSwap(swapResult);
      return swapResult;
    } catch (error) {
      this.logger.error(`Trade execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get token balances for a specific chain
   */
  private async getChainBalances(chainName: string): Promise<Record<string, string>> {
    // This would typically call the chain's RPC to get balances
    // For now, return mock data
    return {
      'ETH': '1.5',
      'USDC': '1000',
      'WBTC': '0.05',
    };
  }

  /**
   * Get USD value of a token amount
   */
  private async getTokenValue(token: string, amount: string, chainName: string): Promise<number> {
    try {
      const price = await this.oneInchAPI.getTokenPrice(token, chainName);
      return parseFloat(amount) * price;
    } catch (error) {
      this.logger.warn(`Failed to get price for ${token}: ${error}`);
      return 0;
    }
  }

  /**
   * Implement abstract method from BaseAgent
   */
  protected async executeAction(action: any): Promise<any> {
    switch (action.action_type) {
      case 'rebalance':
        return await this.rebalance(action.parameters);
      case 'risk_check':
        return await this.performRiskCheck(action.parameters);
      case 'diversify':
        return await this.diversifyPortfolio(action.parameters);
      default:
        throw new Error(`Unknown action type: ${action.action_type}`);
    }
  }

  /**
   * Perform risk assessment on current portfolio
   */
  private async performRiskCheck(riskProfile: RiskProfile): Promise<any> {
    const currentAllocation = await this.getCurrentAllocation();
    
    // Calculate risk metrics
    const volatility = this.calculateVolatility(currentAllocation);
    const diversification = this.calculateDiversification(currentAllocation);
    const concentration = this.calculateConcentration(currentAllocation);

    const riskLevel = this.assessRiskLevel(volatility, diversification, concentration, riskProfile);

    return {
      riskLevel,
      metrics: {
        volatility,
        diversification,
        concentration,
      },
      recommendations: this.generateRiskRecommendations(riskLevel, currentAllocation),
    };
  }

  /**
   * Diversify portfolio to reduce risk
   */
  private async diversifyPortfolio(targetDiversification: number): Promise<any> {
    const currentAllocation = await this.getCurrentAllocation();
    const currentDiversification = this.calculateDiversification(currentAllocation);

    if (currentDiversification >= targetDiversification) {
      return { message: 'Portfolio already sufficiently diversified' };
    }

    // Generate diversification strategy
    const diversificationTrades = this.generateDiversificationTrades(
      currentAllocation,
      targetDiversification
    );

    // Execute diversification trades
    return await this.executeRebalancingTrades(diversificationTrades, {
      targetAllocation: {},
      rebalanceThreshold: 0.02,
      maxSlippage: 0.5,
      gasOptimization: true,
    });
  }

  /**
   * Calculate portfolio volatility
   */
  private calculateVolatility(allocation: PortfolioAllocation): number {
    // Simplified volatility calculation
    const weights = Object.values(allocation);
    return Math.sqrt(weights.reduce((sum, weight) => sum + weight * weight, 0));
  }

  /**
   * Calculate portfolio diversification score
   */
  private calculateDiversification(allocation: PortfolioAllocation): number {
    const weights = Object.values(allocation);
    const n = weights.length;
    if (n === 0) return 0;
    
    // Herfindahl-Hirschman Index (inverted)
    const hhi = weights.reduce((sum, weight) => sum + weight * weight, 0);
    return 1 - hhi;
  }

  /**
   * Calculate portfolio concentration
   */
  private calculateConcentration(allocation: PortfolioAllocation): number {
    const weights = Object.values(allocation);
    return Math.max(...weights);
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(
    volatility: number,
    diversification: number,
    concentration: number,
    riskProfile: RiskProfile
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Volatility contribution
    if (volatility > 0.3) riskScore += 3;
    else if (volatility > 0.2) riskScore += 2;
    else if (volatility > 0.1) riskScore += 1;

    // Diversification contribution
    if (diversification < 0.3) riskScore += 3;
    else if (diversification < 0.5) riskScore += 2;
    else if (diversification < 0.7) riskScore += 1;

    // Concentration contribution
    if (concentration > 0.5) riskScore += 3;
    else if (concentration > 0.3) riskScore += 2;
    else if (concentration > 0.2) riskScore += 1;

    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Generate risk mitigation recommendations
   */
  private generateRiskRecommendations(riskLevel: string, allocation: PortfolioAllocation): string[] {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('Consider reducing portfolio concentration');
      recommendations.push('Increase diversification across asset classes');
      recommendations.push('Implement stop-loss orders for volatile assets');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor portfolio performance closely');
      recommendations.push('Consider rebalancing to target allocation');
    } else {
      recommendations.push('Portfolio risk level is acceptable');
      recommendations.push('Continue with current strategy');
    }

    return recommendations;
  }

  /**
   * Generate trades for diversification
   */
  private generateDiversificationTrades(
    currentAllocation: PortfolioAllocation,
    targetDiversification: number
  ): any[] {
    // Simplified diversification strategy
    const trades = [];
    const tokens = Object.keys(currentAllocation);
    
    // Reduce concentration in largest holdings
    const sortedTokens = tokens.sort((a, b) => currentAllocation[b] - currentAllocation[a]);
    
    for (let i = 0; i < Math.min(3, sortedTokens.length); i++) {
      const token = sortedTokens[i];
      if (currentAllocation[token] > 0.3) {
        trades.push({
          token,
          action: 'sell',
          amount: currentAllocation[token] - 0.25, // Reduce to 25%
          priority: 1,
        });
      }
    }

    return trades;
  }
} 