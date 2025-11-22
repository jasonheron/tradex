'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown, ChevronDown, Plus, Pencil } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface PortfolioHeaderProps {
  totalValue: number
  totalValueInSOL: number
  solPriceUSD: number
  dailyChange: { value: number; percent: number }
}

export default function PortfolioHeader({
  totalValue,
  totalValueInSOL,
  solPriceUSD,
  dailyChange,
}: PortfolioHeaderProps) {
  const {
    mode,
    savedWallets,
    walletAddress,
    switchWallet,
    addSavedWallet,
    updateSavedWalletLabel,
  } = useWallet()

  const isPositive = dailyChange.value >= 0
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [newWalletLabel, setNewWalletLabel] = useState('')
  const [showValueInSOL, setShowValueInSOL] = useState(false)

  const currentWallet = savedWallets.find((w) => w.address === walletAddress)
  const walletLabel =
    currentWallet?.label ||
    (walletAddress ? walletAddress.slice(0, 6) : 'WALLET')

  const handleAddWallet = () => {
    if (!newWalletAddress.trim()) return
    addSavedWallet(newWalletAddress.trim(), newWalletLabel.trim() || undefined)
    switchWallet(newWalletAddress.trim())
    setNewWalletAddress('')
    setNewWalletLabel('')
    setIsDropdownOpen(false)
  }

  const handleRenameWallet = (address: string, existingLabel?: string) => {
    const label = window.prompt('Set wallet name', existingLabel || '')
    if (label !== null) {
      updateSavedWalletLabel(address, label.trim())
    }
  }

  return (
    <div className="px-6 pt-6 pb-6 border-b border-yellow-300/20 relative">
      <div className="flex justify-between items-center mb-2 gap-4">
        <button
          className="text-left flex-1"
          onClick={() => setShowValueInSOL((prev) => !prev)}
          title="Click to toggle USD/SOL value"
        >
          <div className="text-4xl font-bold text-white tracking-tight leading-none">
            {showValueInSOL
              ? `${totalValueInSOL.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} SOL`
              : `$${totalValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {showValueInSOL
              ? `@ $${solPriceUSD.toFixed(2)} per SOL`
              : 'Tap to view in SOL'}
          </div>
        </button>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-black border-2 border-purple-500 px-4 py-2 rounded-full text-sm font-semibold"
          >
            {walletLabel}
            <ChevronDown className="w-4 h-4 text-purple-300" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-[#0b0b0b] border border-purple-500 rounded-2xl shadow-2xl p-3 z-20 space-y-3">
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {savedWallets.map((wallet) => (
                  <div
                    key={wallet.address}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                      wallet.address === walletAddress ? 'bg-purple-500/30' : 'bg-transparent'
                    }`}
                  >
                    <button
                      className="text-sm font-semibold truncate text-left flex-1"
                      onClick={() => {
                        switchWallet(wallet.address)
                        setIsDropdownOpen(false)
                      }}
                    >
                      {wallet.label || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </button>
                    <button
                      onClick={() => handleRenameWallet(wallet.address, wallet.label)}
                      className="text-purple-300 hover:text-purple-100 ml-2"
                      title="Rename wallet"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {savedWallets.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-2">
                    No wallets saved yet.
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-3 space-y-2">
                <input
                  type="text"
                  value={newWalletLabel}
                  onChange={(e) => setNewWalletLabel(e.target.value)}
                  placeholder="Wallet name"
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  placeholder="Wallet address"
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleAddWallet}
                  className="w-full bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-xl py-2 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
        <span className="text-sm">
          ${Math.abs(dailyChange.value).toFixed(2)} ({isPositive ? '+' : ''}{dailyChange.percent.toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}

