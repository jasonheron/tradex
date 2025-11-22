'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { ChevronDown, Plus } from 'lucide-react'

export default function MonitoringBanner() {
  const { savedWallets, walletAddress, switchWallet, addSavedWallet } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWalletAddress, setNewWalletAddress] = useState('')

  const handleAddWallet = () => {
    if (newWalletAddress.trim()) {
      addSavedWallet(newWalletAddress.trim())
      setNewWalletAddress('')
      setShowAddForm(false)
    }
  }

  return (
    <div className="px-4 mb-4">
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium">Monitoring Mode</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-blue-400 hover:text-blue-300"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-400 mb-2">Switch to another saved wallet:</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {savedWallets.map((wallet) => (
                <button
                  key={wallet.address}
                  onClick={() => {
                    switchWallet(wallet.address)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    wallet.address === walletAddress
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-mono text-xs truncate">
                    {wallet.label || wallet.address.slice(0, 8) + '...' + wallet.address.slice(-8)}
                  </div>
                </button>
              ))}
            </div>

            {showAddForm ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddWallet}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewWalletAddress('')
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 px-3 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Wallet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

