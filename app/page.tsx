'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { DashboardGrid } from '@/components/dashboard-grid'
import { MultiChainSwap } from '@/components/chains/multi-chain-swap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [aiIntent, setAiIntent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAICommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiIntent.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/ai/process-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent: aiIntent }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('AI Response:', result)
        setAiIntent('')
      }
    } catch (error) {
      console.error('Error processing AI intent:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="page-container min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardGrid />}
          {activeTab === 'swap' && <MultiChainSwap />}
          {activeTab === 'ai' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI-Powered DeFi Assistant
                  </CardTitle>
                  <CardDescription>
                    Use natural language to execute complex DeFi operations across multiple chains
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAICommand} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-intent">What would you like to do?</Label>
                      <Input
                        id="ai-intent"
                        placeholder="e.g., 'Swap 100 USDC to ETH on Ethereum and bridge 50% to Polygon'"
                        value={aiIntent}
                        onChange={(e) => setAiIntent(e.target.value)}
                        className="h-20 resize-none"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isProcessing || !aiIntent.trim()}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Execute AI Command'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Rebalancing</CardTitle>
                    <CardDescription>
                      Automatically rebalance your portfolio across multiple chains
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="neutral-secondary" className="w-full">
                      Start Rebalancing
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Yield Farming</CardTitle>
                    <CardDescription>
                      Find and execute the best yield farming opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="neutral-secondary" className="w-full">
                      Find Opportunities
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Management</CardTitle>
                    <CardDescription>
                      Set up automated risk management strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="neutral-secondary" className="w-full">
                      Configure Strategy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 