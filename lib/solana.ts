import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

// Using Helius RPC endpoint - in production, use your own RPC endpoint
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=f9c6f767-0e30-4f34-8a58-d717c4973528'

// Use Helius endpoint
export const connection = new Connection(
  SOLANA_RPC_URL,
  { commitment: 'confirmed' }
)

// Parse wallet address
export function parseWalletAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address)
  } catch {
    return null
  }
}

// Parse secret key
export function parseSecretKey(secretKey: string): Keypair | null {
  try {
    // Try parsing as base58
    const decoded = bs58.decode(secretKey)
    if (decoded.length === 64) {
      return Keypair.fromSecretKey(decoded)
    }
    
    // Try parsing as JSON array
    const parsed = JSON.parse(secretKey)
    if (Array.isArray(parsed) && parsed.length === 64) {
      return Keypair.fromSecretKey(new Uint8Array(parsed))
    }
    
    return null
  } catch {
    return null
  }
}

// Get token accounts for a wallet with retry logic
export async function getTokenAccounts(walletAddress: string) {
  const publicKey = parseWalletAddress(walletAddress)
  if (!publicKey) {
    return []
  }

  const isHeliusEndpoint = SOLANA_RPC_URL.includes('helius')
  
  // Try Helius first, with better error handling
  try {
    console.log(`[RPC] Using Helius endpoint: ${isHeliusEndpoint ? SOLANA_RPC_URL : 'Not configured'}`)
    const heliusConnection = new Connection(SOLANA_RPC_URL, { 
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 second timeout
    })
    
    const tokenAccounts = await heliusConnection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    )

    console.log(`[RPC] Successfully fetched ${tokenAccounts.value.length} token accounts from Helius`)
    return tokenAccounts.value.map((account) => {
      const parsedInfo = account.account.data.parsed.info
      return {
        mint: parsedInfo.mint,
        balance: parsedInfo.tokenAmount.uiAmount || 0,
        decimals: parsedInfo.tokenAmount.decimals,
        address: account.pubkey.toString(),
      }
    })
  } catch (error: any) {
    console.error(`[RPC] Helius endpoint failed:`, error?.message || error)
    // Only fallback to public endpoints if Helius explicitly fails
    // Don't silently switch to public endpoints
    throw new Error(`Helius RPC connection failed: ${error?.message || 'Unknown error'}. Please check your Helius API key and endpoint configuration.`)
  }
}

// Get SOL balance with retry logic
export async function getSOLBalance(walletAddress: string): Promise<number> {
  const publicKey = parseWalletAddress(walletAddress)
  if (!publicKey) {
    return 0
  }

  const isHeliusEndpoint = SOLANA_RPC_URL.includes('helius')
  
  // Try Helius first, with better error handling
  try {
    console.log(`[RPC] Using Helius endpoint for SOL balance: ${isHeliusEndpoint ? SOLANA_RPC_URL : 'Not configured'}`)
    const heliusConnection = new Connection(SOLANA_RPC_URL, { 
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 second timeout
    })
    
    const balance = await heliusConnection.getBalance(publicKey)
    console.log(`[RPC] Successfully fetched SOL balance from Helius: ${balance / 1e9} SOL`)
    return balance / 1e9 // Convert lamports to SOL
  } catch (error: any) {
    console.error(`[RPC] Helius endpoint failed for SOL balance:`, error?.message || error)
    // Only fallback to public endpoints if Helius explicitly fails
    throw new Error(`Helius RPC connection failed: ${error?.message || 'Unknown error'}. Please check your Helius API key and endpoint configuration.`)
  }
}

