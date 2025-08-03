'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Brain, 
  Zap, 
  Shield, 
  TrendingUp, 
  RefreshCw, 
  Play, 
  Pause, 
  Settings, 
  Activity,
  Wallet,
  Network,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useToast } from '../../hooks/use-toast';

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change24h: string;
  changeType: 'positive' | 'negative' | 'neutral';
  chain: string;
  icon: string;
  allocation: number;
}

interface AIStrategy {
  id: string;
  name: string;
  description: string;
  type: 'rebalancing' | 'arbitrage' | 'yield-farming' | 'risk-management';
  status: 'active' | 'paused' | 'completed' | 'failed';
  performance: {
    totalReturn: number;
    dailyReturn: number;
    riskScore: number;
    sharpeRatio: number;
  };
  lastExecuted: Date;
  nextExecution: Date;
}

interface PortfolioMetrics {
  totalValue: string;
  change24h: string;
  changeType: 'positive' | 'negative' | 'neutral';
  riskScore: number;
  diversification: number;
  volatility: number;
  sharpeRatio: number;
}

export const AIPortfolioDashboard: React.FC = () => {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  useEffect(() => {
    if (isConnected && address) {
      loadPortfolioData();
      loadAIStrategies();
      calculateMetrics();
    }
  }, [isConnected, address]);

  const loadPortfolioData = async () => {
    setIsLoading(true);
    try {
      // Mock portfolio data
      const mockPortfolio: PortfolioAsset[] = [
        {
          id: '1',
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '2.5',
          value: '$4,875.00',
          change24h: '+5.2%',
          changeType: 'positive',
          chain: 'Ethereum',
          icon: '🔷',
          allocation: 35
        },
        {
          id: '2',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '5000',
          value: '$5,000.00',
          change24h: '0.0%',
          changeType: 'neutral',
          chain: 'Polygon',
          icon: '🟣',
          allocation: 25
        },
        {
          id: '3',
          symbol: 'WBTC',
          name: 'Wrapped Bitcoin',
          balance: '0.15',
          value: '$6,750.00',
          change24h: '+2.8%',
          changeType: 'positive',
          chain: 'Arbitrum',
          icon: '🔵',
          allocation: 40
        }
      ];
      setPortfolio(mockPortfolio);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIStrategies = async () => {
    const mockStrategies: AIStrategy[] = [
      {
        id: '1',
        name: 'Smart Rebalancing',
        description: 'Automatically rebalances portfolio based on market conditions',
        type: 'rebalancing',
        status: 'active',
        performance: {
          totalReturn: 12.5,
          dailyReturn: 0.8,
          riskScore: 0.3,
          sharpeRatio: 1.8
        },
        lastExecuted: new Date(Date.now() - 3600000),
        nextExecution: new Date(Date.now() + 3600000)
      },
      {
        id: '2',
        name: 'Cross-Chain Arbitrage',
        description: 'Exploits price differences across different blockchain networks',
        type: 'arbitrage',
        status: 'active',
        performance: {
          totalReturn: 8.2,
          dailyReturn: 0.5,
          riskScore: 0.6,
          sharpeRatio: 1.2
        },
        lastExecuted: new Date(Date.now() - 1800000),
        nextExecution: new Date(Date.now() + 1800000)
      },
      {
        id: '3',
        name: 'Yield Optimization',
        description: 'Maximizes yield through DeFi protocol optimization',
        type: 'yield-farming',
        status: 'paused',
        performance: {
          totalReturn: 15.3,
          dailyReturn: 1.2,
          riskScore: 0.7,
          sharpeRatio: 1.5
        },
        lastExecuted: new Date(Date.now() - 7200000),
        nextExecution: new Date(Date.now() + 7200000)
      }
    ];
    setStrategies(mockStrategies);
  };

  const calculateMetrics = () => {
    const totalValue = portfolio.reduce((sum, asset) => {
      const value = parseFloat(asset.value.replace('$', '').replace(',', ''));
      return sum + value;
    }, 0);

    const mockMetrics: PortfolioMetrics = {
      totalValue: `$${totalValue.toLocaleString()}`,
      change24h: '+3.2%',
      changeType: 'positive',
      riskScore: 0.4,
      diversification: 0.75,
      volatility: 0.18,
      sharpeRatio: 1.6
    };
    setMetrics(mockMetrics);
  };

  const handleStrategyToggle = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: strategy.status === 'active' ? 'paused' : 'active' }
        : strategy
    ));
    
    toast({
      title: "Strategy Updated",
      description: "AI strategy status has been updated",
    });
  };

  const handleRebalance = async () => {
    setIsLoading(true);
    try {
      // Simulate rebalancing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Portfolio Rebalanced",
        description: "Your portfolio has been automatically rebalanced",
      });
      loadPortfolioData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rebalance portfolio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </CardTitle>
            <CardDescription>
              Please connect your wallet to access the AI Portfolio Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                This dashboard requires a connected wallet to display your portfolio and AI strategies.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Portfolio Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Intelligent portfolio management powered by AI
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Wallet className="w-4 h-4" />
            <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</span>
          </div>
          {caipNetwork && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Network className="w-4 h-4" />
              <span>{caipNetwork.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalValue}</div>
              <div className={`flex items-center text-xs ${metrics.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {metrics.change24h}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.riskScore * 100).toFixed(1)}%</div>
              <Progress value={metrics.riskScore * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diversification</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.diversification * 100).toFixed(1)}%</div>
              <Progress value={metrics.diversification * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Portfolio</TabsTrigger>
          <TabsTrigger value="strategies">AI Strategies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Portfolio Assets</h2>
            <Button onClick={handleRebalance} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Auto Rebalance
            </Button>
          </div>

          <div className="grid gap-4">
            {portfolio.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{asset.icon}</div>
                      <div>
                        <div className="font-semibold">{asset.symbol}</div>
                        <div className="text-sm text-gray-500">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{asset.value}</div>
                      <div className={`text-sm ${asset.changeType === 'positive' ? 'text-green-600' : asset.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                        {asset.change24h}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{asset.balance}</div>
                      <div className="text-xs text-gray-400">{asset.chain}</div>
                    </div>
                    <div className="w-20">
                      <Progress value={asset.allocation} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">{asset.allocation}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <h2 className="text-xl font-semibold">AI Strategies</h2>
          
          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        {strategy.name}
                      </CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                        {strategy.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStrategyToggle(strategy.id)}
                      >
                        {strategy.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Total Return</div>
                      <div className="font-semibold">{strategy.performance.totalReturn}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Daily Return</div>
                      <div className="font-semibold">{strategy.performance.dailyReturn}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Risk Score</div>
                      <div className="font-semibold">{(strategy.performance.riskScore * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Sharpe Ratio</div>
                      <div className="font-semibold">{strategy.performance.sharpeRatio.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last executed: {strategy.lastExecuted.toLocaleTimeString()}</span>
                      <span>Next: {strategy.nextExecution.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Portfolio Analytics</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics and charts coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">AI Settings</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Risk Tolerance</label>
                  <select className="w-full mt-1 p-2 border rounded-md bg-gray-800 border-gray-700">
                    <option>Conservative</option>
                    <option>Moderate</option>
                    <option>Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Rebalancing Frequency</label>
                  <select className="w-full mt-1 p-2 border rounded-md bg-gray-800 border-gray-700">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Slippage</label>
                  <Input type="number" placeholder="0.5" className="mt-1" />
                </div>
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 