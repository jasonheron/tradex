'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { parseWalletAddress } from '@/lib/solana'

export default function WalletSetup() {
  const { connectWallet, connectWithSecretKey } = useWallet()
  const [mode, setMode] = useState<'view' | 'trade'>('view')
  const [address, setAddress] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState('')

  const handleViewMode = () => {
    setError('')
    const publicKey = parseWalletAddress(address)
    if (!publicKey) {
      setError('Invalid wallet address')
      return
    }
    connectWallet(address, 'view')
  }

  const handleTradeMode = () => {
    setError('')
    try {
      connectWithSecretKey(secretKey)
    } catch (err: any) {
      setError(err.message || 'Invalid secret key')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">TradeX</h1>
          <p className="text-gray-400">Solana Memecoin Trading</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('view')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              View & Track
            </button>
            <button
              onClick={() => setMode('trade')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'trade'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              Full Trading
            </button>
          </div>

          {mode === 'view' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your Solana wallet address"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleViewMode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                View Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Wallet Secret Key
                </label>
                <textarea
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your wallet secret key (base58 or JSON array)"
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Your secret key is stored locally and never sent to our servers
                </p>
              </div>
              <button
                onClick={handleTradeMode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Enable Trading
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

