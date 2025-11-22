'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { usePortfolio, TokenPosition } from '@/hooks/usePortfolio'
import TokenList from './TokenList'
import PortfolioHeader from './PortfolioHeader'
import WalletActivity from './WalletActivity'
import TokenDetailView from './TokenDetailView'
import { Search, Filter } from 'lucide-react'

export default function PortfolioView() {
  const { walletAddress, mode } = useWallet()
  const {
    positions,
    totalValue,
    totalValueInSOL,
    dailyChange,
    loading,
    error,
    solPriceUSD,
  } = usePortfolio()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens')
  const [selectedToken, setSelectedToken] = useState<TokenPosition | null>(null)

  const filteredPositions = positions.filter(
    (pos) =>
      pos.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    // Clear selection if selected token is no longer in filtered positions
    if (selectedToken && !filteredPositions.find((p) => p.mint === selectedToken.mint)) {
      setSelectedToken(null)
    }
  }, [filteredPositions, selectedToken])


  return (
    <div className="min-h-screen bg-[#fff65a] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-black text-white rounded-[36px] shadow-2xl border border-yellow-200/40 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-purple-500 text-black font-mono tracking-[0.3em] text-xs text-center py-2">
          {mode === 'trade' ? 'TRADING MODE' : 'MONITOR MODE'}
        </div>
        
        {!selectedToken && (
          <PortfolioHeader
            totalValue={totalValue}
            totalValueInSOL={totalValueInSOL}
            solPriceUSD={solPriceUSD}
            dailyChange={dailyChange}
          />
        )}

        {activeTab === 'tokens' ? (
          selectedToken ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <TokenDetailView
                token={selectedToken}
                onBack={() => setSelectedToken(null)}
              />
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading portfolio...</div>
              ) : error ? (
                <div className="px-4">
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 text-yellow-400 space-y-3">
                    <div className="font-semibold">⚠️ RPC Connection Issue</div>
                    <div className="text-sm">{error}</div>
                    <div className="text-xs text-yellow-500 space-y-1">
                      <p>To fix this, set up your own RPC endpoint:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>
                          Get a free RPC endpoint from{' '}
                          <a
                            href="https://www.helius.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Helius
                          </a>{' '}
                          or{' '}
                          <a
                            href="https://quicknode.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            QuickNode
                          </a>
                        </li>
                        <li>
                          Add{' '}
                          <code className="bg-yellow-900/30 px-1 rounded">
                            NEXT_PUBLIC_SOLANA_RPC_URL=your_endpoint_url
                          </code>{' '}
                          to your{' '}
                          <code className="bg-yellow-900/30 px-1 rounded">.env.local</code> file
                        </li>
                        <li>Restart the dev server</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <TokenList
                  positions={filteredPositions}
                  onTokenClick={(token) => setSelectedToken(token)}
                />
              )}
            </div>
          )
        ) : (
          <WalletActivity walletAddress={walletAddress} />
        )}

        {!selectedToken && (
          <div className="px-4 pt-2 pb-2 border-t border-yellow-300/20 mt-4">
          <div className="flex items-center mb-2 gap-2">
            <div className="flex flex-1 justify-between text-sm font-semibold">
              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex-1 text-center ${
                  activeTab === 'tokens'
                    ? 'text-purple-400'
                    : 'text-gray-500'
                }`}
              >
                Tokens
              </button>
              <button
                onClick={() => {
                  setActiveTab('activity')
                  setShowSearch(false)
                }}
                className={`flex-1 text-center ${
                  activeTab === 'activity'
                    ? 'text-purple-400'
                    : 'text-gray-500'
                }`}
              >
                Activity
              </button>
            </div>
            {activeTab === 'tokens' && (
              <button
                onClick={() => setShowSearch((prev) => !prev)}
                className="p-2 text-gray-300 hover:text-white transition ml-2"
                title="Search tokens"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeTab === 'tokens' && showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Filter className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
        )}
      </div>
      <span className="font-mono font-bold tracking-wide text-xs text-black mt-4">
        TRADEFI.MEME
      </span>
    </div>
  )
}

