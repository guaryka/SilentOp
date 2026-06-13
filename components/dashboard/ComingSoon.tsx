'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wrench, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useTranslation()

  const lowerTitle = title.toLowerCase()
  const displayTitle = t(`common.nav.${lowerTitle}`) !== `common.nav.${lowerTitle}` 
    ? t(`common.nav.${lowerTitle}`) 
    : title

  const displayDesc = description || (
    t(`common.development.${lowerTitle}Desc`) !== `common.development.${lowerTitle}Desc`
      ? t(`common.development.${lowerTitle}Desc`)
      : t('common.development.description')
  )

  return (
    <div className="scrollable-page" style={{ padding: '0 0.5rem 2rem 0' }}>
      <div 
        className="dashboard-overview-fs animate-fade-in" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          height: 'auto'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="card"
          style={{
            maxWidth: '30rem',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-hover)'
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              marginBottom: '0.5rem'
            }}
          >
            <Wrench style={{ width: '2rem', height: '2rem' }} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
              {displayTitle}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {displayDesc}
            </p>
          </div>

          <div style={{ width: '100%', borderBottom: '1px solid var(--border)', margin: '0.5rem 0' }} />

          <Link
            href="/dashboard"
            className="btn btn-variant-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            {t('common.actions.backToOverview')}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
