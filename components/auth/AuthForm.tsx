'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface AuthFormProps {
  defaultTab: 'login' | 'register'
}

export function AuthForm({ defaultTab }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { locale, t } = useTranslation()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // UI states
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Field error states
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    displayName?: string
    confirmPassword?: string
    terms?: string
  }>({})

  const validate = () => {
    const tempErrors: typeof errors = {}
    if (!email) tempErrors.email = t('auth.validation.emailRequired')
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = t('auth.validation.emailInvalid')

    if (!password) tempErrors.password = t('auth.validation.passwordRequired')
    else if (password.length < 6) tempErrors.password = t('auth.validation.passwordMinLength')

    if (tab === 'register') {
      if (!displayName) tempErrors.displayName = t('auth.validation.displayNameRequired')
      else if (displayName.length < 2) tempErrors.displayName = t('auth.validation.displayNameMinLength')

      if (password !== confirmPassword) {
        tempErrors.confirmPassword = t('auth.validation.passwordMismatch')
      }

      if (!agreeTerms) {
        tempErrors.terms = t('auth.validation.termsRequired')
      }
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    if (!validate()) return

    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        })
        if (error) throw error
        setSuccess(true)
      }
    } catch (err: any) {
      console.error('Auth error:', err.message)
      setAuthError(err.message || t('auth.error.failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab)
    setAuthError(null)
    setErrors({})
    setPassword('')
    setConfirmPassword('')
  }

  if (success) {
    return (
      <div className="auth-page animate-fade-in">
        {/* Left column (Visual) */}
        <div className="auth-left">
          {/* Ambient background glows */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '30%',
              width: '24rem',
              height: '24rem',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0) 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(124, 58, 237, 0.08) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none'
            }}
          />

          <div className="auth-graphic-container z-10 relative">
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.jpg`}
              alt="SilentOp Brand"
              className="auth-logo-large"
            />
            <h3 className="auth-title-large">{t('auth.register.welcomeTitle')}</h3>
            <p className="auth-desc-large">{t('auth.register.welcomeDesc')}</p>
          </div>

          <div className="auth-dots z-10 relative">
            <span className="auth-dot active" />
            <span className="auth-dot inactive" />
            <span className="auth-dot inactive" />
          </div>
        </div>

        {/* Right column (Success message) */}
        <div className="auth-right">
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: '24rem',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-hover)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1.5rem',
              background: 'var(--surface)'
            }}
          >
            <div 
              style={{ 
                width: '4rem', 
                height: '4rem', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--success-bg)',
                color: 'var(--success)'
              }}
            >
              <CheckCircle style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
                {t('auth.success.title')}
              </h2>
              <p 
                style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: t('auth.success.desc', { email }) }}
              />
            </div>
            <button
              onClick={() => {
                setSuccess(false)
                handleTabChange('login')
              }}
              className="btn btn-variant-default"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              {t('auth.success.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page animate-fade-in">
      {/* Left column (Visual) */}
      <div className="auth-left">
        {/* Ambient background glows */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '24rem',
            height: '24rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '20%',
            width: '20rem',
            height: '20rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0) 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }}
        />
        
        {/* Subtle grid background overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(124, 58, 237, 0.08) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }}
        />

        {/* Centered Graphic */}
        <div className="auth-graphic-container z-10 relative">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.jpg`}
            alt="SilentOp Brand"
            className="auth-logo-large"
          />
          <h3 className="auth-title-large">
            {tab === 'login' ? t('auth.login.welcomeBack') : t('auth.register.welcomeTitle')}
          </h3>
          <p className="auth-desc-large">
            {tab === 'login'
              ? t('auth.login.welcomeDesc')
              : t('auth.register.welcomeDesc')}
          </p>
        </div>

        {/* Bottom slides indicator mock */}
        <div className="auth-dots z-10 relative">
          <span className={cn('auth-dot', tab === 'login' ? 'active' : 'inactive')} />
          <span className={cn('auth-dot', tab === 'register' ? 'active' : 'inactive')} />
          <span className="auth-dot inactive" />
        </div>
      </div>

      {/* Right column (Forms) */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div 
            className="card"
            style={{
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-hover)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              background: 'var(--surface)',
              width: '100%',
              borderRadius: 'var(--radius)'
            }}
          >
            {/* Header */}
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', margin: 0 }}>
                {tab === 'login' ? t('auth.login.title') : t('auth.register.title')}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.375rem', margin: 0 }}>
                {tab === 'login' ? t('auth.login.subtitle') : t('auth.register.subtitle')}
              </p>
            </div>

            {/* Sliding Pill Tab Selector */}
            <div 
              style={{ 
                display: 'flex', 
                background: 'var(--surface-2)', 
                padding: '0.25rem', 
                borderRadius: 'var(--radius-sm)', 
                position: 'relative',
                border: '1px solid var(--border)'
              }}
            >
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: tab === 'login' ? '#ffffff' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'color 0.2s'
                }}
              >
                {t('auth.login.title')}
                {tab === 'login' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      borderRadius: 'calc(var(--radius-sm) - 2px)',
                      zIndex: -1
                    }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: tab === 'register' ? '#ffffff' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'color 0.2s'
                }}
              >
                {t('auth.register.title')}
                {tab === 'register' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      borderRadius: 'calc(var(--radius-sm) - 2px)',
                      zIndex: -1
                    }}
                  />
                )}
              </button>
            </div>

            {/* Form with exit/enter animation */}
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSubmit}
                className="form-container"
              >
                {authError && (
                  <div className="feedback-alert feedback-alert-danger">
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                    <p>{authError}</p>
                  </div>
                )}

                {/* Display Name (Register only) */}
                {tab === 'register' && (
                  <div className="form-group">
                    <label className="form-label">{t('auth.fields.displayName')}</label>
                    <div className="input-container">
                      <User className="input-icon-left" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t('auth.fields.displayNamePlaceholder')}
                        className={cn('form-input has-icon', errors.displayName && 'has-error')}
                      />
                    </div>
                    {errors.displayName && <p className="form-error-msg">{errors.displayName}</p>}
                  </div>
                )}

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">{t('auth.fields.email')}</label>
                  <div className="input-container">
                    <Mail className="input-icon-left" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.fields.emailPlaceholder')}
                      className={cn('form-input has-icon', errors.email && 'has-error')}
                    />
                  </div>
                  {errors.email && <p className="form-error-msg">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', width: '100%' }}>
                    <label className="form-label">{t('auth.fields.password')}</label>
                    {tab === 'login' && (
                      <Link
                        href="/forgot-password"
                        className="auth-toggle-btn"
                        style={{ fontSize: '10px' }}
                      >
                        {t('auth.fields.forgotPassword')}
                      </Link>
                    )}
                  </div>
                  <div className="input-container">
                    <Lock className="input-icon-left" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.fields.passwordPlaceholder')}
                      className={cn('form-input has-icon', errors.password && 'has-error')}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="input-icon-right"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" style={{ width: '1rem', height: '1rem' }} /> : <Eye className="w-4 h-4" style={{ width: '1rem', height: '1rem' }} />}
                    </button>
                  </div>
                  {errors.password && <p className="form-error-msg">{errors.password}</p>}
                </div>

                {/* Confirm Password (Register only) */}
                {tab === 'register' && (
                  <div className="form-group">
                    <label className="form-label">{t('auth.fields.confirmPassword')}</label>
                    <div className="input-container">
                      <Lock className="input-icon-left" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.fields.passwordPlaceholder')}
                        className={cn('form-input has-icon', errors.confirmPassword && 'has-error')}
                      />
                    </div>
                    {errors.confirmPassword && <p className="form-error-msg">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Terms & Conditions Checkbox (Register only) */}
                {tab === 'register' && (
                  <div className="form-checkbox-group">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="terms" className="form-checkbox-label">
                      {t('auth.fields.agreeTerms')}{' '}
                      <Link href="/terms" className="form-checkbox-link">
                        {t('auth.fields.termsAndConditions')}
                      </Link>
                    </label>
                    {errors.terms && <p className="form-error-msg" style={{ display: 'block' }}>{errors.terms}</p>}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ marginTop: '0.75rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: '1rem', height: '1rem', animation: 'spin-slow 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                      </svg>
                      <span>{tab === 'login' ? (locale === 'en' ? 'Signing In...' : 'Đang đăng nhập...') : (locale === 'en' ? 'Creating Account...' : 'Đang đăng ký...')}</span>
                    </div>
                  ) : (
                    tab === 'login' ? t('auth.login.title') : t('auth.register.title')
                  )}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
