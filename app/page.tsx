'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import PortfolioView from '@/components/PortfolioView'
import WalletSetup from '@/components/WalletSetup'

export default function Home() {
  const { walletAddress, isConnected, mode } = useWallet()

  if (!isConnected) {
    return <WalletSetup />
  }

  return <PortfolioView />
}

