'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const { toast } = useToast()

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
          toast({
            title: "Wallet Connected",
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          })
        }
      } else {
        toast({
          title: "No Wallet Found",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress('')
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          {isConnecting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Connect Wallet</span>
            </div>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="neutral-secondary"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  )
}

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (params: any) => void) => void
      removeListener: (event: string, callback: (params: any) => void) => void
    }
  }
} 