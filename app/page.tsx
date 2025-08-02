'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { WalletConnect } from '@/components/wallet-connect'
import { DashboardGrid } from '@/components/dashboard-grid'
import { AIAutomationDashboard } from '@/components/ai/ai-automation-dashboard'
import { MultiChainSwap } from '@/components/chains/multi-chain-swap'
import { NEARCrossChainSwap } from '@/components/chains/near-cross-chain-swap'
import { PortfolioOverview } from '@/components/portfolio/portfolio-overview'
import { TradingView } from '@/components/trading/trading-view'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { toast } = useToast()

  const handleIntentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const intent = formData.get('intent') as string

    if (!intent.trim()) {
      toast({
        title: "Error",
        description: "Please enter an intent",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/ai/process-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "AI Intent Processed",
          description: `Successfully processed: "${intent}"`,
        })
      } else {
        throw new Error(result.error || 'Failed to process intent')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process intent',
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="flex h-screen pt-16">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {activeTab === 'dashboard' && (
              <DashboardGrid />
            )}
            
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">AI Intent Processing</h2>
                  <form onSubmit={handleIntentSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="intent" className="block text-sm font-medium text-gray-300 mb-2">
                        Describe what you want to do
                      </label>
                      <textarea
                        id="intent"
                        name="intent"
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Swap 100 USDC to ETH on Ethereum, or rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Process Intent
                    </button>
                  </form>
                </div>
                
                <AIAutomationDashboard />
              </div>
            )}
            
            {activeTab === 'swap' && (
              <div className="space-y-6">
                <MultiChainSwap />
                <NEARCrossChainSwap />
              </div>
            )}
            
            {activeTab === 'portfolio' && (
              <PortfolioOverview />
            )}
            
            {activeTab === 'trading' && (
              <TradingView />
            )}
          </div>
        </main>
      </div>
      
      <WalletConnect />
    </div>
  )
} 