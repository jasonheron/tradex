'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type WalletMode = 'view' | 'trade'

interface SavedWallet {
  address: string
  label?: string
  addedAt: number
}

interface WalletContextType {
  walletAddress: string | null
  secretKey: string | null
  keypair: any | null
  mode: WalletMode
  isConnected: boolean
  savedWallets: SavedWallet[]
  connectWallet: (address: string, mode: WalletMode) => void
  connectWithSecretKey: (secretKey: string) => void
  disconnect: () => void
  addSavedWallet: (address: string, label?: string) => void
  removeSavedWallet: (address: string) => void
  switchWallet: (address: string) => void
  updateSavedWalletLabel: (address: string, label: string) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [secretKey, setSecretKey] = useState<string | null>(null)
  const [keypair, setKeypair] = useState<any | null>(null)
  const [mode, setMode] = useState<WalletMode>('view')
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([])

  // Load saved wallets
  useEffect(() => {
    const saved = localStorage.getItem('savedWallets')
    if (saved) {
      try {
        setSavedWallets(JSON.parse(saved))
      } catch {
        setSavedWallets([])
      }
    }
  }, [])

  useEffect(() => {
    // Load from localStorage
    const savedAddress = localStorage.getItem('walletAddress')
    const savedSecretKey = localStorage.getItem('walletSecretKey')
    const savedMode = localStorage.getItem('walletMode') as WalletMode

    if (savedAddress) {
      setWalletAddress(savedAddress)
      setMode(savedMode || 'view')
    }

    if (savedSecretKey && savedMode === 'trade') {
      setSecretKey(savedSecretKey)
      // Note: In production, decrypt the secret key
      try {
        const { Keypair } = require('@solana/web3.js')
        const { parseSecretKey } = require('@/lib/solana')
        const kp = parseSecretKey(savedSecretKey)
        if (kp) {
          setKeypair(kp)
          setWalletAddress(kp.publicKey.toString())
        }
      } catch (error) {
        console.error('Error loading keypair:', error)
      }
    }
  }, [])

  const connectWallet = (address: string, walletMode: WalletMode) => {
    setWalletAddress(address)
    setMode(walletMode)
    localStorage.setItem('walletAddress', address)
    localStorage.setItem('walletMode', walletMode)
    
    // Add to saved wallets if not already there (view mode only)
    if (walletMode === 'view') {
      setSecretKey(null)
      setKeypair(null)
      localStorage.removeItem('walletSecretKey')
      
      const saved = JSON.parse(localStorage.getItem('savedWallets') || '[]')
      if (!saved.find((w: SavedWallet) => w.address === address)) {
        const newWallet: SavedWallet = {
          address,
          addedAt: Date.now(),
        }
        const updated = [...saved, newWallet]
        localStorage.setItem('savedWallets', JSON.stringify(updated))
        setSavedWallets(updated)
      }
    }
  }

  const addSavedWallet = (address: string, label?: string) => {
    const saved = JSON.parse(localStorage.getItem('savedWallets') || '[]')
    if (!saved.find((w: SavedWallet) => w.address === address)) {
      const newWallet: SavedWallet = {
        address,
        label,
        addedAt: Date.now(),
      }
      const updated = [...saved, newWallet]
      localStorage.setItem('savedWallets', JSON.stringify(updated))
      setSavedWallets(updated)
    }
  }

  const removeSavedWallet = (address: string) => {
    const saved = JSON.parse(localStorage.getItem('savedWallets') || '[]')
    const updated = saved.filter((w: SavedWallet) => w.address !== address)
    localStorage.setItem('savedWallets', JSON.stringify(updated))
    setSavedWallets(updated)
  }

  const switchWallet = (address: string) => {
    setWalletAddress(address)
    setMode('view')
    localStorage.setItem('walletAddress', address)
    localStorage.setItem('walletMode', 'view')
    setSecretKey(null)
    setKeypair(null)
    localStorage.removeItem('walletSecretKey')
  }

  const updateSavedWalletLabel = (address: string, label: string) => {
    const saved = JSON.parse(localStorage.getItem('savedWallets') || '[]')
    const updated = saved.map((w: SavedWallet) =>
      w.address === address ? { ...w, label } : w
    )
    localStorage.setItem('savedWallets', JSON.stringify(updated))
    setSavedWallets(updated)
  }

  const connectWithSecretKey = (secretKeyString: string) => {
    try {
      const { parseSecretKey } = require('@/lib/solana')
      const kp = parseSecretKey(secretKeyString)
      
      if (kp) {
        setKeypair(kp)
        setSecretKey(secretKeyString)
        setWalletAddress(kp.publicKey.toString())
        setMode('trade')
        localStorage.setItem('walletAddress', kp.publicKey.toString())
        localStorage.setItem('walletSecretKey', secretKeyString)
        localStorage.setItem('walletMode', 'trade')
      } else {
        throw new Error('Invalid secret key')
      }
    } catch (error) {
      throw new Error('Failed to parse secret key')
    }
  }

  const disconnect = () => {
    setWalletAddress(null)
    setSecretKey(null)
    setKeypair(null)
    setMode('view')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletSecretKey')
    localStorage.removeItem('walletMode')
  }

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        secretKey,
        keypair,
        mode,
        isConnected: !!walletAddress,
        savedWallets,
        connectWallet,
        connectWithSecretKey,
        disconnect,
        addSavedWallet,
        removeSavedWallet,
        switchWallet,
        updateSavedWalletLabel,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

