'use client'

import { useEffect, useState } from 'react'

interface WalletActivityProps {
  walletAddress: string | null
}

interface ActivityEntry {
  signature: string
  type: 'buy' | 'sell'
  tokenMint: string
  tokenSymbol: string
  amount: number
  timestamp: number
}

const HELIUS_API_KEY =
  process.env.NEXT_PUBLIC_HELIUS_API_KEY ||
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.split('api-key=')[1] ?? '')

export default function WalletActivity({ walletAddress }: WalletActivityProps) {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchActivity() {
      if (!walletAddress || !HELIUS_API_KEY) return
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=100`
        )
        const data = await response.json()

        if (Array.isArray(data)) {
          const transfers: ActivityEntry[] = data
            .flatMap((tx: any) => {
              if (!tx.tokenTransfers || tx.type !== 'SWAP') return []
              return tx.tokenTransfers
                .filter((transfer: any) => transfer.tokenAmount && Number(transfer.tokenAmount) > 0)
                .map((transfer: any) => {
                  const isIncoming = transfer.toUserAccount === walletAddress
                  return {
                    signature: tx.signature,
                    type: isIncoming ? 'buy' : 'sell',
                    tokenMint: transfer.mint,
                    tokenSymbol: transfer.tokenSymbol || transfer.mint.slice(0, 4),
                    amount: Number(transfer.tokenAmount),
                    timestamp: tx.timestamp * 1000,
                  } as ActivityEntry
                })
            })
            .slice(0, 20)

          setActivity(transfers)
        }
      } catch (error) {
        console.error('Error fetching wallet activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [walletAddress])

  if (!walletAddress || !HELIUS_API_KEY) {
    return (
      <div className="text-center py-12 text-gray-500">
        Connect a wallet to view recent trades.
      </div>
    )
  }

  return (
    <div className="px-4">
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {loading && <span className="text-xs text-gray-400">Updating…</span>}
        </div>

        {activity.length === 0 && !loading && (
          <div className="text-sm text-gray-400">
            No recent trades detected for this wallet.
          </div>
        )}

        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
          {activity.map((entry) => (
            <div
              key={`${entry.signature}-${entry.tokenMint}-${entry.type}`}
              className="flex items-center justify-between border border-gray-800 rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <div
                  className={`text-sm font-medium ${
                    entry.type === 'buy' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {entry.type === 'buy' ? 'Buy' : 'Sell'} {entry.tokenSymbol}
                </div>
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(entry.timestamp)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {entry.amount.toFixed(4)}
                </div>
                <a
                  href={`https://solscan.io/tx/${entry.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 underline"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const minutes = Math.round(diff / (1000 * 60))
  if (minutes < 60) return rtf.format(-minutes, 'minute')

  const hours = Math.round(diff / (1000 * 60 * 60))
  if (hours < 24) return rtf.format(-hours, 'hour')

  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  return rtf.format(-days, 'day')
}

