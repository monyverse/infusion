'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function TradingView() {
  const [selectedPair, setSelectedPair] = useState('ETH/USDC')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const { toast } = useToast()

  const tradingPairs = [
    { symbol: 'ETH/USDC', price: '1,864.32', change: '+2.34%', volume: '1.2B' },
    { symbol: 'BTC/USDC', price: '43,567.89', change: '-0.87%', volume: '2.8B' },
    { symbol: 'NEAR/USDC', price: '15.67', change: '+1.23%', volume: '156M' },
    { symbol: 'MATIC/USDC', price: '1.66', change: '+0.45%', volume: '89M' },
  ]

  const orderBook = {
    asks: [
      { price: '1864.50', amount: '2.45', total: '4,567.03' },
      { price: '1864.25', amount: '1.23', total: '2,293.03' },
      { price: '1864.00', amount: '3.67', total: '6,840.88' },
      { price: '1863.75', amount: '0.89', total: '1,658.74' },
      { price: '1863.50', amount: '2.12', total: '3,950.62' },
    ],
    bids: [
      { price: '1863.25', amount: '1.78', total: '3,316.59' },
      { price: '1863.00', amount: '2.34', total: '4,359.42' },
      { price: '1862.75', amount: '0.95', total: '1,769.61' },
      { price: '1862.50', amount: '3.21', total: '5,978.63' },
      { price: '1862.25', amount: '1.45', total: '2,700.26' },
    ]
  }

  const recentTrades = [
    { price: '1864.32', amount: '0.25', side: 'buy', time: '14:32:15' },
    { price: '1864.28', amount: '1.12', side: 'sell', time: '14:32:10' },
    { price: '1864.35', amount: '0.78', side: 'buy', time: '14:31:58' },
    { price: '1864.22', amount: '2.34', side: 'sell', time: '14:31:45' },
    { price: '1864.40', amount: '0.56', side: 'buy', time: '14:31:32' },
  ]

  const handlePlaceOrder = () => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Order Placed",
      description: `${side.toUpperCase()} ${amount} ${selectedPair.split('/')[0]} at ${orderType === 'market' ? 'market' : price}`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Trading Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading</h1>
            <p className="text-gray-300">Advanced trading with AI-powered insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Price</div>
              <div className="text-2xl font-bold text-white">$1,864.32</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">24h Change</div>
              <div className="text-lg font-bold text-green-400">+2.34%</div>
            </div>
          </div>
        </div>

        {/* Trading Pairs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tradingPairs.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair.symbol)}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                selectedPair === pair.symbol
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div className="text-white font-semibold">{pair.symbol}</div>
                <div className="text-lg font-bold text-white">${pair.price}</div>
                <div className={`text-sm ${pair.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {pair.change}
                </div>
                <div className="text-xs text-gray-400">Vol: ${pair.volume}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Book */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Order Book</h2>
          
          {/* Asks */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Asks</div>
            <div className="space-y-1">
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-red-400">{ask.price}</span>
                  <span className="text-gray-300">{ask.amount}</span>
                  <span className="text-gray-400">{ask.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spread */}
          <div className="text-center py-2 bg-white/5 rounded-lg mb-4">
            <div className="text-sm text-gray-400">Spread</div>
            <div className="text-white font-semibold">$0.25 (0.01%)</div>
          </div>

          {/* Bids */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Bids</div>
            <div className="space-y-1">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-400">{bid.price}</span>
                  <span className="text-gray-300">{bid.amount}</span>
                  <span className="text-gray-400">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Place Order</h2>
          
          {/* Order Type */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Order Type</div>
            <div className="flex space-x-2">
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
                  orderType === 'market'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-transparent'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
                  orderType === 'limit'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-transparent'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Side</div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSide('buy')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
                  side === 'buy'
                    ? 'bg-green-600 border-transparent text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
                  side === 'sell'
                    ? 'bg-red-600 border-transparent text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Amount ({selectedPair.split('/')[0]})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Price Input (for limit orders) */}
          {orderType === 'limit' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Price (USDC)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Total */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Total</span>
              <span className="text-white">${(parseFloat(amount) * (parseFloat(price) || 1864.32)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee</span>
              <span className="text-gray-400">$0.50</span>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            className={`w-full py-3 font-semibold ${
              side === 'buy'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.split('/')[0]}
          </Button>
        </div>

        {/* Recent Trades */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
          <div className="space-y-2">
            {recentTrades.map((trade, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className={`text-sm font-medium ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.price}
                    </div>
                    <div className="text-xs text-gray-400">{trade.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{trade.amount}</div>
                  <div className="text-xs text-gray-400">{trade.side}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Price Chart</h2>
          <div className="flex space-x-2">
            <Button variant="neutral-secondary" size="sm" className="border-white/20 text-white hover:bg-white/10">1H</Button>
            <Button variant="neutral-secondary" size="sm" className="border-white/20 text-white hover:bg-white/10">4H</Button>
            <Button variant="neutral-secondary" size="sm" className="border-white/20 text-white hover:bg-white/10">1D</Button>
            <Button variant="neutral-secondary" size="sm" className="border-white/20 text-white hover:bg-white/10">1W</Button>
          </div>
        </div>
        <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-gray-400">Chart integration coming soon</div>
            <div className="text-sm text-gray-500">TradingView or Chart.js integration</div>
          </div>
        </div>
      </div>
    </div>
  )
} 