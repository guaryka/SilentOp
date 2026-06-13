import { Trade, TradeStats } from '@/types/supabase'

export function calculateStats(trades: Trade[]): TradeStats {
  if (!trades.length) return {
    totalTrades: 0, winCount: 0, lossCount: 0, winRate: 0,
    totalProfit: 0, totalLoss: 0, netPnL: 0, profitFactor: 0,
    maxDrawdown: 0, avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0, streak: 0,
  }

  const closedTrades = trades.filter(t => t.close_time)
  const wins = closedTrades.filter(t => t.profit > 0)
  const losses = closedTrades.filter(t => t.profit < 0)

  const totalProfit = wins.reduce((sum, t) => sum + t.profit, 0)
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0))
  const netPnL = closedTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)

  // Max drawdown
  let peak = 0, maxDrawdown = 0, running = 0
  for (const t of closedTrades) {
    running += t.profit
    if (running > peak) peak = running
    const dd = peak - running
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Current streak
  let streak = 0
  const sorted = [...closedTrades].sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime())
  if (sorted.length > 0) {
    const dir = sorted[0].profit >= 0 ? 1 : -1
    for (const t of sorted) {
      if ((t.profit >= 0 ? 1 : -1) === dir) streak += dir
      else break
    }
  }

  return {
    totalTrades: closedTrades.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0,
    totalProfit,
    totalLoss,
    netPnL,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
    maxDrawdown,
    avgWin: wins.length ? totalProfit / wins.length : 0,
    avgLoss: losses.length ? totalLoss / losses.length : 0,
    bestTrade: wins.length ? Math.max(...wins.map(t => t.profit)) : 0,
    worstTrade: losses.length ? Math.min(...losses.map(t => t.profit)) : 0,
    streak,
  }
}

export function groupTradesByDate(trades: Trade[]): Record<string, Trade[]> {
  return trades.reduce((acc, trade) => {
    const date = trade.close_time.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)
}

export function getDailyPnL(trades: Trade[]): { date: string; pnl: number; trades: number }[] {
  const grouped = groupTradesByDate(trades)
  return Object.entries(grouped)
    .map(([date, dayTrades]) => ({
      date,
      pnl: dayTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0),
      trades: dayTrades.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getEquityCurve(trades: Trade[], startBalance = 100000): { date: string; balance: number }[] {
  const daily = getDailyPnL(trades)
  let balance = startBalance
  return daily.map(d => {
    balance += d.pnl
    return { date: d.date, balance: Math.round(balance * 100) / 100 }
  })
}
