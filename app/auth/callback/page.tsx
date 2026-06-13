'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/dashboard'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.push(next)
          return
        }
        console.error('Error exchanging code for session:', error)
      }
      
      router.push('/auth?error=auth_callback_failed')
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
      <svg viewBox="0 0 24 24" fill="none" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-light)', animation: 'spin-slow 1s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
      </svg>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-light)', animation: 'spin-slow 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
        </svg>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
