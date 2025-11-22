'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from './useWallet'
import { getTokenAccounts, getSOLBalance } from '@/lib/solana'
import { getTokenInfo, getTokenPrice, getSOLStats } from '@/lib/jupiter'

export interface TokenPosition {
  mint: string
  symbol: string
  name: string
  balance: number
  decimals: number
  price: number
  value: number
  logoURI?: string
  marketCap?: string
  fdv?: string
  allTimePnL: number
  allTimePnLPercent: number
  transactions: Transaction[]
}

export interface Transaction {
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: number
}

export function usePortfolio() {
  const { walletAddress } = useWallet()
  const [positions, setPositions] = useState<TokenPosition[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [dailyChange, setDailyChange] = useState({ value: 0, percent: 0 })
  const [loading, setLoading] = useState(true)
  const [solBalance, setSolBalance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [solPriceUSD, setSolPriceUSD] = useState(0)
  const [portfolioValueInSOL, setPortfolioValueInSOL] = useState(0)
  const previousPositionsRef = useRef<string>('')
  const initialLoadRef = useRef(true)

  const updatePortfolio = useCallback(async () => {
    if (!walletAddress) {
      setPositions([])
      setTotalValue(0)
      setLoading(false)
      setError(null)
      previousPositionsRef.current = ''
      initialLoadRef.current = true
      return
    }

    if (initialLoadRef.current) {
      setLoading(true)
    }
    setError(null)
    try {
      // Get SOL balance
      let sol = 0
      try {
        sol = await getSOLBalance(walletAddress)
        setSolBalance(sol)
      } catch (error: any) {
        setError(`Failed to fetch SOL balance from Helius: ${error?.message || 'Unknown error'}. Please check your Helius RPC endpoint and API key.`)
        setLoading(false)
        return
      }
      
      // Get SOL price & stats
      const { price: SOL_PRICE, marketCap: SOL_MARKET_CAP, fdv: SOL_FDV } = await getSOLStats()
      setSolPriceUSD(SOL_PRICE)
      let total = sol * SOL_PRICE

      // Get token accounts
      let tokenAccounts: any[] = []
      try {
        tokenAccounts = await getTokenAccounts(walletAddress)
      } catch (error: any) {
        setError(`Failed to fetch token accounts from Helius: ${error?.message || 'Unknown error'}. Please check your Helius RPC endpoint and API key.`)
        setLoading(false)
        return
      }
      
      // Filter out zero balances (but keep SOL if > 0)
      const validAccounts = tokenAccounts.filter(
        (acc) => acc.balance > 0 && acc.mint !== 'So11111111111111111111111111111111111111112'
      )

      // Fetch token info and prices
      const positionsData: TokenPosition[] = await Promise.all(
        validAccounts.map(async (account) => {
          const tokenInfo = await getTokenInfo(account.mint)
          const priceData = await getTokenPrice(account.mint, account.decimals)
          const price = priceData.price
          const value = account.balance * price

          total += value

          // Mock transaction history (in production, parse from on-chain data)
          const transactions: Transaction[] = [
            {
              type: 'buy',
              amount: account.balance,
              price: price * 0.9, // Mock average buy price
              timestamp: Date.now() - 86400000,
            },
          ]

          const avgBuyPrice = transactions
            .filter((t) => t.type === 'buy')
            .reduce((sum, t) => sum + t.price, 0) / transactions.filter((t) => t.type === 'buy').length

          const allTimePnL = value - account.balance * (avgBuyPrice || price)
          const allTimePnLPercent = avgBuyPrice ? ((price - avgBuyPrice) / avgBuyPrice) * 100 : 0

          return {
            mint: account.mint,
            symbol: tokenInfo?.symbol || 'UNKNOWN',
            name: tokenInfo?.name || 'Unknown Token',
            balance: account.balance,
            decimals: account.decimals,
            price,
            value,
            logoURI: tokenInfo?.logoURI,
            marketCap: priceData.marketCap || 'N/A',
            fdv: priceData.fdv || priceData.marketCap || 'N/A',
            allTimePnL,
            allTimePnLPercent,
            transactions,
          }
        })
      )

      // Sort tokens by value descending (excluding SOL)
      positionsData.sort((a, b) => b.value - a.value)

      // Add SOL as position 1 if balance > 0
      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      const solPosition: TokenPosition = {
        mint: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        balance: sol,
        decimals: 9,
        price: SOL_PRICE,
        value: sol * SOL_PRICE,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        marketCap: SOL_MARKET_CAP,
        fdv: SOL_FDV,
        allTimePnL: 0,
        allTimePnLPercent: 0,
        transactions: [],
      }

      // SOL first, then other tokens sorted by value
      const allPositions = sol > 0 
        ? [solPosition, ...positionsData]
        : positionsData

      const filteredPositions = allPositions.filter((position) => position.value > 0)

      const newPositionsString = JSON.stringify(filteredPositions)
      if (newPositionsString !== previousPositionsRef.current) {
        previousPositionsRef.current = newPositionsString
        setPositions(filteredPositions)
      }
      setTotalValue(total)
      setPortfolioValueInSOL(SOL_PRICE > 0 ? total / SOL_PRICE : 0)
      
      // Calculate daily change based on previous day's value (23:59)
      const now = new Date()
      
      // Get yesterday at 23:59:59
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999)
      const yesterdayKey = `portfolio_value_${yesterday.toDateString()}`
      
      // Get stored yesterday's value
      const storedYesterday = localStorage.getItem(yesterdayKey)
      const previousValue = storedYesterday ? parseFloat(storedYesterday) : null
      
      // Store current value with today's date key (will be used as yesterday's value tomorrow)
      const todayKey = `portfolio_value_${now.toDateString()}`
      const currentStored = localStorage.getItem(todayKey)
      
      // Only update if this is the first update today or if value changed significantly
      // Store the last value of the day (closest to 23:59)
      if (!currentStored || Math.abs(total - parseFloat(currentStored)) > 0.01) {
        localStorage.setItem(todayKey, total.toString())
      }
      
      // Calculate daily change
      if (previousValue !== null && previousValue > 0) {
        const changeValue = total - previousValue
        const changePercent = (changeValue / previousValue) * 100
        setDailyChange({
          value: changeValue,
          percent: changePercent,
        })
      } else {
        // No previous data, show 0 change
        setDailyChange({
          value: 0,
          percent: 0,
        })
      }
      
      // Clean up old entries (keep last 30 days)
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      for (let i = 0; i < 35; i++) {
        const checkDate = new Date(thirtyDaysAgo)
        checkDate.setDate(checkDate.getDate() - i)
        const checkKey = `portfolio_value_${checkDate.toDateString()}`
        if (i > 30) {
          localStorage.removeItem(checkKey)
        }
      }
    } catch (error: any) {
      console.error('Error updating portfolio:', error)
      setError(error?.message || 'Failed to fetch portfolio data. Public RPC endpoints may be rate-limited. Consider setting up your own RPC endpoint.')
    } finally {
      setLoading(false)
      initialLoadRef.current = false
    }
  }, [walletAddress])

  useEffect(() => {
    updatePortfolio()
    
    // Update every 3 seconds
    const interval = setInterval(updatePortfolio, 3000)
    
    return () => clearInterval(interval)
  }, [updatePortfolio])

  return {
    positions,
    totalValue,
    totalValueInSOL: portfolioValueInSOL,
    dailyChange,
    loading,
    solBalance,
    solPriceUSD,
    error,
    refresh: updatePortfolio,
  }
}

