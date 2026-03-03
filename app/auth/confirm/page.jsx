'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { supabaseClient } from '@/lib/supabase'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'email'

  const [status, setStatus] = useState('loading') // loading | success | error
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token_hash) {
      setError('Invalid or missing confirmation link.')
      setStatus('error')
      return
    }

    const verify = async () => {
      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash,
        type,
      })

      if (error) {
        setError(error.message || 'Verification failed. The link may have expired.')
        setStatus('error')
      } else {
        setStatus('success')
        setTimeout(() => router.replace('/contracts'), 2000)
      }
    }

    verify()
  }, [token_hash, type, router])

  const handleResend = async () => {
    setResending(true)
    const email = prompt('Enter your email address to resend the verification link:')
    if (!email) { setResending(false); return }

    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
    })

    setResending(false)
    if (!error) setResent(true)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          Signo<span style={{ color: '#c8873a' }}>va</span>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div style={styles.content}>
            <Loader2 size={40} color="#c8873a" style={{ animation: 'spin 1s linear infinite' }} />
            <h1 style={styles.title}>Verifying your email…</h1>
            <p style={styles.subtitle}>Just a moment.</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div style={styles.content}>
            <CheckCircle2 size={48} color="#16a34a" />
            <h1 style={styles.title}>Email verified!</h1>
            <p style={styles.subtitle}>Redirecting you to your dashboard…</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={styles.content}>
            <XCircle size={48} color="#dc2626" />
            <h1 style={{ ...styles.title, color: '#dc2626' }}>Link expired or invalid</h1>
            <p style={styles.subtitle}>{error}</p>

            {!resent ? (
              <button
                onClick={handleResend}
                disabled={resending}
                style={styles.button}
              >
                {resending ? (
                  <><Loader2 size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />Sending…</>
                ) : (
                  <><Mail size={16} style={{ marginRight: 8 }} />Resend Verification Email</>
                )}
              </button>
            ) : (
              <p style={{ color: '#16a34a', fontWeight: 500 }}>
                ✓ New verification email sent. Check your inbox.
              </p>
            )}

            <a href="/login" style={styles.link}>← Back to Login</a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e8e0d0',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(26,23,20,0.06)',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1714',
    marginBottom: '32px',
    letterSpacing: '-0.3px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a1714',
    margin: '0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b6560',
    margin: '0',
    lineHeight: '1.5',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#c8873a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    width: '100%',
  },
  link: {
    color: '#9b9590',
    fontSize: '14px',
    textDecoration: 'none',
    marginTop: '8px',
  },
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#fafdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#c8873a" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
