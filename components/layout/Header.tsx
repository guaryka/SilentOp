'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export function Header({ user }: { user: SupabaseUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Trader'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // Resolve page title and description dynamically
  const getRouteKey = (path: string): string => {
    if (path === '/dashboard') return 'overview'
    const parts = path.split('/')
    return parts[parts.length - 1]
  }

  const routeKey = getRouteKey(pathname)
  
  let pageTitle = t(`common.nav.${routeKey}`)
  if (pageTitle === `common.nav.${routeKey}`) {
    pageTitle = 'SilentOp'
  }

  let pageDescription = ''
  if (routeKey === 'overview') {
    pageDescription = t('dashboard.header.subtitle')
  } else if (routeKey === 'calendar') {
    pageDescription = t('calendar.header.desc')
  } else if (routeKey === 'trades') {
    pageDescription = t('trades.header.desc')
  } else if (routeKey === 'import') {
    pageDescription = t('import.header.desc')
  } else if (routeKey === 'analytics') {
    pageDescription = t('common.development.analyticsDesc')
  } else if (routeKey === 'journal') {
    pageDescription = t('common.development.journalDesc')
  } else if (routeKey === 'settings') {
    pageDescription = t('common.development.settingsDesc')
  }

  return (
    <header className="header">
      <div className="header-title-section">
        <h1 className="header-title">{pageTitle}</h1>
        {pageDescription && <p className="header-subtitle">{pageDescription}</p>}
      </div>

      <div className="header-actions">
        {/* Language Switcher */}
        <button
          onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
          className="bell-btn"
          style={{ fontSize: '0.8125rem', fontWeight: 700, padding: '0 0.5rem', minWidth: '2.5rem', border: '1px solid var(--border)' }}
          title={locale === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
        >
          {locale === 'en' ? 'EN' : 'VI'}
        </button>

        {/* Notification bell */}
        <div className="user-menu-wrapper" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(v => !v)}
            className="bell-btn"
            style={{ position: 'relative' }}
          >
            <Bell style={{ width: '1.25rem', height: '1.25rem' }} />
            <span className="bell-badge" />
          </button>

          {notificationsOpen && (
            <div className="user-dropdown" style={{ right: 0, width: '16rem', padding: '1rem', textAlign: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                {t('common.notifications.noUpdates')}
              </p>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="user-menu-wrapper" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="user-menu-btn"
          >
            <div className="user-avatar">
              {initials}
            </div>
            <span className="user-name">{displayName}</span>
            <ChevronDown style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <p className="user-dropdown-name">{displayName}</p>
                <p className="user-dropdown-email">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="dropdown-item dropdown-item-danger"
              >
                <LogOut style={{ width: '1rem', height: '1rem' }} />
                {t('common.actions.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
