'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Mail, TrendingUp, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col items-center" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center justify-center"
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '1rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            boxShadow: '0 0 40px rgba(124, 58, 237, 0.4)'
          }}
        >
          <TrendingUp style={{ width: '2rem', height: '2rem', color: '#ffffff' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>Reset Password</h1>
        <p className="text-sm" style={{ color: '#64748b', marginTop: '0.25rem' }}>Enter your email to receive a reset link</p>
      </div>

      <div className="glass" style={{ borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
        {sent ? (
          <div className="text-center">
            <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
              <div className="flex items-center justify-center" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle style={{ width: '1.75rem', height: '1.75rem', color: '#10b981' }} />
              </div>
            </div>
            <p style={{ color: '#ffffff', fontWeight: 500, marginBottom: '0.25rem' }}>Email sent!</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Check your inbox for the password reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="form-container">
            {error && (
              <div className="feedback-alert feedback-alert-danger">
                <AlertCircle className="shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                <p>{error}</p>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon-left" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="trader@example.com"
                  className={cn('form-input has-icon', errors.email && 'has-error')}
                />
              </div>
              {errors.email && <p className="form-error-msg">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', animation: 'spin-slow 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                  </svg>
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="flex justify-center" style={{ marginTop: '1.5rem' }}>
          <Link href="/auth" className="auth-toggle-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
