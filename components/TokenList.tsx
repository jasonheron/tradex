'use client'

import { useState } from 'react'
import { TokenPosition } from '@/hooks/usePortfolio'
import { ArrowUp, ArrowDown, Check } from 'lucide-react'

interface TokenListProps {
  positions: TokenPosition[]
  onTokenClick: (position: TokenPosition) => void
}

export default function TokenList({ positions, onTokenClick }: TokenListProps) {
  const [marketMetric, setMarketMetric] = useState<'mc' | 'fdv'>('mc')

  if (positions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-gray-400 mb-2">No tokens found.</div>
        <div className="text-xs text-gray-500">
          {positions.length === 0 ? 'This wallet may not have any token positions, or there may be an RPC connection issue.' : 'Your positions will appear here.'}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-1 pb-4">
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] text-[11px] uppercase tracking-widest text-gray-500 px-2 pt-3 pb-2">
        <span></span>
        <span className="justify-self-end text-right w-[110px]">Position</span>
        <span className="justify-self-end text-right w-[110px]">P&amp;L</span>
      </div>

      {positions.map((position) => (
        <div
          key={position.mint}
          onClick={() => onTokenClick(position)}
          className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 items-center cursor-pointer hover:opacity-80 transition-opacity py-3 border-b border-white/5 last:border-b-0 last:pb-2"
        >
          {/* Token Info Column */}
          <div className="flex items-center gap-3 min-w-0">
            {position.logoURI ? (
              <img
                src={position.logoURI}
                alt={position.symbol}
                className="w-10 h-10 rounded-full flex-shrink-0"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 ${position.logoURI ? 'hidden' : ''}`}>
              <span className="text-xs font-bold">
                {position.symbol.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white">{position.symbol}</span>
                <Check className="w-3 h-3 text-purple-500 flex-shrink-0" />
              </div>
              <button
                className="text-xs text-gray-400 flex items-center gap-1 hover:text-white focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setMarketMetric((prev) => (prev === 'mc' ? 'fdv' : 'mc'))
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {marketMetric === 'mc' ? 'MC' : 'FDV'}:{' '}
                <span className="text-white">
                  {marketMetric === 'mc'
                    ? position.marketCap || 'N/A'
                    : position.fdv || position.marketCap || 'N/A'}
                </span>
              </button>
            </div>
          </div>

          {/* Position Column */}
          <div className="justify-self-end text-right w-[110px]">
            <div className="text-base font-semibold text-white tracking-tight">
              ${position.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {position.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* P&L Column */}
          <div className="justify-self-end text-right w-[110px]">
            <div className={`text-base font-semibold tracking-tight ${position.allTimePnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {`${position.allTimePnL >= 0 ? '' : '-'}$${Math.abs(position.allTimePnL).toFixed(2)}`}
            </div>
            <div className={`text-xs flex items-center justify-end gap-1 ${position.allTimePnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {position.allTimePnLPercent >= 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {position.allTimePnLPercent >= 0 ? '+' : ''}
              {position.allTimePnLPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

