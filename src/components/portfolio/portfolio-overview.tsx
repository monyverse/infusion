'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Asset {
  id: string
  symbol: string
  name: string
  balance: string
  value: string
  change24h: string
  changeType: 'positive' | 'negative' | 'neutral'
  chain: string
  icon: string
}

export function PortfolioOverview() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    // Simulate loading portfolio data
    const loadPortfolio = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockAssets: Asset[] = [
          {
            id: '1',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '2.45',
            value: '$4,567.89',
            change24h: '+3.2%',
            changeType: 'positive',
            chain: 'ethereum',
            icon: '🔷'
          },
          {
            id: '2',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '1,250.00',
            value: '$1,250.00',
            change24h: '0.0%',
            changeType: 'neutral',
            chain: 'ethereum',
            icon: '💙'
          },
          {
            id: '3',
            symbol: 'NEAR',
            name: 'NEAR Protocol',
            balance: '150.75',
            value: '$2,345.67',
            change24h: '+1.8%',
            changeType: 'positive',
            chain: 'near',
            icon: '🟢'
          },
          {
            id: '4',
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: '0.125',
            value: '$3,456.78',
            change24h: '-0.5%',
            changeType: 'negative',
            chain: 'bitcoin',
            icon: '🟡'
          },
          {
            id: '5',
            symbol: 'MATIC',
            name: 'Polygon',
            balance: '500.00',
            value: '$830.33',
            change24h: '+2.1%',
            changeType: 'positive',
            chain: 'polygon',
            icon: '🟣'
          }
        ]
        
        setAssets(mockAssets)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load portfolio data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPortfolio()
  }, [toast])

  const chains = [
    { id: 'all', name: 'All Chains', icon: '🌐' },
    { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
    { id: 'near', name: 'NEAR', icon: '🟢' },
    { id: 'bitcoin', name: 'Bitcoin', icon: '🟡' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
  ]

  const filteredAssets = selectedChain === 'all' 
    ? assets 
    : assets.filter(asset => asset.chain === selectedChain)

  const totalValue = filteredAssets.reduce((sum, asset) => {
    const value = parseFloat(asset.value.replace('$', '').replace(',', ''))
    return sum + value
  }, 0)

  const totalChange24h = filteredAssets.reduce((sum, asset) => {
    const change = parseFloat(asset.change24h.replace('%', '').replace('+', '').replace('-', ''))
    return sum + change
  }, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-8 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h1>
            <p className="text-gray-300">Your assets across all supported chains</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Value</div>
            <div className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">24h Change</div>
            <div className={`text-2xl font-bold ${totalChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Assets</div>
            <div className="text-2xl font-bold text-white">{filteredAssets.length}</div>
          </div>
        </div>
      </div>

      {/* Chain Filter */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Filter by Chain</h2>
        <div className="flex flex-wrap gap-3">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                selectedChain === chain.id
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{chain.icon}</span>
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{asset.icon}</div>
                <div>
                  <h3 className="text-white font-semibold">{asset.symbol}</h3>
                  <p className="text-sm text-gray-400">{asset.name}</p>
                </div>
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded ${
                asset.changeType === 'positive' ? 'bg-green-500/20 text-green-400' :
                asset.changeType === 'negative' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {asset.change24h}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Balance</span>
                <span className="text-white font-medium">{asset.balance}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Value</span>
                <span className="text-white font-medium">{asset.value}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Chain</span>
                <span className="text-white font-medium capitalize">{asset.chain}</span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button
                variant="neutral-secondary"
                size="sm"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Send
              </Button>
              <Button
                variant="neutral-secondary"
                size="sm"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Swap
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-white mb-2">No Assets Found</h3>
          <p className="text-gray-400 mb-6">No assets found for the selected chain.</p>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Add Assets
          </Button>
        </div>
      )}
    </div>
  )
} 