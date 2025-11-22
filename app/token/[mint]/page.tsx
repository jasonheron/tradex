'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { getTokenInfo, getTokenPrice } from '@/lib/jupiter'
import TokenChart from '@/components/TokenChart'
import TradingPanel from '@/components/TradingPanel'
import TradeHistory from '@/components/TradeHistory'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { TokenPosition } from '@/hooks/usePortfolio'

export default function TokenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { walletAddress, mode } = useWallet()
  const mint = params.mint as string
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [price, setPrice] = useState(0)
  const [position, setPosition] = useState<TokenPosition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTokenData() {
      setLoading(true)
      try {
        const info = await getTokenInfo(mint)
        const priceData = await getTokenPrice(mint)
        setTokenInfo(info)
        setPrice(priceData.price)

        // Get position from wallet (simplified - in production, fetch from portfolio hook)
        // This would ideally come from the portfolio context
      } catch (error) {
        console.error('Error loading token data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mint) {
      loadTokenData()
    }
  }, [mint])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Token not found</div>
      </div>
    )
  }

  // Mock position data (in production, get from portfolio context)
  const mockPosition: TokenPosition = {
    mint,
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    balance: 1000,
    decimals: tokenInfo.decimals,
    price,
    value: 1000 * price,
    logoURI: tokenInfo.logoURI,
    allTimePnL: 100,
    allTimePnLPercent: 10.8,
    transactions: [
      { type: 'buy', amount: 500, price: price * 0.9, timestamp: Date.now() - 86400000 },
      { type: 'buy', amount: 500, price: price * 0.95, timestamp: Date.now() - 43200000 },
    ],
  }

  const avgBuyPrice = mockPosition.transactions
    .filter((t) => t.type === 'buy')
    .reduce((sum, t) => sum + t.price, 0) / mockPosition.transactions.filter((t) => t.type === 'buy').length

  const avgSellPrice = mockPosition.transactions
    .filter((t) => t.type === 'sell')
    .reduce((sum, t) => sum + t.price, 0) / (mockPosition.transactions.filter((t) => t.type === 'sell').length || 1)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        <div className="px-4 pt-12 pb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            {tokenInfo.logoURI ? (
              <img
                src={tokenInfo.logoURI}
                alt={tokenInfo.symbol}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-lg font-bold">
                  {tokenInfo.symbol.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{tokenInfo.symbol}</h1>
              <p className="text-gray-400 text-sm">{tokenInfo.name}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-3xl font-bold mb-2">
              ${price.toFixed(6)}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-400">Avg Buy: </span>
                <span className="text-green-500">${avgBuyPrice.toFixed(6)}</span>
              </div>
              {avgSellPrice > 0 && (
                <div>
                  <span className="text-gray-400">Avg Exit: </span>
                  <span className="text-red-500">${avgSellPrice.toFixed(6)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <TokenChart
          mint={mint}
          transactions={mockPosition.transactions}
          currentPrice={price}
        />

        {mode === 'trade' && (
          <div className="px-4 mt-6">
            <TradingPanel tokenMint={mint} tokenInfo={tokenInfo} />
          </div>
        )}

        <div className="px-4">
          <TradeHistory walletAddress={walletAddress} tokenMint={mint} />
        </div>

        <div className="px-4 mt-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Transactions</h2>
          <div className="space-y-2">
            {mockPosition.transactions.map((tx, idx) => (
              <div
                key={idx}
                className="bg-gray-900 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {tx.type === 'buy' ? (
                    <ArrowUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium capitalize">{tx.type}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{tx.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">
                    @ ${tx.price.toFixed(6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

