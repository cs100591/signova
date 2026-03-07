/**
 * POST /api/onboarding/send
 *
 * Daily cron endpoint. Called by Vercel Cron every day at 9:00 AM UTC (vercel.json).
 * Finds all users due for their next onboarding email and sends it.
 *
 * Auth: Bearer CRON_SECRET header required.
 *
 * Logic per user:
 *   - Check which step they're on (1–6, already sent)
 *   - Calculate how many days since last email
 *   - If >= the delay for the next step → send it, update step + last_sent_at
 *   - If step reaches 7 (final) → mark completed = true
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { ONBOARDING_STEPS, TOTAL_STEPS } from '@/lib/emails/onboarding.js'
import { buildUnsubscribeUrl } from '@/lib/emails/unsubscribeToken.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Signova <hello@signova.me>'

// Service-role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyCronSecret(request: NextRequest): boolean {
  // Vercel cron invocations include this header automatically
  if (request.headers.get('x-vercel-cron') === '1') return true
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[Onboarding Cron] CRON_SECRET not set — skipping auth check')
    return true
  }
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all users with incomplete sequences
    const { data: rows, error: fetchError } = await supabase
      .from('onboarding_emails')
      .select('id, user_id, email, step, last_sent_at')
      .eq('completed', false)
      .lt('step', TOTAL_STEPS)

    if (fetchError) {
      console.error('[Onboarding Cron] Fetch error:', fetchError.message)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No users due' })
    }

    const now = Date.now()
    const sent: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const row of rows) {
      const nextStep = row.step + 1
      const stepConfig = (ONBOARDING_STEPS as Record<number, typeof ONBOARDING_STEPS[1]>)[nextStep]
      if (!stepConfig) continue

      // Calculate days elapsed since the last email
      const lastSentMs = row.last_sent_at ? new Date(row.last_sent_at).getTime() : 0
      const daysSinceLast = (now - lastSentMs) / (1000 * 60 * 60 * 24)

      // Days delay is relative to signup (step 1), so compare against stepConfig.daysAfterSignup
      // We check: days since last email >= gap between current and next step
      const prevStepDays = (ONBOARDING_STEPS as Record<number, typeof ONBOARDING_STEPS[1]>)[row.step]?.daysAfterSignup ?? 0
      const nextStepDays = stepConfig.daysAfterSignup
      const requiredDays = nextStepDays - prevStepDays

      if (daysSinceLast < requiredDays) {
        skipped.push(row.email)
        continue
      }

      try {
        // Fetch user name from Supabase profiles if available
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', row.user_id)
          .single()

        const userName = profile?.full_name || ''
        const unsubscribeUrl = buildUnsubscribeUrl(row.user_id)
        const { subject: finalSubject, html: finalHtml } = stepConfig.fn({ name: userName, unsubscribeUrl })

        // Send email
        const { error: sendError } = await resend.emails.send({
          from: FROM,
          to: row.email,
          subject: finalSubject,
          html: finalHtml,
        })

        if (sendError) {
          console.error('[Onboarding Cron] Send error for', row.email, sendError.message)
          errors.push(row.email)
          continue
        }

        // Update step and mark completed if this was the final email
        const isLastStep = nextStep >= TOTAL_STEPS
        await supabase
          .from('onboarding_emails')
          .update({
            step: nextStep,
            last_sent_at: new Date().toISOString(),
            completed: isLastStep,
          })
          .eq('id', row.id)

        sent.push(`${row.email} (step ${nextStep})`)
        console.log(`[Onboarding Cron] Sent step ${nextStep} to ${row.email}${isLastStep ? ' — sequence complete' : ''}`)

      } catch (err: any) {
        console.error('[Onboarding Cron] Error processing', row.email, err.message)
        errors.push(row.email)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sent.length,
      skipped: skipped.length,
      errors: errors.length,
      detail: { sent, skipped, errors },
    })

  } catch (err: any) {
    console.error('[Onboarding Cron] Unexpected error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow GET for manual testing in browser
export async function GET(request: NextRequest) {
  return POST(request)
}
