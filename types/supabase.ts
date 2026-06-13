export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'elite'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'elite'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'elite'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          platform: 'mt5' | 'topstep' | 'the5er_mt5' | 'csv' | 'other'
          status: 'active' | 'inactive' | 'error'
          account_id: string | null
          api_key_encrypted: string | null
          starting_balance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          platform?: 'mt5' | 'topstep' | 'the5er_mt5' | 'csv' | 'other'
          status?: 'active' | 'inactive' | 'error'
          account_id?: string | null
          api_key_encrypted?: string | null
          starting_balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          platform?: 'mt5' | 'topstep' | 'the5er_mt5' | 'csv' | 'other'
          status?: 'active' | 'inactive' | 'error'
          account_id?: string | null
          api_key_encrypted?: string | null
          starting_balance?: number
          created_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          ticket: string | null
          symbol: string
          direction: 'buy' | 'sell'
          open_time: string
          close_time: string
          open_price: number
          close_price: number
          lots: number
          profit: number
          commission: number
          swap: number
          sl: number | null
          tp: number | null
          pips: number | null
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          ticket?: string | null
          symbol: string
          direction: 'buy' | 'sell'
          open_time: string
          close_time: string
          open_price: number
          close_price: number
          lots: number
          profit: number
          commission: number
          swap: number
          sl?: number | null
          tp?: number | null
          pips?: number | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          ticket?: string | null
          symbol?: string
          direction?: 'buy' | 'sell'
          open_time?: string
          close_time?: string
          open_price?: number
          close_price?: number
          lots?: number
          profit?: number
          commission?: number
          swap?: number
          sl?: number | null
          tp?: number | null
          pips?: number | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          trade_id: string | null
          date: string
          content: string | null
          mood: number | null
          setup_tags: string[]
          mistake_tags: string[]
          screenshot_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trade_id?: string | null
          date: string
          content?: string | null
          mood?: number | null
          setup_tags?: string[]
          mistake_tags?: string[]
          screenshot_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trade_id?: string | null
          date?: string
          content?: string | null
          mood?: number | null
          setup_tags?: string[]
          mistake_tags?: string[]
          screenshot_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TradingAccount = Database['public']['Tables']['trading_accounts']['Row']
export type Trade = Database['public']['Tables']['trades']['Row']
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

export interface TradeStats {
  totalTrades: number
  winCount: number
  lossCount: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netPnL: number
  profitFactor: number
  maxDrawdown: number
  avgWin: number
  avgLoss: number
  bestTrade: number
  worstTrade: number
  streak: number
}

export type Platform = 'mt5' | 'topstep' | 'the5er_mt5' | 'csv' | 'other'
export type Direction = 'buy' | 'sell'
export type Plan = 'free' | 'pro' | 'elite'
