'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { getSwapQuote } from '@/lib/jupiter'
import { connection } from '@/lib/solana'
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import axios from 'axios'

interface TradingPanelProps {
  tokenMint: string
  tokenInfo: any
}

export default function TradingPanel({ tokenMint, tokenInfo }: TradingPanelProps) {
  const { keypair, walletAddress } = useWallet()
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const SOL_MINT = 'So11111111111111111111111111111111111111112'

  const handleTrade = async () => {
    if (!keypair || !walletAddress) {
      setError('Wallet not connected for trading')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      const inputMint = tradeType === 'buy' ? SOL_MINT : tokenMint
      const outputMint = tradeType === 'buy' ? tokenMint : SOL_MINT
      
      // Convert amount to proper units (SOL uses 9 decimals, token uses its decimals)
      const decimals = tradeType === 'buy' ? 9 : tokenInfo.decimals
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals))

      // Get swap quote
      const quote = await getSwapQuote(inputMint, outputMint, amountInSmallestUnit)
      
      if (!quote) {
        setError('Failed to get swap quote')
        return
      }

      // Get swap transaction from Jupiter
      const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
        quoteResponse: quote,
        userPublicKey: walletAddress,
        wrapUnwrapSOL: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      })

      const { swapTransaction } = swapResponse.data

      // Deserialize and send transaction
      const transactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = Transaction.from(transactionBuf)

      // Sign and send
      transaction.sign(keypair)
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair],
        {
          commitment: 'confirmed',
          maxRetries: 3,
        }
      )

      console.log('Transaction confirmed:', signature)
      setAmount('')
      // Refresh portfolio after successful trade
      window.location.reload()
    } catch (err: any) {
      console.error('Trade error:', err)
      setError(err.message || 'Failed to execute trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Trade {tokenInfo.symbol}</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTradeType('buy')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            tradeType === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            tradeType === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Amount ({tradeType === 'buy' ? 'SOL' : tokenInfo.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleTrade}
        disabled={loading || !amount}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          tradeType === 'buy'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tokenInfo.symbol}`}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Trading powered by Jupiter Aggregator
      </p>
    </div>
  )
}

