'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { supabaseClient } from '@/lib/supabase'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'recovery'

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verify the token first
  useEffect(() => {
    if (!token_hash) {
      setVerifyError('Invalid or missing reset link.')
      setVerifying(false)
      return
    }

    const verify = async () => {
      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash,
        type,
      })
      setVerifying(false)
      if (error) {
        setVerifyError(error.message || 'This link has expired or is invalid.')
      } else {
        setVerified(true)
      }
    }

    verify()
  }, [token_hash, type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabaseClient.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || 'Failed to update password.')
    } else {
      setSuccess(true)
      setTimeout(() => router.replace('/contracts'), 2500)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          Signo<span style={{ color: '#c8873a' }}>va</span>
        </div>

        {/* Verifying token */}
        {verifying && (
          <div style={styles.center}>
            <Loader2 size={36} color="#c8873a" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={styles.subtitle}>Verifying reset link…</p>
          </div>
        )}

        {/* Token error */}
        {!verifying && verifyError && (
          <div style={styles.center}>
            <XCircle size={48} color="#dc2626" />
            <h1 style={{ ...styles.title, color: '#dc2626' }}>Link expired or invalid</h1>
            <p style={styles.subtitle}>{verifyError}</p>
            <a href="/login" style={styles.link}>← Back to Login</a>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={styles.center}>
            <CheckCircle2 size={48} color="#16a34a" />
            <h1 style={styles.title}>Password updated!</h1>
            <p style={styles.subtitle}>Redirecting you to your dashboard…</p>
          </div>
        )}

        {/* Reset form */}
        {verified && !success && (
          <>
            <h1 style={styles.title}>Set new password</h1>
            <p style={{ ...styles.subtitle, marginBottom: '28px' }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* New password */}
              <div style={styles.field}>
                <label style={styles.label}>New password</label>
                <div style={styles.inputWrap}>
                  <Lock size={16} color="#9b9590" style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={16} color="#9b9590" /> : <Eye size={16} color="#9b9590" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={styles.field}>
                <label style={styles.label}>Confirm password</label>
                <div style={styles.inputWrap}>
                  <Lock size={16} color="#9b9590" style={styles.inputIcon} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={styles.eyeBtn}
                  >
                    {showConfirm ? <EyeOff size={16} color="#9b9590" /> : <Eye size={16} color="#9b9590" />}
                  </button>
                </div>
              </div>

              {error && (
                <p style={styles.errorMsg}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? (
                  <><Loader2 size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />Updating…</>
                ) : 'Reset Password'}
              </button>
            </form>

            <a href="/login" style={styles.link}>← Back to Login</a>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input:focus { outline: none; border-color: #c8873a !important; box-shadow: 0 0 0 3px rgba(200,135,58,0.12); }
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
    boxShadow: '0 4px 24px rgba(26,23,20,0.06)',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1714',
    marginBottom: '28px',
    letterSpacing: '-0.3px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a1714',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b6560',
    margin: '0',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1714',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 40px 12px 36px',
    border: '1.5px solid #e8e0d0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#1a1714',
    background: '#fafdf5',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#c8873a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    width: '100%',
    fontFamily: 'inherit',
  },
  errorMsg: {
    fontSize: '14px',
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    margin: '0',
  },
  link: {
    display: 'block',
    textAlign: 'center',
    color: '#9b9590',
    fontSize: '14px',
    textDecoration: 'none',
    marginTop: '20px',
  },
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#fafdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#c8873a" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
