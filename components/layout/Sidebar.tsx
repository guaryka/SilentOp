'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sun,
  Moon,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'

const navGroups = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard },
      { href: '/dashboard/calendar', icon: Calendar },
      { href: '/dashboard/analytics', icon: BarChart3 },
      { href: '/dashboard/trades', icon: List },
      { href: '/dashboard/journal', icon: BookOpen },
      { href: '/dashboard/import', icon: Upload }
    ]
  },
  {
    title: 'Configuration',
    items: [
      { href: '/dashboard/settings', icon: Settings }
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? '72px' : '240px',
      }}
    >
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          {/* Logo container matching mockup style */}
          <div className="sidebar-logo-box">
            <img 
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.jpg`} 
              alt="SilentOp" 
              className="sidebar-logo-img" 
            />
          </div>
          {!collapsed && (
            <div className="sidebar-title-wrapper">
              <span className="sidebar-title">SilentOp</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navGroups.map((group, groupIdx) => (
          <div key={group.title} className="nav-group-container">
            {/* Divider lines between groups */}
            {groupIdx > 0 && <div className="nav-group-divider" />}
            
            {!collapsed && (
              <span className="nav-group-title">
                {t(`common.nav.${group.title.toLowerCase()}`)}
              </span>
            )}
            
            {group.items.map(({ href, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              const navKey = href === '/dashboard' ? 'overview' : href.split('/').pop() || ''
              const displayLabel = t(`common.nav.${navKey}`)
              
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'nav-item',
                    isActive ? 'nav-item-active' : 'nav-item-inactive'
                  )}
                >
                  <Icon className="nav-item-icon" />
                  
                  {!collapsed && <span className="truncate">{displayLabel}</span>}
                  
                  {/* CSS Tooltip on hover in collapsed mode */}
                  {collapsed && (
                    <span className="sidebar-tooltip">
                      {displayLabel}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer (Theme Toggle) */}
      <div className="sidebar-footer">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? t('common.themes.switchToLight') : t('common.themes.switchToDark')}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="nav-item-icon" style={{ color: 'var(--warning)' }} />
                {!collapsed && <span className="truncate">{t('common.themes.light')}</span>}
              </>
            ) : (
              <>
                <Moon className="nav-item-icon" style={{ color: 'var(--primary-light)' }} />
                {!collapsed && <span className="truncate">{t('common.themes.dark')}</span>}
              </>
            )}
          </button>
        )}
      </div>

      {/* Floating Collapse Toggle Button on the border */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="sidebar-toggle-border"
      >
        {collapsed ? <ChevronRight style={{ width: '0.875rem', height: '0.875rem' }} /> : <ChevronLeft style={{ width: '0.875rem', height: '0.875rem' }} />}
      </button>
    </aside>
  )
}
