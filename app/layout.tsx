import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'

export const metadata: Metadata = {
  title: 'TradeX - Solana Memecoin Trading (soon)',
  description: 'Solana Wallet View',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}

