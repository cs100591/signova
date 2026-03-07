/**
 * GET /api/admin/onboarding-preview?step=1
 *
 * Renders an onboarding email template as HTML in the browser.
 * Protected by CRON_SECRET.
 *
 * Usage:
 *   /api/admin/onboarding-preview?step=1   → Welcome email
 *   /api/admin/onboarding-preview?step=2   → How to analyze
 *   ...up to step=7
 *
 * POST with { step, email } → sends that step to a real email address for testing.
 */

import { NextRequest } from 'next/server'
import { ONBOARDING_STEPS, TOTAL_STEPS } from '@/lib/emails/onboarding.js'

const TEST_UNSUB_URL = 'https://signova.me/unsubscribe?token=test-preview-token'
const TEST_NAME = 'Test User'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = request.headers.get('authorization')
  const query = request.nextUrl.searchParams.get('secret')
  return auth === `Bearer ${secret}` || query === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stepParam = request.nextUrl.searchParams.get('step')
  const step = stepParam ? parseInt(stepParam) : 1

  if (step < 1 || step > TOTAL_STEPS) {
    // Show index of all steps
    const links = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)
      .map(s => `<li><a href="?step=${s}&secret=${request.nextUrl.searchParams.get('secret') || ''}">Step ${s}</a></li>`)
      .join('')
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>Onboarding Email Preview</h2>
        <ul>${links}</ul>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const stepConfig = (ONBOARDING_STEPS as Record<number, typeof ONBOARDING_STEPS[1]>)[step]
  if (!stepConfig) {
    return new Response('Step not found', { status: 404 })
  }

  const { html } = stepConfig.fn({ name: TEST_NAME, unsubscribeUrl: TEST_UNSUB_URL })

  // Wrap with a preview bar at the top
  const preview = `
    <div style="background:#1a1714;color:#f5f0e8;padding:12px 20px;font-family:monospace;font-size:13px;display:flex;gap:20px;align-items:center;position:sticky;top:0;z-index:999">
      <strong>📧 Preview — Step ${step} of ${TOTAL_STEPS}</strong>
      <span style="color:#c8873a">Day ${stepConfig.daysAfterSignup === 0 ? '0 (immediate)' : stepConfig.daysAfterSignup}</span>
      ${step > 1 ? `<a href="?step=${step - 1}&secret=${request.nextUrl.searchParams.get('secret') || ''}" style="color:#9a8f82;text-decoration:none">← prev</a>` : ''}
      ${step < TOTAL_STEPS ? `<a href="?step=${step + 1}&secret=${request.nextUrl.searchParams.get('secret') || ''}" style="color:#c8873a;text-decoration:none">next →</a>` : ''}
    </div>
    ${html}
  `

  return new Response(preview, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { step, email, name } = await request.json().catch(() => ({}))

  if (!step || !email) {
    return new Response(JSON.stringify({ error: 'step and email required' }), { status: 400 })
  }

  const stepConfig = (ONBOARDING_STEPS as Record<number, typeof ONBOARDING_STEPS[1]>)[step]
  if (!stepConfig) {
    return new Response(JSON.stringify({ error: 'Invalid step' }), { status: 400 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { subject, html } = stepConfig.fn({ name: name || 'Test User', unsubscribeUrl: TEST_UNSUB_URL })

  const { error } = await resend.emails.send({
    from: 'Signova <hello@signova.me>',
    to: email,
    subject: `[TEST] ${subject}`,
    html,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, message: `Step ${step} sent to ${email}` }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
