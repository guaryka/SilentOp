'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Percent,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { Trade, TradingAccount } from '@/types/supabase'
import { formatCurrency, formatPercent, getProfitClass } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface TradesViewProps {
  initialTrades: Trade[]
  accounts: TradingAccount[]
}

export function TradesView({ initialTrades, accounts }: TradesViewProps) {
  const { locale, t } = useTranslation()
  const [trades] = useState<Trade[]>(initialTrades)
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = 15

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Account filter
      if (selectedAccountId !== 'all' && trade.account_id !== selectedAccountId) {
        return false
      }
      // Direction filter
      if (directionFilter !== 'all' && trade.direction !== directionFilter) {
        return false
      }
      // Search term (symbol)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase()
        const matchesSymbol = trade.symbol.toLowerCase().includes(term)
        const matchesTicket = trade.ticket?.toLowerCase().includes(term) || false
        if (!matchesSymbol && !matchesTicket) {
          return false
        }
      }
      return true
    })
  }, [trades, selectedAccountId, directionFilter, searchTerm])

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredTrades.length
    if (total === 0) {
      return {
        totalProfit: 0,
        winRate: 0,
        wins: 0,
        losses: 0,
        avgWin: 0,
        avgLoss: 0,
        totalLots: 0,
        profitFactor: 0
      }
    }

    let totalProfit = 0
    let winsCount = 0
    let lossesCount = 0
    let totalLots = 0
    let sumWins = 0
    let sumLosses = 0

    filteredTrades.forEach((t) => {
      const p = Number(t.profit)
      totalProfit += p
      totalLots += Number(t.lots)
      if (p > 0) {
        winsCount++
        sumWins += p
      } else {
        lossesCount++
        sumLosses += Math.abs(p)
      }
    })

    const winRate = total > 0 ? (winsCount / total) * 100 : 0
    const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? 99.9 : 0

    return {
      totalProfit,
      winRate,
      wins: winsCount,
      losses: lossesCount,
      avgWin: winsCount > 0 ? sumWins / winsCount : 0,
      avgLoss: lossesCount > 0 ? sumLosses / lossesCount : 0,
      totalLots,
      profitFactor
    }
  }, [filteredTrades])

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage)
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTrades.slice(start, start + itemsPerPage)
  }, [filteredTrades, currentPage])

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [selectedAccountId, directionFilter, searchTerm])

  return (
    <div className="scrollable-page" style={{ padding: '0 0.5rem 2rem 0' }}>
      <div className="dashboard-overview-fs animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'auto' }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' }}>
          {/* Net Profit */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-sm)',
                background: stats.totalProfit >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stats.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)'
              }}
            >
              {stats.totalProfit >= 0 ? (
                <TrendingUp style={{ width: '1.5rem', height: '1.5rem' }} />
              ) : (
                <TrendingDown style={{ width: '1.5rem', height: '1.5rem' }} />
              )}
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('dashboard.stats.netProfit')}</p>
              <h3 className={cn('text-lg font-bold font-mono', getProfitClass(stats.totalProfit))} style={{ margin: '0.125rem 0 0 0' }}>
                {stats.totalProfit >= 0 ? '+' : ''}
                {formatCurrency(stats.totalProfit)}
              </h3>
            </div>
          </div>

          {/* Win Rate */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(124, 58, 237, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)'
              }}
            >
              <Percent style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('dashboard.stats.winRate')}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.125rem 0 0 0', color: 'var(--text)' }}>
                {formatPercent(stats.winRate)}
              </h3>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                {t('dashboard.stats.winsLosses', { wins: stats.wins, losses: stats.losses })}
              </p>
            </div>
          </div>

          {/* Profit Factor */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(8, 145, 178, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <Activity style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('dashboard.stats.profitFactor')}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.125rem 0 0 0', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {stats.profitFactor === 99.9 ? '99.9+' : stats.profitFactor.toFixed(2)}
              </h3>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                {locale === 'en' ? 'Volume' : 'Khối lượng'}: {stats.totalLots.toFixed(2)} Lots
              </p>
            </div>
          </div>

          {/* Avg Win/Loss */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <BookOpen style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('dashboard.stats.avgWinLoss')}</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.125rem 0 0 0', color: 'var(--text)' }}>
                <span className="profit-class">+{formatCurrency(stats.avgWin)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0.25rem' }}>/</span>
                <span className="loss-class">-{formatCurrency(stats.avgLoss)}</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Account Selector */}
            <div style={{ width: '14rem' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                {t('dashboard.filters.accountFilter')}
              </label>
              <Select
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                options={[
                  { value: 'all', label: locale === 'en' ? 'All Accounts' : 'Tất cả tài khoản' },
                  ...accounts.map((acc) => ({
                    value: acc.id,
                    label: acc.name
                  }))
                ]}
              />
            </div>

            {/* Direction Selector */}
            <div style={{ width: '8rem' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                {t('dashboard.filters.direction')}
              </label>
              <Select
                value={directionFilter}
                onChange={(val) => setDirectionFilter(val)}
                options={[
                  { value: 'all', label: t('dashboard.filters.allDirections') },
                  { value: 'buy', label: t('dashboard.filters.buy') },
                  { value: 'sell', label: t('dashboard.filters.sell') }
                ]}
              />
            </div>

            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '12rem', position: 'relative' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                {t('trades.filters.searchTicketSymbol')}
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '0.875rem',
                    height: '0.875rem',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder={t('trades.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{
                    paddingLeft: '2.25rem',
                    height: '2.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trades Table Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="trades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>{t('dashboard.table.closeTime')}</th>
                  <th>{t('dashboard.table.ticket')}</th>
                  <th>{t('dashboard.table.symbol')}</th>
                  <th>{t('dashboard.filters.direction')}</th>
                  <th>{t('dashboard.table.lots')}</th>
                  <th>{t('dashboard.table.openPrice')}</th>
                  <th>{t('dashboard.table.closePrice')}</th>
                  <th>{t('dashboard.table.profit')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', color: 'var(--text-muted)' }} />
                        <span>{t('trades.table.emptyState')}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTrades.map((trade) => {
                    const isBuy = trade.direction === 'buy'
                    const pnlClass = getProfitClass(trade.profit)

                    return (
                      <tr key={trade.id} style={{ height: '3rem' }}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(trade.close_time).toLocaleString()}
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                          {trade.ticket || '—'}
                        </td>
                        <td className="font-semibold" style={{ color: 'var(--text)' }}>
                          {trade.symbol}
                        </td>
                        <td>
                          <span className={cn('trade-badge', isBuy ? 'trade-badge-buy' : 'trade-badge-sell')}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="font-mono">{Number(trade.lots).toFixed(2)}</td>
                        <td className="font-mono">${Number(trade.open_price).toLocaleString()}</td>
                        <td className="font-mono">${Number(trade.close_price).toLocaleString()}</td>
                        <td className={cn('font-semibold font-mono', pnlClass)}>
                          {trade.profit >= 0 ? '+' : ''}
                          {formatCurrency(trade.profit)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('trades.table.showingPage', { current: currentPage, total: totalPages, count: filteredTrades.length })}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 0.5rem',
                    height: '2rem',
                    minWidth: '2rem',
                    fontSize: '0.75rem'
                  }}
                >
                  <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 0.5rem',
                    height: '2rem',
                    minWidth: '2rem',
                    fontSize: '0.75rem'
                  }}
                >
                  <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
