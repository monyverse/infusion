'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function DashboardGrid() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleQuickAction = async (action: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Action Executed",
        description: `Successfully executed: ${action}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const metrics = [
    {
      title: "Total Portfolio Value",
      value: "$12,450.67",
      change: "+2.34%",
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
    {
      title: "Active Orders",
      value: "3",
      change: "1 new",
      changeType: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: "Cross-Chain Swaps",
      value: "12",
      change: "+3 today",
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      title: "AI Strategies",
      value: "5",
      change: "2 active",
      changeType: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ]

  const quickActions = [
    {
      title: "Quick Swap",
      description: "Swap tokens instantly",
      action: "Quick Swap",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      title: "AI Rebalance",
      description: "Let AI optimize your portfolio",
      action: "AI Rebalance",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: "Cross-Chain Transfer",
      description: "Move assets between chains",
      action: "Cross-Chain Transfer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "Set Limit Order",
      description: "Create automated trading orders",
      action: "Set Limit Order",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <p className="text-gray-300">Your AI-powered DeFi dashboard is ready for action.</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Time</div>
              <div className="text-white font-mono">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                metric.changeType === 'positive' ? 'bg-green-500/20 text-green-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {metric.icon}
              </div>
              <div className={`text-sm font-medium ${
                metric.changeType === 'positive' ? 'text-green-400' :
                'text-blue-400'
              }`}>
                {metric.change}
              </div>
            </div>
            <h3 className="text-gray-300 text-sm font-medium mb-1">{metric.title}</h3>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.action)}
              disabled={isLoading}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 text-left transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                  {action.icon}
                </div>
              </div>
              <h3 className="text-white font-medium mb-1">{action.title}</h3>
              <p className="text-sm text-gray-400">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {[
              { type: "Swap", details: "ETH → USDC", amount: "+$245.00", time: "2 min ago", status: "success" },
              { type: "Transfer", details: "Cross-chain to NEAR", amount: "-$150.00", time: "15 min ago", status: "pending" },
              { type: "AI Action", details: "Portfolio Rebalance", amount: "Auto", time: "1 hour ago", status: "success" },
            ].map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="text-white font-medium">{tx.type}</div>
                    <div className="text-sm text-gray-400">{tx.details}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{tx.amount}</div>
                  <div className="text-sm text-gray-400">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">AI Insights</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-400 font-medium">Portfolio Optimized</span>
              </div>
              <p className="text-sm text-gray-300">Your portfolio has been automatically rebalanced for optimal performance.</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-400 font-medium">Market Opportunity</span>
              </div>
              <p className="text-sm text-gray-300">ETH/BTC ratio suggests a good entry point for portfolio diversification.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 