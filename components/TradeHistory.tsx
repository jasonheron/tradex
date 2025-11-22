'use client'

import { useEffect, useState } from 'react'

interface TradeHistoryProps {
  walletAddress: string | null
  tokenMint: string
  compact?: boolean
  tokenSymbol?: string
}

interface TradeEntry {
  signature: string
  type: 'buy' | 'sell'
  amount: number
  amountUSD?: number
  timestamp: number
}

const HELIUS_API_KEY =
  process.env.NEXT_PUBLIC_HELIUS_API_KEY ||
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.split('api-key=')[1] ?? '')

export default function TradeHistory({ walletAddress, tokenMint, compact = false, tokenSymbol }: TradeHistoryProps) {
  const [trades, setTrades] = useState<TradeEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchTrades() {
      if (!walletAddress || !HELIUS_API_KEY) return
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=50`
        )
        const data = await response.json()

        if (Array.isArray(data)) {
          const parsedTrades: TradeEntry[] = data
            .flatMap((tx: any) => {
              if (!tx.tokenTransfers) return []
              return tx.tokenTransfers
                .filter((transfer: any) => transfer.mint === tokenMint)
                .map((transfer: any) => {
                  const isBuy = transfer.toUserAccount === walletAddress
                  const amountUSD = Number(transfer.tokenAmount || 0) * (transfer.tokenAmountUSD || 0)
                  return {
                    signature: tx.signature,
                    type: isBuy ? 'buy' : 'sell',
                    amount: Number(transfer.tokenAmount || 0),
                    amountUSD: amountUSD || 0,
                    timestamp: tx.timestamp * 1000,
                  } as TradeEntry
                })
            })
            .filter((entry: TradeEntry) => entry.amount > 0)
            .slice(0, 20)

          setTrades(parsedTrades)
        }
      } catch (error) {
        console.error('Error fetching trade history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [walletAddress, tokenMint])

  if (!walletAddress || !HELIUS_API_KEY) {
    return null
  }

  const formatAmountUSD = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`
    }
    return `$${amount.toFixed(2)}`
  }

  const formatTime = (timestamp: number) => {
    const minutes = Math.round((Date.now() - timestamp) / (1000 * 60))
    if (minutes < 60) return `${minutes}m`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.round(hours / 24)
    return `${days}d`
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {loading && (
          <div className="text-xs text-gray-400">Loading trades...</div>
        )}
        {trades.length === 0 && !loading && (
          <div className="text-xs text-gray-400">No trades found</div>
        )}
        {trades.map((trade) => (
          <div
            key={trade.signature}
            className={`text-xs flex items-center gap-2 ${
              trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <span className="font-semibold">{trade.type === 'buy' ? 'B' : 'S'}</span>
            <span>{tokenSymbol || 'TOKEN'}</span>
            <span>{formatAmountUSD(trade.amountUSD || trade.amount * 0.01)}</span>
            <span className="ml-auto text-gray-400">{formatTime(trade.timestamp)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trade History</h3>
        {loading && <span className="text-xs text-gray-400">Fetching…</span>}
      </div>

      {trades.length === 0 && !loading && (
        <div className="text-sm text-gray-400">
          No recent trades found for this token.
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {trades.map((trade) => (
          <div
            key={trade.signature}
            className="flex items-center justify-between border border-gray-800 rounded-lg px-3 py-2"
          >
            <div>
              <div
                className={`text-sm font-medium ${
                  trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trade.type === 'buy' ? 'Buy' : 'Sell'}
              </div>
              <div className="text-xs text-gray-500">
                {formatRelativeTime(trade.timestamp)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{trade.amount.toFixed(4)}</div>
              <a
                href={`https://solscan.io/tx/${trade.signature}`}
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

