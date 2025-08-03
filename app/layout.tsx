import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppkitProvider } from '@/components/appkit-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UniteAI Wallet - AI-Powered Cross-Chain DeFi',
  description: 'Revolutionary DeFi platform combining AI with cross-chain atomic swaps across 17+ blockchain networks',
  authors: [{ name: 'UniteAI Wallet Team' }],
  keywords: ['DeFi', 'AI', 'Cross-Chain', 'Bitcoin', 'Ethereum', 'NEAR', 'Solana', 'Atomic Swaps'],
  openGraph: {
    title: 'UniteAI Wallet - AI-Powered Cross-Chain DeFi',
    description: 'Revolutionary DeFi platform combining AI with cross-chain atomic swaps',
    url: 'https://uniteai.wallet',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniteAI Wallet - AI-Powered Cross-Chain DeFi',
    description: 'Revolutionary DeFi platform combining AI with cross-chain atomic swaps',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppkitProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              {children}
            </div>
            <Toaster />
          </AppkitProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 