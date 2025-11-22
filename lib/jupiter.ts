import axios from 'axios'

const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6'

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface PriceData {
  price: number
  timestamp: number
}

export interface QuoteResponse {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  priceImpactPct: string
  routePlan: any[]
}

// Get SOL price & market cap via CoinGecko
interface SolStats {
  price: number
  marketCap: string
  fdv: string
}

let cachedSolStats: SolStats | null = null
let solStatsCacheTime = 0
const SOL_STATS_CACHE_DURATION = 60000 // 1 minute

async function fetchSolStats(): Promise<SolStats> {
  const response = await axios.get(
    'https://api.coingecko.com/api/v3/coins/solana',
    {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false,
      },
    }
  )

  const price = response.data?.market_data?.current_price?.usd || 0
  const marketCapValue = response.data?.market_data?.market_cap?.usd || 0
  const fdvValue = response.data?.market_data?.fully_diluted_valuation?.usd || marketCapValue

  return {
    price,
    marketCap: formatMarketCap(marketCapValue),
    fdv: formatMarketCap(fdvValue),
  }
}

export async function getSOLStats(): Promise<SolStats> {
  const now = Date.now()
  if (cachedSolStats && now - solStatsCacheTime < SOL_STATS_CACHE_DURATION) {
    return cachedSolStats
  }

  try {
    cachedSolStats = await fetchSolStats()
    solStatsCacheTime = now
    return cachedSolStats
  } catch (error) {
    console.error('Error fetching SOL stats:', error)
    return cachedSolStats || { price: 100, marketCap: '$0.00', fdv: '$0.00' }
  }
}

export async function getSOLPriceUSD(): Promise<number> {
  const stats = await getSOLStats()
  return stats.price
}

// Format market cap
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`
  }
  return `$${marketCap.toFixed(2)}`
}

// Format large numbers
function formatNumber(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

// Get token price and market cap from DexScreener
async function getTokenPriceFromDexScreener(tokenAddress: string): Promise<{ price: number; marketCap?: string; fdv?: string }> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
    const data = response.data
    
    if (data?.pairs && data.pairs.length > 0) {
      // Filter pairs where the token is the BASE token (not quote)
      // Market cap should come from pairs where our token is the base
      const baseTokenPairs = data.pairs.filter((pair: any) => 
        pair.baseToken?.address?.toLowerCase() === tokenAddress.toLowerCase()
      )
      
      // If no base token pairs, try all pairs
      const pairsToUse = baseTokenPairs.length > 0 ? baseTokenPairs : data.pairs
      
      // Sort by liquidity descending
      const sortedPairs = pairsToUse.sort((a: any, b: any) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )
      
      // Find the best pair for price (highest liquidity)
      const bestPairForPrice = sortedPairs[0]
      
      // Find the best pair for market cap (highest liquidity with market cap)
      const pairWithMarketCap = sortedPairs.find((p: any) => 
        p.marketCap && p.marketCap > 0
      ) || sortedPairs.find((p: any) => 
        p.fdv && p.fdv > 0
      )
      
      if (bestPairForPrice?.priceUsd) {
        const price = parseFloat(bestPairForPrice.priceUsd)
        
        // Use market cap from the pair that has it (prioritize marketCap over FDV)
        const marketCapValue = pairWithMarketCap?.marketCap
        const fdvValue = pairWithMarketCap?.fdv || bestPairForPrice?.fdv
        
        const marketCap = marketCapValue ? formatMarketCap(marketCapValue) : undefined
        const fdv = fdvValue ? formatMarketCap(fdvValue) : undefined

        return { price, marketCap, fdv }
      }
    }
    return { price: 0 }
  } catch (error: any) {
    console.error('DexScreener price error:', error?.message || error)
    return { price: 0 }
  }
}

// Get token price from Birdeye
async function getTokenPriceFromBirdeye(tokenAddress: string): Promise<number> {
  try {
    const response = await axios.get(`https://public-api.birdeye.so/v1/token/price`, {
      params: {
        address: tokenAddress,
      },
      headers: {
        'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
      },
    })
    
    if (response.data?.data?.value) {
      return response.data.data.value
    }
    return 0
  } catch (error: any) {
    // Birdeye requires API key, so this might fail silently
    return 0
  }
}

// Get token price from Jupiter (via quote)
async function getTokenPriceFromJupiter(tokenAddress: string, decimals: number): Promise<number> {
  try {
    const SOL_MINT = 'So11111111111111111111111111111111111111112'
    
    // Get quote for 1 token to SOL
    const amount = Math.pow(10, decimals) // 1 token in smallest unit
    const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
      params: {
        inputMint: tokenAddress,
        outputMint: SOL_MINT,
        amount: amount.toString(),
        slippageBps: 50,
      },
      timeout: 5000, // 5 second timeout
    })

    const quote = response.data
    if (!quote || !quote.outAmount) {
      return 0
    }

    // Get SOL price in USD
    const SOL_PRICE_USD = await getSOLPriceUSD()
    
    // Calculate token price in USD
    const solAmount = parseFloat(quote.outAmount) / 1e9
    const tokenPrice = solAmount * SOL_PRICE_USD

    return tokenPrice
  } catch (error: any) {
    // Silently fail, will try other sources
    return 0
  }
}

// Get token price with multiple fallback sources
export async function getTokenPrice(tokenAddress: string, decimals: number = 6): Promise<{ price: number; marketCap?: string; fdv?: string }> {
  // Try DexScreener first (most reliable for memecoins)
  const dexscreenerData = await getTokenPriceFromDexScreener(tokenAddress)
  if (dexscreenerData.price > 0) {
    return dexscreenerData
  }

  // Try Birdeye second
  const birdeyePrice = await getTokenPriceFromBirdeye(tokenAddress)
  if (birdeyePrice > 0) {
    return { price: birdeyePrice }
  }

  // Try Jupiter as fallback
  const tokenInfo = await getTokenInfo(tokenAddress)
  const tokenDecimals = tokenInfo?.decimals || decimals
  const jupiterPrice = await getTokenPriceFromJupiter(tokenAddress, tokenDecimals)
  if (jupiterPrice > 0) {
    return { price: jupiterPrice }
  }

  // All sources failed
  console.warn(`Could not fetch price for token ${tokenAddress} from any source`)
  return { price: 0 }
}

// Get quote for swap
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<QuoteResponse | null> {
  try {
    const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: Math.floor(amount).toString(),
        slippageBps,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error fetching swap quote:', error)
    return null
  }
}

// Get token list
export async function getTokenList(): Promise<TokenInfo[]> {
  try {
    const response = await axios.get('https://token.jup.ag/all')
    return response.data
  } catch (error: any) {
    console.error('Error fetching token list:', error?.message || error)
    return []
  }
}

// Get token info from DexScreener (includes name, symbol, logo)
export async function getTokenInfoFromDexScreener(address: string): Promise<TokenInfo | null> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
    const data = response.data
    
    if (data?.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0] // Use the first pair for info
      return {
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        decimals: 0, // DexScreener doesn't provide decimals directly here
        logoURI: `https://token.jup.ag/svg/${pair.baseToken.address}.svg`, // Fallback to Jupiter's logo service
      }
    }
    return null
  } catch (error: any) {
    console.error('Error fetching token info from DexScreener:', error?.message || error)
    return null
  }
}

// Get token info by address (combines Jupiter and DexScreener)
export async function getTokenInfo(address: string): Promise<TokenInfo | null> {
  // Try DexScreener first for richer info
  const dexscreenerInfo = await getTokenInfoFromDexScreener(address)
  if (dexscreenerInfo) {
    return dexscreenerInfo
  }

  // Fallback to Jupiter token list
  try {
    const tokens = await getTokenList()
    return tokens.find((t) => t.address === address) || null
  } catch (error: any) {
    console.error('Error fetching token info from Jupiter list:', error?.message || error)
    return null
  }
}

// Get extended token data from DexScreener (volume, liquidity, supply, buys/sells)
export interface TokenExtendedData {
  price: number
  volume24h?: string
  liquidity?: string
  supply?: string
  buys24h?: string
  sells24h?: string
  buyConcentration?: number
  pooledBase?: string
  pooledQuote?: string
}

export async function getTokenExtendedData(tokenAddress: string): Promise<TokenExtendedData | null> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
    const data = response.data
    
    if (data?.pairs && data.pairs.length > 0) {
      // Filter pairs where the token is the BASE token
      const baseTokenPairs = data.pairs.filter((pair: any) => 
        pair.baseToken?.address?.toLowerCase() === tokenAddress.toLowerCase()
      )
      
      const pairsToUse = baseTokenPairs.length > 0 ? baseTokenPairs : data.pairs
      
      // Sort by liquidity descending
      const sortedPairs = pairsToUse.sort((a: any, b: any) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )
      
      const bestPair = sortedPairs[0]
      
      if (!bestPair?.priceUsd) {
        return null
      }
      
      const price = parseFloat(bestPair.priceUsd)
      
      // Aggregate volume across all pairs with this token as base
      const totalVolume = pairsToUse.reduce((sum: number, pair: any) => {
        const volume24h = pair.volume?.h24 || 0
        return sum + volume24h
      }, 0)
      
      // Aggregate liquidity
      const totalLiquidity = pairsToUse.reduce((sum: number, pair: any) => {
        const liquidity = pair.liquidity?.usd || 0
        return sum + liquidity
      }, 0)
      
      // Get supply (use FDV / price if available, or marketCap / price)
      const supply = bestPair.fdv 
        ? bestPair.fdv / price 
        : bestPair.marketCap 
          ? bestPair.marketCap / price 
          : undefined
      
      // Calculate buy/sell volume (DexScreener doesn't always provide this directly)
      // We'll estimate from transaction count or use volume as approximation
      const buys24h = bestPair.txns?.h24?.buys || Math.floor(totalVolume / 2)
      const sells24h = bestPair.txns?.h24?.sells || Math.floor(totalVolume / 2)
      
      // Calculate buy concentration (percentage of buys vs total transactions)
      const totalTxns = (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0)
      const buyConcentration = totalTxns > 0 
        ? ((bestPair.txns?.h24?.buys || 0) / totalTxns) * 100 
        : undefined
      
      // Get pooled assets (base and quote token amounts in USD)
      const pooledBase = bestPair.liquidity?.usd 
        ? formatNumber(bestPair.liquidity.usd / 2) 
        : undefined
      const pooledQuote = bestPair.liquidity?.usd 
        ? formatNumber(bestPair.liquidity.usd / 2) 
        : undefined
      
      return {
        price,
        volume24h: totalVolume > 0 ? formatNumber(totalVolume) : undefined,
        liquidity: totalLiquidity > 0 ? formatNumber(totalLiquidity) : undefined,
        supply: supply ? formatNumber(supply) : undefined,
        buys24h: buys24h > 0 ? formatNumber(buys24h) : undefined,
        sells24h: sells24h > 0 ? formatNumber(sells24h) : undefined,
        buyConcentration,
        pooledBase,
        pooledQuote,
      }
    }
    return null
  } catch (error: any) {
    console.error('Error fetching extended token data:', error?.message || error)
    return null
  }
}
