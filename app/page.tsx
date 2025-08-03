'use client'

import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { DashboardGrid } from '@/components/dashboard-grid'
import { AIPortfolioDashboard } from '@/components/dashboard/ai-portfolio-dashboard'
import { MultiChainSwap } from '@/components/chains/multi-chain-swap'
import { NEARCrossChainSwap } from '@/components/chains/near-cross-chain-swap'
import { PortfolioOverview } from '@/components/portfolio/portfolio-overview'
import { TradingView } from '@/components/trading/trading-view'
import { AIAutomationDashboard } from '@/components/ai/ai-automation-dashboard'
import { AchievementCard } from '@/components/gamification/achievement-card'
import { Toaster } from '@/components/ui/toaster'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-20 px-6 pb-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center py-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              UniteAI Wallet
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary DeFi platform combining AI with cross-chain atomic swaps across 17+ blockchain networks
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                Start Trading
              </button>
              <button className="border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
                Learn More
              </button>
            </div>
          </div>

          {/* AI Portfolio Dashboard */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <AIPortfolioDashboard />
          </div>

          {/* Multi-Chain Swap */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Cross-Chain Swaps</h2>
            <MultiChainSwap />
          </div>

          {/* NEAR Cross-Chain Integration */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">NEAR Cross-Chain Integration</h2>
            <NEARCrossChainSwap />
          </div>

          {/* Portfolio Overview */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio Overview</h2>
            <PortfolioOverview />
          </div>

          {/* Trading View */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Trading Analytics</h2>
            <TradingView />
          </div>

          {/* AI Automation Dashboard */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">AI Automation</h2>
            <AIAutomationDashboard />
          </div>

          {/* Dashboard Grid */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <DashboardGrid />
          </div>

          {/* Gamification */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AchievementCard
                achievement={{
                  id: '1',
                  title: 'First Swap',
                  description: 'Complete your first cross-chain swap',
                  icon: '🔄',
                  category: 'swap',
                  rarity: 'common',
                  progress: 1,
                  maxProgress: 1,
                  unlocked: true,
                  unlockedAt: new Date(),
                  xpReward: 100,
                  points: 50
                }}
              />
              <AchievementCard
                achievement={{
                  id: '2',
                  title: 'Multi-Chain Explorer',
                  description: 'Use 5 different blockchain networks',
                  icon: '🌐',
                  category: 'chain',
                  rarity: 'rare',
                  progress: 3,
                  maxProgress: 5,
                  unlocked: false,
                  xpReward: 500,
                  points: 250
                }}
              />
              <AchievementCard
                achievement={{
                  id: '3',
                  title: 'AI Strategist',
                  description: 'Execute 10 AI-powered strategies',
                  icon: '🤖',
                  category: 'social',
                  rarity: 'epic',
                  progress: 7,
                  maxProgress: 10,
                  unlocked: false,
                  xpReward: 1000,
                  points: 500
                }}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Toaster />
    </div>
  )
} 