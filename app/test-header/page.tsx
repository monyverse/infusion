'use client'

import { Header } from '@/components/header'
import { WalletConnect } from '@/components/wallet-connect'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'

export default function TestHeaderPage() {
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header with AppKit integration */}
      <Header />
      
      {/* Main content */}
      <div className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Header Wallet Integration Test
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Connection Status */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Connection Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white">
                    Status: {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {address && (
                  <div className="text-white">
                    <span className="text-gray-300">Address: </span>
                    <span className="font-mono">{address}</span>
                  </div>
                )}
                {caipNetwork && (
                  <div className="text-white">
                    <span className="text-gray-300">Network: </span>
                    <span>{caipNetwork.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Instructions
              </h2>
              <div className="space-y-3 text-white">
                <p>1. Click the "Connect Wallet" button in the header</p>
                <p>2. Select your preferred wallet from the modal</p>
                <p>3. Approve the connection in your wallet</p>
                <p>4. Check the connection status above</p>
                <p>5. Try switching networks using the network button</p>
              </div>
            </div>
          </div>

          {/* Additional WalletConnect component for testing */}
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Additional WalletConnect Component
            </h2>
            <p className="text-gray-300 mb-4">
              This is the standalone WalletConnect component for comparison:
            </p>
            <WalletConnect />
          </div>
        </div>
      </div>
    </div>
  )
} 