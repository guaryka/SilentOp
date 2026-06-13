-- =============================================
-- SilentOp Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading accounts
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'csv' CHECK (platform IN ('mt5', 'topstep', 'the5er_mt5', 'csv', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  account_id TEXT,
  api_key_encrypted TEXT,
  starting_balance NUMERIC(20, 2) DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
  ticket TEXT,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  open_time TIMESTAMPTZ NOT NULL,
  close_time TIMESTAMPTZ NOT NULL,
  open_price NUMERIC(20, 5) NOT NULL DEFAULT 0,
  close_price NUMERIC(20, 5) NOT NULL DEFAULT 0,
  lots NUMERIC(10, 2) NOT NULL DEFAULT 0.01,
  profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  commission NUMERIC(15, 2) NOT NULL DEFAULT 0,
  swap NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sl NUMERIC(20, 5),
  tp NUMERIC(20, 5),
  pips NUMERIC(10, 1),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket, user_id)
);

-- Journal entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  content TEXT,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  setup_tags TEXT[] DEFAULT '{}',
  mistake_tags TEXT[] DEFAULT '{}',
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trading accounts policies
CREATE POLICY "Users can manage own accounts" ON public.trading_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Trades policies
CREATE POLICY "Users can manage own trades" ON public.trades
  FOR ALL USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can manage own journal entries" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON public.trades(close_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_close ON public.trades(user_id, close_time DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries(user_id, date);
