'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { Transaction } from '@/hooks/usePortfolio'

interface TokenChartProps {
  mint: string
  transactions: Transaction[]
  currentPrice: number
  timeframe?: '1S' | '15S' | '30S' | '1M' | '5M' | '1D' | '1W' | '1M' | '3M'
}

export default function TokenChart({ mint, transactions, currentPrice, timeframe = '5M' }: TokenChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: '#9ca3af',
        fontFamily: 'Space Mono, monospace',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 300,
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#1dd671',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#1dd671',
      wickDownColor: '#ef4444',
      wickUpColor: '#1dd671',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(255,255,255,0.2)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      base: 0,
    })
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    const candles = generateMockCandles(currentPrice)
    candleSeries.setData(candles)

    const volumes = candles.map((candle) => ({
      time: candle.time,
      value: Math.random() * 500 + 10,
      color: candle.open > candle.close ? '#ef4444' : '#1dd671',
    }))
    volumeSeries.setData(volumes)

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 300,
        })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize() // Initial resize

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [mint, currentPrice, timeframe])

  return (
    <div className="flex-1 min-h-0 p-4">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

function generateMockCandles(currentPrice: number) {
  const candles = []
  let base = currentPrice * 0.85
  for (let i = 60; i > 0; i--) {
    const open = base + (Math.random() - 0.5) * (currentPrice * 0.02)
    const close = open + (Math.random() - 0.5) * (currentPrice * 0.04)
    const high = Math.max(open, close) + Math.random() * currentPrice * 0.01
    const low = Math.min(open, close) - Math.random() * currentPrice * 0.01
    candles.push({
      time: Date.now() / 1000 - i * 60,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
    })
    base = close
  }
  return candles
}

