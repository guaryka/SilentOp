import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatPips(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} pips`
}

export function getProfitClass(value: number): string {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return 'text-[var(--text-muted)]'
}

export function getProfitBgClass(value: number): string {
  if (value > 0) return 'profit-bg'
  if (value < 0) return 'loss-bg'
  return ''
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
