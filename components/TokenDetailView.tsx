'use client'

import { useState, useEffect } from 'react'
import { TokenPosition } from '@/hooks/usePortfolio'
import { Search, X, Link2, Settings, MoreVertical } from 'lucide-react'
import TokenChart from './TokenChart'
import TradeHistory from './TradeHistory'
import { useWallet } from '@/hooks/useWallet'
import { getTokenExtendedData } from '@/lib/jupiter'

interface TokenDetailViewProps {
  token: TokenPosition
  onBack: () => void
}

export default function TokenDetailView({ token, onBack }: TokenDetailViewProps) {
  const { walletAddress } = useWallet()
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('3M')
  const [intervalTimeframe, setIntervalTimeframe] = useState<'1 min' | '5 min' | '15 min' | '1H' | '4H' | '1D'>('5 min')
  const [extendedData, setExtendedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExtendedData() {
      setLoading(true)
      try {
        const data = await getTokenExtendedData(token.mint)
        setExtendedData(data)
      } catch (error) {
        console.error('Error fetching extended data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchExtendedData()
  }, [token.mint])

  const currentPrice = token.price || 0
  const volume24h = extendedData?.volume24h || '$0'
  const buys24h = extendedData?.buys24h || '$0'
  const sells24h = extendedData?.sells24h || '$0'
  const supply = extendedData?.supply || 'N/A'
  const liquidity = extendedData?.liquidity || 'N/A'
  const pooledBase = extendedData?.pooledBase || 'N/A'
  const pooledQuote = extendedData?.pooledQuote || 'N/A'

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2 border-b border-yellow-300/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {token.logoURI ? (
              <img
                src={token.logoURI}
                alt={token.symbol}
                className="w-8 h-8 rounded-full flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 ${token.logoURI ? 'hidden' : ''}`}>
              <span className="text-xs font-bold text-white">{token.symbol.charAt(0)}</span>
            </div>
            <span className="text-sm font-semibold text-white truncate">{token.name || token.symbol}</span>
            <span className="text-xs text-gray-400">AM</span>
          </div>
          
          {/* Chart Timeframe Selector */}
          <div className="flex items-center gap-1">
            {(['1D', '1W', '1M', '3M'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-2 py-1 text-xs font-semibold rounded transition ${
                  chartTimeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{token.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            <button className="p-1 text-gray-400 hover:text-white transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[300px] border-b border-yellow-300/20">
        <TokenChart
          mint={token.mint}
          transactions={token.transactions}
          currentPrice={currentPrice}
          timeframe={chartTimeframe}
        />
      </div>

      {/* Interactive Elements Row */}
      <div className="px-4 pt-2 pb-3 border-b border-yellow-300/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-1.5 text-gray-400 hover:text-white transition">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white transition">
              <Link2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white transition">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <select
            value={intervalTimeframe}
            onChange={(e) => setIntervalTimeframe(e.target.value as any)}
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-purple-400"
          >
            <option value="1 min">1 min</option>
            <option value="5 min">5 min</option>
            <option value="15 min">15 min</option>
            <option value="1H">1H</option>
            <option value="4H">4H</option>
            <option value="1D">1D</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 min-h-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Metrics */}
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Volume</div>
              <div className="text-sm font-semibold text-white">{volume24h}</div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">Buys/Sells</div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Buys</div>
                  <div className="text-xs text-white">{buys24h}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Sells</div>
                  <div className="text-xs text-white">{sells24h}</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="flex-1 h-2 bg-green-500 rounded"></div>
                  <div className="flex-1 h-2 bg-red-500 rounded"></div>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="flex-1 text-green-500">{buys24h}</span>
                  <span className="flex-1 text-red-500">{sells24h}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Supply</div>
              <div className="text-sm font-semibold text-white">{supply}</div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Liquidity</div>
              <div className="text-sm font-semibold text-white">{liquidity}</div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">Pooled Assets</div>
              <div className="space-y-1">
                <div className="text-xs text-white">Pooled {token.symbol}: {pooledBase}</div>
                <div className="text-xs text-white">Pooled verified:</div>
                <div className="text-xs text-white">USDC: {pooledQuote}</div>
                <div className="text-xs text-white">SOL: {pooledQuote}</div>
              </div>
            </div>
          </div>

          {/* Right Column - Trades */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Trades</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <TradeHistory walletAddress={walletAddress} tokenMint={token.mint} compact tokenSymbol={token.symbol} />
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="px-4 pb-4 pt-2 border-t border-yellow-300/20">
        <button
          onClick={onBack}
          className="w-full text-center text-white text-sm py-2 hover:text-purple-400 transition"
        >
          back
        </button>
      </div>
    </div>
  )
}

