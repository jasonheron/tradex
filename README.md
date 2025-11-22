# TradeX - Solana Memecoin Trading App

A mobile-first web application for tracking and trading Solana memecoins using Jupiter Aggregator.

## Features

- **View & Track Mode**: Monitor any Solana wallet by entering its address. The app updates every few seconds to show current positions and token values.
- **Full Trading Mode**: Connect with your wallet's secret key to enable trading directly from the app using Jupiter Aggregator.
- **Portfolio Overview**: See your total portfolio value, daily changes, and all token positions with P&L.
- **Token Details**: Click any token to view:
  - Trading chart with price history
  - Your buy/sell transactions marked on the chart
  - Average buy cost and average exit price
  - Transaction history

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Solana wallet (for trading mode)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tradex
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### View & Track Mode

1. Click "View & Track" on the home screen
2. Enter a Solana wallet address
3. The app will monitor the wallet and display all token positions
4. Portfolio updates automatically every 3 seconds

### Full Trading Mode

1. Click "Full Trading" on the home screen
2. Enter your wallet's secret key (base58 or JSON array format)
3. ⚠️ **Warning**: Your secret key is stored locally in your browser. Never share it.
4. Once connected, you can:
   - View your portfolio
   - Click on any token to see details
   - Buy or sell tokens directly from the token detail page

## Project Structure

```
tradex/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── token/[mint]/       # Token detail page
├── components/            # React components
│   ├── PortfolioView.tsx  # Main portfolio view
│   ├── TokenList.tsx      # List of token positions
│   ├── TokenChart.tsx     # Price chart with transaction markers
│   └── TradingPanel.tsx   # Buy/sell interface
├── hooks/                 # Custom React hooks
│   ├── useWallet.tsx      # Wallet connection state
│   └── usePortfolio.tsx   # Portfolio data and updates
├── lib/                   # Utility libraries
│   ├── jupiter.ts         # Jupiter API integration
│   └── solana.ts          # Solana blockchain utilities
└── package.json
```

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Solana Web3.js**: Solana blockchain interaction
- **Jupiter API**: Token prices and swap aggregation
- **Chart.js**: Price charts
- **Lucide React**: Icons

## Security Notes

- Secret keys are stored in browser localStorage only
- Never commit secret keys to version control
- The app runs entirely client-side - no backend server stores your keys
- Always verify transactions before signing

## Development

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Currently, the app uses public RPC endpoints. For production, consider:

- Setting up your own Solana RPC endpoint
- Adding rate limiting
- Implementing proper error handling

## Limitations & Future Improvements

- Token prices are calculated via SOL pairs - direct USD pairs would be more accurate
- Transaction history is currently mocked - should parse from on-chain data
- Market cap data needs integration with a data provider
- Price charts use mock data - should integrate with a price API
- No transaction history persistence
- No portfolio analytics beyond basic P&L

## License

MIT

