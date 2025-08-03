'use client'

import { WalletConnect } from '@/components/wallet-connect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppKitAccount, useAppKitNetwork, modal } from '@reown/appkit/react'

export default function TestWalletPage() {
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()

  const handleOpenModal = async () => {
    try {
      if (modal) {
        await modal.open()
      }
    } catch (error) {
      console.error('Failed to open modal:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AppKit Wallet Connection Test</CardTitle>
            <CardDescription>
              Test the AppKit wallet connection functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Connection Status</p>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            {isConnected && address && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Wallet Address</p>
                <p className="text-sm text-gray-600 font-mono">
                  {address}
                </p>
              </div>
            )}

            {isConnected && caipNetwork && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Current Network</p>
                <p className="text-sm text-gray-600">
                  {caipNetwork.name} (ID: {caipNetwork.id})
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button onClick={handleOpenModal} className="flex-1">
                Open Wallet Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Connect Component</CardTitle>
            <CardDescription>
              The floating wallet connect component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 