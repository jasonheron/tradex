import axios from 'axios'

const ULTRA_API_BASE = 'https://api.jup.ag/ultra'

export interface UltraOrderRequest {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
  userPublicKey: string
  integratorFeeBps?: number
}

export interface UltraOrderResponse {
  orderId: string
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  priceImpactPct: string
  fee: {
    amount: string
    mint: string
  }
}

export interface UltraExecuteRequest {
  orderId: string
  userPublicKey: string
  signedTransaction?: string
}

export interface UltraExecuteResponse {
  transaction: string
  status: 'pending' | 'success' | 'failed'
  signature?: string
}

// Get user holdings using Ultra API
export async function getHoldings(userPublicKey: string) {
  try {
    const response = await axios.get(`${ULTRA_API_BASE}/holdings`, {
      params: {
        userPublicKey,
      },
    })
    return response.data
  } catch (error: any) {
    console.error('Error fetching holdings:', error?.message || error)
    return null
  }
}

// Create an order using Ultra Swap API
export async function createOrder(request: UltraOrderRequest): Promise<UltraOrderResponse | null> {
  try {
    const response = await axios.post(`${ULTRA_API_BASE}/order`, request)
    return response.data
  } catch (error: any) {
    console.error('Error creating order:', error?.message || error)
    return null
  }
}

// Execute an order using Ultra Swap API
export async function executeOrder(request: UltraExecuteRequest): Promise<UltraExecuteResponse | null> {
  try {
    const response = await axios.post(`${ULTRA_API_BASE}/execute`, request)
    return response.data
  } catch (error: any) {
    console.error('Error executing order:', error?.message || error)
    return null
  }
}

// Search for tokens
export async function searchTokens(query: string) {
  try {
    const response = await axios.get(`${ULTRA_API_BASE}/search`, {
      params: {
        query,
      },
    })
    return response.data
  } catch (error: any) {
    console.error('Error searching tokens:', error?.message || error)
    return []
  }
}

