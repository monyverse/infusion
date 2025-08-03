'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  AppKitConnectButton, 
  AppKitAccountButton, 
  AppKitNetworkButton,
  useAppKitAccount,
  useAppKitNetwork
} from '@reown/appkit/react'
import { modal } from '@reown/appkit/react'

export function HeaderWallet() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      if (modal) {
        await modal.open()
        toast({
          title: "Wallet Modal Opened",
          description: "Please select your wallet to connect",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to open wallet modal",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (modal) {
        await modal.disconnect()
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
        })
      }
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <AppKitConnectButton
        size="md"
        label={isConnecting ? "Connecting..." : "Connect Wallet"}
        loadingLabel="Connecting..."
      />
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Network Status */}
      <div className="hidden sm:flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-gray-300">
          {caipNetwork ? caipNetwork.name : 'Connected'}
        </span>
      </div>

      {/* Wallet Address */}
      <div className="hidden md:flex items-center space-x-2">
        <span className="text-white text-sm font-medium">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
      </div>

      {/* Network and Account Buttons */}
      <div className="flex items-center space-x-1">
        <AppKitNetworkButton />
        <AppKitAccountButton />
      </div>
    </div>
  )
} 