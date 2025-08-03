'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  const handleConnect = () => {
    setIsConnected(!isConnected)
    toast({
      title: isConnected ? "Wallet Disconnected" : "Wallet Connected",
      description: isConnected ? "Your wallet has been disconnected" : "Successfully connected to wallet",
    })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <h1 className="text-xl font-bold text-white">UniteAI Wallet</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
              <span>•</span>
              <span>AI-Powered DeFi</span>
              <span>•</span>
              <span>Cross-Chain Swaps</span>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Multi-Chain Connected</span>
            </div>

            {/* Connect Wallet Button */}
            <Button
              onClick={handleConnect}
              variant={isConnected ? "neutral-secondary" : "default"}
              className={`${
                isConnected 
                  ? 'border-green-500 text-green-500 hover:bg-green-500/10' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              }`}
            >
              {isConnected ? 'Connected' : 'Connect Wallet'}
            </Button>

            {/* Settings Menu */}
            <Button variant="neutral-secondary" size="sm" className="text-gray-300 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 