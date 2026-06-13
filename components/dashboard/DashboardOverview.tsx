'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Layers,
  ArrowUpRight,
  Plus,
  ArrowUp,
  ArrowDown,
  Scale,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { Trade, TradingAccount } from '@/types/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { calculateStats, getEquityCurve } from '@/lib/analytics/calculations'
import { formatCurrency, formatPercent, getProfitClass } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ManageAccounts } from './ManageAccounts'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface DashboardOverviewProps {
  trades: Trade[]
  user: SupabaseUser
  accounts: TradingAccount[]
}

export function DashboardOverview({ trades, user, accounts }: DashboardOverviewProps) {
  const { locale, t } = useTranslation()
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false)

  const filteredTrades = selectedAccountId === 'all'
    ? trades
    : trades.filter((t) => t.account_id === selectedAccountId)

  const selectedAccount = selectedAccountId === 'all'
    ? null
    : accounts.find(a => a.id === selectedAccountId)

  const startingBalance = selectedAccount
    ? Number(selectedAccount.starting_balance ?? 100000)
    : 0

  const stats = calculateStats(filteredTrades)
  const equityData = getEquityCurve(filteredTrades, startingBalance)

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Trader'
  const accountLabel = selectedAccount ? selectedAccount.name : (locale === 'en' ? 'All Accounts' : 'Tất cả tài khoản')

  const statCards = [
    {
      title: t('dashboard.stats.netProfit'),
      value: formatCurrency(stats.netPnL),
      icon: stats.netPnL >= 0 ? TrendingUp : TrendingDown,
      color: stats.netPnL >= 0 ? 'var(--success)' : 'var(--danger)',
      iconColor: stats.netPnL >= 0 ? 'var(--success)' : 'var(--danger)',
      glowColor: stats.netPnL >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
      desc: `${locale === 'en' ? 'Total' : 'Tổng'}: ${formatCurrency(stats.totalProfit)} / -${formatCurrency(stats.totalLoss)}`
    },
    {
      title: t('dashboard.stats.winRate'),
      value: formatPercent(stats.winRate),
      icon: Percent,
      color: 'var(--text)',
      iconColor: 'var(--primary-light)',
      glowColor: 'rgba(124, 58, 237, 0.08)',
      desc: t('dashboard.stats.winsLosses', { wins: stats.winCount, losses: stats.lossCount })
    },
    {
      title: t('dashboard.stats.profitFactor'),
      value: stats.profitFactor.toFixed(2),
      icon: Scale,
      color: 'var(--text)',
      iconColor: 'var(--accent)',
      glowColor: 'rgba(6, 182, 212, 0.08)',
      desc: stats.profitFactor >= 2 
        ? (locale === 'en' ? 'Excellent risk reward' : 'Tỷ lệ Lợi nhuận/Rủi ro tốt') 
        : (locale === 'en' ? 'Room to improve' : 'Cần cải thiện thêm')
    },
    {
      title: locale === 'en' ? 'Total Trades' : 'Tổng số lệnh',
      value: stats.totalTrades.toString(),
      icon: Activity,
      color: 'var(--text)',
      iconColor: 'var(--text-secondary)',
      glowColor: 'rgba(148, 163, 184, 0.08)',
      desc: stats.streak > 0 
        ? (locale === 'en' ? `Streak: +${stats.streak} Wins` : `Chuỗi thắng: +${stats.streak}`) 
        : stats.streak < 0 
          ? (locale === 'en' ? `Streak: ${stats.streak} Losses` : `Chuỗi thua: ${stats.streak}`) 
          : (locale === 'en' ? 'No active streak' : 'Không có chuỗi thắng/thua')
    }
  ]

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="text-sm"
          style={{
            background: 'rgba(18, 18, 26, 0.95)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{payload[0].payload.date}</p>
          <p className="font-semibold text-white font-mono">
            {locale === 'en' ? 'Balance' : 'Số dư'}: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-overview-fs animate-fade-in">
      {/* Welcome banner */}
      <div className="dashboard-header-row" style={{ justifyContent: 'flex-end' }}>
        {/* Account Filter Dropdown + Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          <button
            onClick={() => setManageAccountsOpen(true)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              height: '2.25rem',
              width: '2.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
            title={t('common.accounts.manage')}
          >
            <Settings style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>

      <ManageAccounts
        open={manageAccountsOpen}
        onClose={() => setManageAccountsOpen(false)}
        accounts={accounts}
        onAccountsChanged={() => window.location.reload()}
      />

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', width: '100%' }}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="card relative overflow-hidden group"
            style={{ padding: '0.75rem 1rem' }}
          >
            <div className="flex items-start justify-between relative" style={{ zIndex: 10 }}>
              <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                <span className="stat-card-title">
                  {card.title}
                </span>
                <span
                  className="stat-card-value font-mono"
                  style={{ color: card.color }}
                >
                  {card.value}
                </span>
              </div>
              <div
                className="stat-card-icon-box"
                style={{
                  background: card.glowColor,
                  borderColor: card.glowColor,
                  color: card.iconColor
                }}
              >
                <card.icon style={{ width: '1.125rem', height: '1.125rem' }} />
              </div>
            </div>
            <p className="stat-card-desc relative" style={{ zIndex: 10, marginTop: '0.25rem' }}>
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Section */}
      <div className="dashboard-grid-fs">
        {/* Equity Curve Chart */}
        <div className="card dashboard-card-fs" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{t('dashboard.charts.equityCurve')}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {locale === 'en' 
                ? `Accumulated growth starting from ${formatCurrency(startingBalance)} balance` 
                : `Tăng trưởng tích lũy bắt đầu từ số dư ${formatCurrency(startingBalance)}`}
            </p>
          </div>
          <div className="dashboard-card-content-fs">
            {trades.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <Layers style={{ width: '2.5rem', height: '2.5rem', marginBottom: '0.5rem', strokeWidth: 1 }} />
                <p className="text-sm">{locale === 'en' ? 'No trades imported yet.' : 'Chưa có dữ liệu giao dịch.'}</p>
                <p className="text-xs" style={{ marginTop: '0.25rem' }}>{locale === 'en' ? 'Import a CSV file to generate your equity curve.' : 'Nhập tệp CSV để tạo biểu đồ tài khoản.'}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={equityData}
                  margin={{ top: 10, right: 5, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(124, 58, 237, 0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--primary-light)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trade distribution / stats */}
        <div className="card dashboard-card-fs" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
              {locale === 'en' ? 'Performance Metrics' : 'Chỉ số hiệu suất'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {locale === 'en' ? 'Historical extremes and ratio analytics' : 'Phân tích tỷ lệ và các mức cực trị lịch sử'}
            </p>
          </div>

          <div className="dashboard-card-scroll-fs" style={{ paddingRight: '0.25rem' }}>
            <div className="metrics-list" style={{ gap: '0.5rem', padding: 0 }}>
              <div className="metric-row" style={{ paddingBottom: '0.5rem' }}>
                <span className="metric-label">{locale === 'en' ? 'Average Win' : 'Lợi nhuận TB'}</span>
                <span className="metric-value font-mono" style={{ color: 'var(--success)' }}>
                  +{formatCurrency(stats.avgWin)}
                </span>
              </div>
              <div className="metric-row" style={{ paddingBottom: '0.5rem' }}>
                <span className="metric-label">{locale === 'en' ? 'Average Loss' : 'Thua lỗ TB'}</span>
                <span className="metric-value font-mono" style={{ color: 'var(--danger)' }}>
                  -{formatCurrency(stats.avgLoss)}
                </span>
              </div>
              <div className="metric-row" style={{ paddingBottom: '0.5rem' }}>
                <span className="metric-label">{locale === 'en' ? 'Best Trade' : 'Lệnh thắng lớn nhất'}</span>
                <span className="metric-value font-mono" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ArrowUp style={{ width: '0.75rem', height: '0.75rem' }} />
                  {formatCurrency(stats.bestTrade)}
                </span>
              </div>
              <div className="metric-row" style={{ paddingBottom: '0.5rem' }}>
                <span className="metric-label">{locale === 'en' ? 'Worst Trade' : 'Lệnh thua lớn nhất'}</span>
                <span className="metric-value font-mono" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ArrowDown style={{ width: '0.75rem', height: '0.75rem' }} />
                  {formatCurrency(stats.worstTrade)}
                </span>
              </div>
              <div className="metric-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className="metric-label">{locale === 'en' ? 'Max Drawdown' : 'Sụt giảm tài khoản lớn nhất'}</span>
                <span className="metric-value font-mono text-amber-500">
                  -{formatCurrency(stats.maxDrawdown)}
                </span>
              </div>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '0.5rem' }}>
            <Layers className="shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.7rem', lineHeight: '1.4' }}>
              {locale === 'en' 
                ? 'Avg win size is greater than avg loss. This maintains profitability.' 
                : 'Lợi nhuận trung bình lớn hơn thua lỗ trung bình. Điều này giúp duy trì lợi nhuận.'}
            </p>
          </div>
        </div>

        {/* Recent Trades Table (Spans full width at bottom) */}
        <div className="card dashboard-card-fs" style={{ gridColumn: 'span 2', padding: '1.25rem' }}>
          <div className="table-header-row" style={{ marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{t('dashboard.table.recentTrades')}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {locale === 'en' ? 'Latest trading records' : 'Các giao dịch mới nhất'}
              </p>
            </div>
            <Link
              href="/dashboard/trades"
              className="text-xs flex items-center"
              style={{ color: 'var(--primary-light)', textDecoration: 'none', gap: '0.25rem' }}
            >
              {locale === 'en' ? 'View All' : 'Xem tất cả'}
              <ArrowUpRight style={{ width: '0.875rem', height: '0.875rem' }} />
            </Link>
          </div>

          <div className="dashboard-card-scroll-fs">
            <table className="trades-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.symbol')}</th>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.type')}</th>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.lots')}</th>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.openPrice')}</th>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.closePrice')}</th>
                  <th style={{ padding: '0.5rem 1rem' }}>{t('dashboard.table.closeTime')}</th>
                  <th style={{ padding: '0.5rem 1rem' }} className="text-right">{t('dashboard.table.profit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                      {t('dashboard.table.noTrades')}
                    </td>
                  </tr>
                ) : (
                  trades.slice(0, 10).map((trade) => {
                    const isBuy = trade.direction === 'buy'
                    const pnlClass = getProfitClass(trade.profit)
                    return (
                      <tr key={trade.id} style={{ height: '2.5rem' }}>
                        <td style={{ padding: '0.35rem 1rem' }} className="font-semibold">
                          {trade.symbol}
                        </td>
                        <td style={{ padding: '0.35rem 1rem' }}>
                          <span
                            className={cn(
                              'trade-badge',
                              isBuy ? 'trade-badge-buy' : 'trade-badge-sell'
                            )}
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td style={{ padding: '0.35rem 1rem' }} className="font-mono">{Number(trade.lots).toFixed(2)}</td>
                        <td style={{ padding: '0.35rem 1rem' }} className="font-mono">${Number(trade.open_price).toLocaleString()}</td>
                        <td style={{ padding: '0.35rem 1rem' }} className="font-mono">${Number(trade.close_price).toLocaleString()}</td>
                        <td className="text-xs" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(trade.close_time).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.35rem 1rem' }} className={cn('text-right font-semibold font-mono', pnlClass)}>
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
        </div>
      </div>
    </div>
  )
}
