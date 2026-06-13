'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en } from './locales/en'
import { vi } from './locales/vi'

export type Locale = 'en' | 'vi'

const translations = {
  en,
  vi
}

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const resolvePath = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const interpolate = (str: string, params?: Record<string, string | number>): string => {
  if (!params) return str
  return Object.entries(params).reduce((acc, [key, val]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val))
  }, str)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('silentop_locale') as Locale
    if (saved === 'en' || saved === 'vi') {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('silentop_locale', newLocale)
  }

  const t = (path: string, params?: Record<string, string | number>): string => {
    const currentTranslations = translations[locale] || translations['vi']
    let val = resolvePath(currentTranslations, path)

    // Fallback to English if Vietnamese value not found
    if (val === undefined && locale !== 'en') {
      val = resolvePath(translations['en'], path)
    }

    if (val === undefined) {
      return path
    }

    if (typeof val !== 'string') {
      return path
    }

    return interpolate(val, params)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
export { en, vi }
