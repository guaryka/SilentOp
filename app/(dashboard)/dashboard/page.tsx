'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { Trade, TradingAccount } from '@/types/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function DashboardPage() {
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          setUser(currentUser)
          
          // Fetch all trades for the user to calculate stats
          const { data: tradesData } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('close_time', { ascending: false })

          // Fetch all trading accounts for filtering on the dashboard
          const { data: accountsData } = await supabase
            .from('trading_accounts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true })

          setTrades(tradesData || [])
          setAccounts(accountsData || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-light)', animation: 'spin-slow 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
        </svg>
      </div>
    )
  }

  return <DashboardOverview trades={trades} user={user} accounts={accounts} />
}
