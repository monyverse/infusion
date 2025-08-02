'use client';

import { useState } from 'react';
import { Wallet, Brain, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { MultiChainSwap } from '@/components/chains/multi-chain-swap';
import { NEARCrossChainSwap } from '@/components/chains/near-cross-chain-swap';
import { AIAutomationDashboard } from '@/components/ai/ai-automation-dashboard';
import { AchievementCard, Achievement } from '@/components/gamification/achievement-card';
import { ApiTest } from '@/components/ui/api-test';

export default function Home() {
  const [intent, setIntent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAchievements, setShowAchievements] = useState(false);

  const recentAchievements: Achievement[] = [
    {
      id: 'first-automated-swap',
      title: 'First Automated Swap',
      description: 'Complete your first AI-powered automated token swap',
      icon: '🤖',
      category: 'swap',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: new Date('2024-01-15'),
      xpReward: 100,
      points: 50
    },
    {
      id: 'cross-chain-master',
      title: 'Cross-Chain Master',
      description: 'Execute swaps across 10 different blockchain networks',
      icon: '🔗',
      category: 'chain',
      rarity: 'rare',
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      xpReward: 500,
      points: 250
    }
  ];

  const handleIntentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:3003/api/ai/process-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent, context: {} }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error processing intent:', error);
      setResult({ error: 'Failed to process intent' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Brain className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              UniteAI Wallet
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowAchievements(!showAchievements)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              🏆 Achievements
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
              }`}
            >
              🤖 AI Dashboard
            </button>
            <button
              onClick={() => setActiveTab('swap')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'swap'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
              }`}
            >
              🔄 Multi-Chain Swap
            </button>
            <button
              onClick={() => setActiveTab('intent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'intent'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
              }`}
            >
              💬 AI Intent
            </button>
            <button
              onClick={() => setActiveTab('near')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'near'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
              }`}
            >
              🌐 NEAR Cross-Chain
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
              }`}
            >
              🔧 API Test
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Automation Dashboard
              </h2>
              <p className="text-lg text-gray-300">
                Your intelligent wallet automation system
              </p>
            </div>
            <AIAutomationDashboard />
          </div>
        )}
        
        {activeTab === 'swap' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Multi-Chain Swap Interface
              </h2>
              <p className="text-lg text-gray-300">
                Swap tokens across 17+ blockchain networks with 1inch Fusion+ technology
              </p>
            </div>
            <MultiChainSwap />
          </div>
        )}
        
        {activeTab === 'near' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                NEAR Cross-Chain Swap
              </h2>
              <p className="text-lg text-gray-300">
                Swap tokens between EVM chains and NEAR using Fusion+ and Chain Signatures
              </p>
            </div>
            <NEARCrossChainSwap />
          </div>
        )}
        
        {activeTab === 'intent' && (
          <div className="space-y-6">
            {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI-Powered Cross-Chain Wallet Automation
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the future of DeFi with intelligent portfolio management, 
            cross-chain atomic swaps, and AI-driven trading strategies powered by 1inch Fusion+.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Automation</h3>
              <p className="text-gray-300">
                Natural language commands for complex DeFi operations and portfolio management.
              </p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cross-Chain Swaps</h3>
              <p className="text-gray-300">
                Seamless atomic swaps between Ethereum, Bitcoin, Stellar, NEAR, and Etherlink.
              </p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Security First</h3>
              <p className="text-gray-300">
                Advanced security features with AI-powered transaction validation and risk assessment.
              </p>
            </div>
          </div>
        </div>

        {/* AI Intent Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
              AI Intent Interface
            </h3>
            
            <form onSubmit={handleIntentSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe what you want to do:
                </label>
                <textarea
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g., 'Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins' or 'Swap 1 ETH to Bitcoin using atomic swap'"
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              
              <button
                type="submit"
                disabled={isProcessing || !intent.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Process Intent
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Result Display */}
            {result && (
              <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold mb-4">Result:</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Demo Examples */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold mb-6 text-center">Try These Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => setIntent("Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins")}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-colors"
            >
              <h4 className="font-semibold mb-2">Portfolio Rebalancing</h4>
              <p className="text-sm text-gray-300">
                "Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins"
              </p>
            </button>
            
            <button
              onClick={() => setIntent("Swap 1 ETH to Bitcoin using atomic swap")}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-colors"
            >
              <h4 className="font-semibold mb-2">Cross-Chain Swap</h4>
              <p className="text-sm text-gray-300">
                "Swap 1 ETH to Bitcoin using atomic swap"
              </p>
            </button>
            
            <button
              onClick={() => setIntent("Diversify my portfolio to reduce risk")}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-colors"
            >
              <h4 className="font-semibold mb-2">Risk Management</h4>
              <p className="text-sm text-gray-300">
                "Diversify my portfolio to reduce risk"
              </p>
            </button>
            
            <button
              onClick={() => setIntent("Create a limit order to buy ETH when price drops to $3000")}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-colors"
            >
              <h4 className="font-semibold mb-2">Limit Orders</h4>
              <p className="text-sm text-gray-300">
                "Create a limit order to buy ETH when price drops to $3000"
              </p>
            </button>
          </div>
            </div>
          </div>
        )}
        
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                API Testing Interface
              </h2>
              <p className="text-lg text-gray-300">
                Test the backend API endpoints and 1inch proxy functionality
              </p>
            </div>
            <ApiTest />
          </div>
        )}
      </main>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClaim={(id) => console.log('Claiming achievement:', id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-white/20">
        <div className="text-center text-gray-400">
          <p>© 2025 UniteAI Wallet. Built by Unite AI Team.</p>
          <p className="mt-2 text-sm">
            AI-Powered Cross-Chain Wallet Automation with 1inch Fusion+ Integration
          </p>
        </div>
      </footer>
    </div>
  );
} 