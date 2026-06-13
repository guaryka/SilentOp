'use client'

import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { Trade } from '@/types/supabase'
import { formatCurrency, getProfitClass } from '@/lib/utils'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { cn } from '@/lib/utils'

import { TradingAccount } from '@/types/supabase'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface CalendarViewProps {
  trades: Trade[]
  accounts: TradingAccount[]
}

export function CalendarView({ trades, accounts }: CalendarViewProps) {
  const { locale, t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Filter trades based on selected account
  const filteredTrades = selectedAccountId === 'all'
    ? trades
    : trades.filter((t) => t.account_id === selectedAccountId)

  // Options states matching references
  const [startFromMonday, setStartFromMonday] = useState(true)
  const [hideWeekends, setHideWeekends] = useState(false)

  // Calendar Calculations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)

  // Find start and end of week boundaries based on settings
  const weekStartOption = hideWeekends || startFromMonday ? 1 : 0 // 1 = Monday, 0 = Sunday
  const gridStart = startOfWeek(monthStart, { weekStartsOn: weekStartOption as any })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: weekStartOption as any })

  // All calendar grid days
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Group trades by date closed for rendering
  const getDayStats = (day: Date) => {
    const dayTrades = filteredTrades.filter((t) => {
      if (!t.close_time) return false
      const closeDate = new Date(t.close_time)
      return isSameDay(closeDate, day)
    })

    const netPnL = dayTrades.reduce((sum, t) => sum + Number(t.profit) + Number(t.commission) + Number(t.swap), 0)
    const totalLots = dayTrades.reduce((sum, t) => sum + Number(t.lots), 0)
    const winTrades = dayTrades.filter((t) => Number(t.profit) > 0)
    const lossTrades = dayTrades.filter((t) => Number(t.profit) < 0)

    return {
      trades: dayTrades,
      netPnL,
      tradeCount: dayTrades.length,
      volume: totalLots,
      winCount: winTrades.length,
      lossCount: lossTrades.length
    }
  }

  // Chunk grid days into weeks of 7 days
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  // Filter weekends if needed
  const filteredWeeks = weeks.map((week) => {
    if (hideWeekends) {
      // 0 = Sunday, 6 = Saturday
      return week.filter((day) => day.getDay() !== 0 && day.getDay() !== 6)
    }
    return week
  })

  // Calculate stats for the current month shown
  const getMonthStats = () => {
    const monthTrades = filteredTrades.filter((t) => {
      if (!t.close_time) return false
      const closeDate = new Date(t.close_time)
      return closeDate >= monthStart && closeDate <= monthEnd
    })

    const totalPnL = monthTrades.reduce((sum, t) => sum + Number(t.profit) + Number(t.commission) + Number(t.swap), 0)
    
    // Days Traded (Unique calendar days with at least 1 trade)
    const uniqueDays = new Set<string>()
    monthTrades.forEach((t) => {
      if (t.close_time) {
        uniqueDays.add(new Date(t.close_time).toDateString())
      }
    })
    const daysTradedCount = uniqueDays.size

    // Win Rate
    const winTrades = monthTrades.filter((t) => Number(t.profit) > 0)
    const winRate = monthTrades.length > 0 ? (winTrades.length / monthTrades.length) * 100 : 0

    // Average PnL per calendar day
    const daysInThisMonth = monthEnd.getDate()
    const avgPnL = daysInThisMonth > 0 ? totalPnL / daysInThisMonth : 0

    // Average PnL per active trading day
    const tradedAvgPnL = daysTradedCount > 0 ? totalPnL / daysTradedCount : 0

    return {
      totalPnL,
      tradeCount: monthTrades.length,
      winRate,
      daysTraded: daysTradedCount,
      avgPnL,
      tradedAvgPnL,
      monthTrades
    }
  }

  const {
    totalPnL,
    tradeCount: monthTradeCount,
    winRate: monthWinRate,
    daysTraded,
    avgPnL,
    tradedAvgPnL,
    monthTrades
  } = getMonthStats()

  // Calculate weekly summary stats (for column 8)
  const getWeeklyStats = (week: Date[]) => {
    let weekPnL = 0
    let weekTradesCount = 0
    
    week.forEach((day) => {
      const stats = getDayStats(day)
      weekPnL += stats.netPnL
      weekTradesCount += stats.tradeCount
    })

    const weekAvg = weekTradesCount > 0 ? weekPnL / weekTradesCount : 0

    return {
      total: weekPnL,
      avg: weekAvg,
      tradeCount: weekTradesCount
    }
  }

  const formatMonth = (date: Date) => {
    if (locale === 'vi') {
      const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ]
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
    return format(date, 'MMMM yyyy')
  }

  const formatSelectedDate = (date: Date) => {
    if (locale === 'vi') {
      return format(date, 'dd/MM/yyyy')
    }
    return format(date, 'MMMM d, yyyy')
  }

  const handleDayClick = (day: Date, dayTrades: Trade[]) => {
    setSelectedDayTrades(dayTrades)
    setSelectedDate(day)
  }

  // Header weekdays columns
  const rawWeekdayLabels = hideWeekends
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Weekly Summary']
    : startFromMonday
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Weekly Summary']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Weekly Summary']

  const getDayLabel = (lbl: string): string => {
    const key = lbl === 'Weekly Summary' ? 'weeklySummary' : lbl.toLowerCase()
    return t(`calendar.days.${key}`)
  }

  const gridCols = hideWeekends ? 6 : 8

  return (
    <div className="scrollable-page" style={{ padding: '0 0.5rem 2rem 0' }}>
      <div className="dashboard-overview-fs animate-fade-in">
        {/* Top Header */}
        <div className="dashboard-header-row" style={{ justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Account Filter Dropdown */}
            <Select
              value={selectedAccountId}
              onChange={(val) => setSelectedAccountId(val)}
              options={[
                { value: 'all', label: t('dashboard.filters.allAccounts', { count: trades.length }) },
                ...accounts.map(acc => {
                  const count = trades.filter(t => t.account_id === acc.id).length
                  return {
                    value: acc.id,
                    label: `${acc.name} (${count})`
                  }
                })
              ]}
              style={{ width: '12rem' }}
            />

            {/* Calendar Month Navigation */}
            <div className="calendar-nav-controls">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="calendar-nav-btn"
              >
                <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
              <span className="calendar-month-label">
                {formatMonth(currentDate)}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="calendar-nav-btn"
              >
                <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column layout: Calendar vs Sidebar Details */}
        <div className="grid-2col" style={{ alignItems: 'stretch' }}>
          {/* Left Column: Calendar Card */}
          <div className="card flex flex-col" style={{ padding: '1.25rem', gap: '1rem', minHeight: 0 }}>
            {/* Calendar Grid wrapper */}
            <div className="calendar-days-container">
              {/* Weekdays Labels Row */}
              <div 
                className="calendar-weekdays-grid" 
                style={{ 
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`
                }}
              >
                {rawWeekdayLabels.map((lbl, idx) => (
                  <div key={lbl} style={{ color: idx === gridCols - 1 ? 'var(--primary-light)' : undefined }}>
                    {getDayLabel(lbl)}
                  </div>
                ))}
              </div>

              {/* Days Grid Rows */}
              <div className="calendar-days-container">
                {filteredWeeks.map((week, weekIdx) => {
                  const weekStats = getWeeklyStats(week)
                  const isWeekProfit = weekStats.total > 0
                  const isWeekLoss = weekStats.total < 0
                  
                  return (
                    <div 
                      key={`week-${weekIdx}`}
                      className="calendar-days-row"
                      style={{ 
                        gridTemplateColumns: `repeat(${gridCols}, 1fr)`
                      }}
                    >
                      {/* Days of the Week */}
                      {week.map((day) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                        const dayStats = getDayStats(day)
                        const isProfit = dayStats.netPnL > 0
                        const isLoss = dayStats.netPnL < 0
                        const isSelected = selectedDate !== null && isSameDay(selectedDate, day)

                        let cellClass = 'day-neutral'

                        if (dayStats.tradeCount > 0) {
                          if (isProfit) {
                            cellClass = 'day-profit'
                          } else if (isLoss) {
                            cellClass = 'day-loss'
                          } else {
                            cellClass = 'day-neutral'
                          }
                        }

                        return (
                          <button
                            key={day.toString()}
                            onClick={() => dayStats.tradeCount > 0 && handleDayClick(day, dayStats.trades)}
                            disabled={dayStats.tradeCount === 0}
                            className={cn('calendar-day-cell', cellClass, isSelected && 'selected')}
                            style={{
                              opacity: isCurrentMonth ? 1 : 0.35,
                              cursor: dayStats.tradeCount > 0 ? 'pointer' : 'default'
                            }}
                          >
                            {/* Top Date Indicator */}
                            <div className="flex justify-between items-center" style={{ width: '100%' }}>
                              <span className="calendar-day-number">
                                {format(day, 'd')}
                              </span>
                            </div>

                            {/* Middle Values */}
                            {dayStats.tradeCount > 0 ? (
                              <div className="flex flex-col text-center" style={{ gap: '0.125rem', margin: 'auto 0' }}>
                                <span className="calendar-cell-pnl-val" 
                                  style={{ color: isProfit ? 'var(--success)' : isLoss ? 'var(--danger)' : 'var(--text)' }}
                                >
                                  {dayStats.netPnL >= 0 ? '+' : ''}
                                  {formatCurrency(dayStats.netPnL)}
                                </span>
                                <span className="calendar-cell-subtext">
                                  {dayStats.tradeCount} {locale === 'en' ? (dayStats.tradeCount === 1 ? 'Trade' : 'Trades') : 'Lệnh'}
                                </span>
                                <span className="calendar-cell-subtext" style={{ color: 'var(--text-secondary)' }}>
                                  W: {dayStats.winCount} L: {dayStats.lossCount}
                                </span>
                              </div>
                            ) : (
                              <div style={{ height: '2.5rem' }} />
                            )}
                          </button>
                        )
                      })}

                      {/* Column 8: Weekly Summary cell */}
                      <div
                        className={cn(
                          'weekly-summary-cell',
                          weekStats.tradeCount > 0 ? (isWeekProfit ? 'profit' : isWeekLoss ? 'loss' : '') : ''
                        )}
                      >
                        <span className="weekly-summary-label">{locale === 'en' ? 'Total' : 'Tổng'}</span>
                        <span className={cn('tv-pill', weekStats.total > 0 ? 'profit' : weekStats.total < 0 ? 'loss' : 'neutral')}>
                          {formatCurrency(weekStats.total)}
                        </span>
                        
                        {weekStats.tradeCount > 0 && weekStats.total !== 0 && (
                          <>
                            <span className="weekly-summary-label" style={{ marginTop: '0.25rem' }}>{locale === 'en' ? 'Avg' : 'TB'}</span>
                            <span className={cn('tv-pill', weekStats.avg > 0 ? 'profit' : weekStats.avg < 0 ? 'loss' : 'neutral')}>
                              {formatCurrency(weekStats.avg)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Controls / Checkboxes */}
            <div className="flex items-center" style={{ gap: '2rem', padding: '0.5rem 0.25rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
              <label className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={startFromMonday}
                  onChange={(e) => setStartFromMonday(e.target.checked)}
                  disabled={hideWeekends}
                  className="form-checkbox"
                  style={{ accentColor: 'var(--primary)' }}
                />
                {t('calendar.controls.startMon')}
              </label>

              <label className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={hideWeekends}
                  onChange={(e) => setHideWeekends(e.target.checked)}
                  className="form-checkbox"
                  style={{ accentColor: 'var(--primary)' }}
                />
                {t('calendar.controls.hideWeekends')}
              </label>
            </div>
          </div>

          {/* Right Column: Selected Date Details Sidebar */}
          <div className="card flex flex-col" style={{ padding: '1.25rem', minHeight: 0 }}>
            {selectedDate ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                    {locale === 'en' 
                      ? `Trades for ${formatSelectedDate(selectedDate)}` 
                      : `Các lệnh giao dịch ngày ${formatSelectedDate(selectedDate)}`}
                  </h4>
                  {(() => {
                    const buyCount = selectedDayTrades.filter(t => t.direction === 'buy').length
                    const sellCount = selectedDayTrades.filter(t => t.direction === 'sell').length
                    const totalVolume = selectedDayTrades.reduce((sum, t) => sum + Number(t.lots), 0)
                    return (
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div>{locale === 'en' ? 'Buy' : 'Mua'}: <strong style={{ color: 'var(--text)' }}>{buyCount}</strong></div>
                        <div>{locale === 'en' ? 'Sell' : 'Bán'}: <strong style={{ color: 'var(--text)' }}>{sellCount}</strong></div>
                        <div>{locale === 'en' ? 'Volume' : 'Khối lượng'}: <strong style={{ color: 'var(--text)' }}>{totalVolume.toFixed(2)} lots</strong></div>
                      </div>
                    )
                  })()}
                </div>

                {/* Table scroll wrapper */}
                <div className="dashboard-card-scroll-fs" style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="trades-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>{t('dashboard.table.symbol')}</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>{t('dashboard.table.type')}</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>{locale === 'en' ? 'Vol' : 'KL'}</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>{locale === 'en' ? 'Entry' : 'Giá vào'}</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>SL</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>TP</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px' }}>{locale === 'en' ? 'Close' : 'Giá đóng'}</th>
                        <th style={{ padding: '0.5rem 0.25rem', fontSize: '10px', textAlign: 'right' }}>{t('dashboard.table.profit')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {selectedDayTrades.map((trade) => {
                        const isBuy = trade.direction === 'buy'
                        const pnlClass = getProfitClass(trade.profit)
                        const slFormatted = trade.sl !== null && trade.sl !== undefined ? Number(trade.sl).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 }) : '-'
                        const tpFormatted = trade.tp !== null && trade.tp !== undefined ? Number(trade.tp).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 }) : '-'
                        return (
                          <tr key={trade.id} style={{ height: '2.5rem' }}>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem' }} className="font-semibold text-white">
                              {trade.symbol}
                            </td>
                            <td style={{ padding: '0.35rem 0.25rem' }}>
                              <span
                                className={cn(
                                  'trade-badge',
                                  isBuy ? 'trade-badge-buy' : 'trade-badge-sell'
                                )}
                                style={{ fontSize: '8px', padding: '0.1rem 0.25rem' }}
                              >
                                {trade.direction}
                              </span>
                            </td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem' }} className="font-mono">{Number(trade.lots).toFixed(2)}</td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem' }} className="font-mono">${Number(trade.open_price).toLocaleString()}</td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">{slFormatted}</td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">{tpFormatted}</td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem' }} className="font-mono">${Number(trade.close_price).toLocaleString()}</td>
                            <td style={{ padding: '0.35rem 0.25rem', fontSize: '0.75rem' }} className={cn('text-right font-semibold font-mono', pnlClass)}>
                              {trade.profit >= 0 ? '+' : ''}
                              {formatCurrency(trade.profit)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', margin: 'auto' }}>
                <Layers style={{ width: '2.5rem', height: '2.5rem', marginBottom: '0.5rem', strokeWidth: 1 }} />
                <p className="text-sm">{locale === 'en' ? 'No date selected.' : 'Chưa chọn ngày.'}</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', maxWidth: '200px' }}>
                  {locale === 'en' 
                    ? 'Click on a day in the calendar to view details.' 
                    : 'Click vào một ngày trên lịch để xem chi tiết.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Monthly Metrics Summary Card */}
        <div className="card flex flex-col" style={{ padding: '1.25rem', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
              {locale === 'en' ? 'Monthly Metrics Summary' : 'Tổng kết chỉ số hàng tháng'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {locale === 'en' 
                ? `Historical calculations for ${formatMonth(currentDate)}` 
                : `Tính toán lịch sử cho ${formatMonth(currentDate)}`}
            </p>
          </div>

          <div className="calendar-bottom-summary">
            {/* Horizontal row of main metrics styled like TradesViz */}
            <div className="calendar-metrics-row">
              <div className="calendar-metric-item">
                <span>{locale === 'en' ? 'DAYS TRADED:' : 'SỐ NGÀY GIAO DỊCH:'}</span>
                <span className="tv-pill info">{daysTraded}</span>
              </div>

              <div className="calendar-metric-item">
                <span>{locale === 'en' ? 'AVG PNL:' : 'PNL TRUNG BÌNH:'}</span>
                <span className={cn('tv-pill', avgPnL > 0 ? 'profit' : avgPnL < 0 ? 'loss' : 'neutral')}>
                  {formatCurrency(avgPnL)}
                </span>
              </div>

              <div className="calendar-metric-item">
                <span>{locale === 'en' ? 'TOTAL PNL:' : 'TỔNG PNL:'}</span>
                <span className={cn('tv-pill', totalPnL > 0 ? 'profit' : totalPnL < 0 ? 'loss' : 'neutral')}>
                  {formatCurrency(totalPnL)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {locale === 'en' ? `(${monthWinRate.toFixed(1)}% Win Rate)` : `(Tỷ lệ thắng ${monthWinRate.toFixed(1)}%)`}
                </span>
              </div>

              <div className="calendar-metric-item">
                <span>{locale === 'en' ? 'TRADED AVG PNL:' : 'PNL TB NGÀY GIAO DỊCH:'}</span>
                <span className={cn('tv-pill', tradedAvgPnL > 0 ? 'profit' : tradedAvgPnL < 0 ? 'loss' : 'neutral')}>
                  {formatCurrency(tradedAvgPnL)}
                </span>
              </div>
            </div>

            {/* Detailed weekly comparison lists */}
            <div className="calendar-weekly-breakdown">
              {/* Weekly Total PnL List */}
              <div className="weekly-breakdown-card">
                <h4 className="weekly-breakdown-title">
                  {locale === 'en' ? 'TOTAL PNL BY WEEK' : 'TỔNG PNL THEO TUẦN'}
                </h4>
                <div className="weekly-breakdown-list">
                  {filteredWeeks.map((week, idx) => {
                    const weekStats = getWeeklyStats(week)
                    const isProfit = weekStats.total > 0
                    const isLoss = weekStats.total < 0
                    
                    return (
                      <div key={`total-week-${idx}`} className="weekly-breakdown-row">
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {locale === 'en' ? `WEEK ${idx + 1}:` : `TUẦN ${idx + 1}:`}
                        </span>
                        <span className={cn('tv-pill', weekStats.tradeCount > 0 ? (isProfit ? 'profit' : isLoss ? 'loss' : 'neutral') : 'neutral')}>
                          {formatCurrency(weekStats.total)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weekly Average PnL List */}
              <div className="weekly-breakdown-card">
                <h4 className="weekly-breakdown-title">
                  {locale === 'en' ? 'AVERAGE PNL BY WEEK' : 'PNL TRUNG BÌNH THEO TUẦN'}
                </h4>
                <div className="weekly-breakdown-list">
                  {filteredWeeks.map((week, idx) => {
                    const weekStats = getWeeklyStats(week)
                    const isProfit = weekStats.avg > 0
                    const isLoss = weekStats.avg < 0

                    return (
                      <div key={`avg-week-${idx}`} className="weekly-breakdown-row">
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {locale === 'en' ? `WEEK ${idx + 1}:` : `TUẦN ${idx + 1}:`}
                        </span>
                        <span className={cn('tv-pill', weekStats.tradeCount > 0 ? (isProfit ? 'profit' : isLoss ? 'loss' : 'neutral') : 'neutral')}>
                          {formatCurrency(weekStats.avg)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
