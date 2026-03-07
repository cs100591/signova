/**
 * Supabase Auth Hook — Send Email Handler
 * Supabase calls this endpoint instead of sending its own emails.
 * Configure in: Supabase Dashboard → Authentication → Hooks → Send Email Hook
 * Endpoint: https://signova.me/api/email/auth-hook
 *
 * IMPORTANT: Always return 200. Non-2xx blocks the entire signup flow.
 * Handles: signup, recovery (password reset), magiclink, invite
 *
 * On signup: also triggers Step 1 of the onboarding email sequence.
 */

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { signupConfirmationTemplate, passwordResetTemplate } from '@/lib/emailTemplates.js'
import { welcomeEmail } from '@/lib/emails/onboarding.js'
import { buildUnsubscribeUrl } from '@/lib/emails/unsubscribeToken.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://signova.me'
const FROM = 'Signova <noreply@signova.me>'
const FROM_ONBOARDING = 'Signova <hello@signova.me>'

// Service-role client for writing to onboarding_emails (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Inserts the user into onboarding_emails and sends the Step 1 welcome email.
 * Runs after a successful signup. Errors are caught and logged — never thrown.
 */
async function triggerOnboardingWelcome(user) {
  try {
    const userId = user?.id
    const userEmail = user?.email
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

    if (!userId || !userEmail) return

    // Insert into onboarding sequence (upsert so re-triggers don't duplicate)
    const { error: dbError } = await supabaseAdmin
      .from('onboarding_emails')
      .upsert(
        { user_id: userId, email: userEmail, step: 1, last_sent_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (dbError) {
      console.error('[Onboarding] DB insert error:', dbError.message)
      return
    }

    // Build the welcome email with a personalized unsubscribe link
    const unsubscribeUrl = buildUnsubscribeUrl(userId)
    const { subject, html } = welcomeEmail({ name: userName, unsubscribeUrl })

    const { error: emailError } = await resend.emails.send({
      from: FROM_ONBOARDING,
      to: userEmail,
      subject,
      html,
    })

    if (emailError) {
      console.error('[Onboarding] Welcome email send error:', JSON.stringify(emailError))
      return
    }

    console.log('[Onboarding] Welcome email sent to', userEmail)
  } catch (err) {
    // Never throw — this must not block the signup flow
    console.error('[Onboarding] Unexpected error in triggerOnboardingWelcome:', err.message)
  }
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch (err) {
    console.error('[Auth Hook] Failed to parse body:', err.message)
    return Response.json({ message: 'ok' }, { status: 200 })
  }

  console.log('[Auth Hook] Received payload keys:', Object.keys(body || {}))

  // DB trigger format: { type: 'INSERT', schema: 'auth', table: 'users', record: { id, email, ... } }
  // This is sent by our pg_net trigger on auth.users INSERT
  if (body?.type === 'INSERT' && body?.record?.id) {
    console.log('[Auth Hook] DB trigger signup for:', body.record.email)
    await triggerOnboardingWelcome({
      id: body.record.id,
      email: body.record.email,
    })
    return Response.json({ message: 'ok' }, { status: 200 })
  }

  try {
    const { user, email_data } = body
    const { token_hash, email_action_type } = email_data || {}
    const userEmail = user?.email
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

    console.log('[Auth Hook] action=' + email_action_type + ' email=' + userEmail)

    if (!userEmail) {
      console.error('[Auth Hook] No user email in payload')
      return Response.json({ message: 'ok' }, { status: 200 })
    }

    let template
    let subject

    switch (email_action_type) {
      case 'signup':
      case 'magiclink': {
        const confirmUrl = APP_URL + '/auth/confirm?token_hash=' + token_hash + '&type=' + (email_action_type === 'signup' ? 'email' : 'magiclink')
        const result = signupConfirmationTemplate({ name: userName, confirmUrl })
        template = result.html
        subject = result.subject

        // Trigger onboarding sequence on signup (not on magic link re-send)
        if (email_action_type === 'signup') {
          await triggerOnboardingWelcome(user)
        }
        break
      }

      case 'recovery': {
        const resetUrl = APP_URL + '/auth/reset-password?token_hash=' + token_hash + '&type=recovery'
        const result = passwordResetTemplate({ name: userName, resetUrl })
        template = result.html
        subject = result.subject
        break
      }

      case 'invite': {
        const confirmUrl = APP_URL + '/auth/confirm?token_hash=' + token_hash + '&type=invite'
        const result = signupConfirmationTemplate({ name: userName, confirmUrl })
        template = result.html
        subject = 'You have been invited to Signova'
        break
      }

      default:
        console.log('[Auth Hook] Unknown email_action_type:', email_action_type)
        return Response.json({ message: 'ok' }, { status: 200 })
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject,
      html: template,
    })

    if (error) {
      console.error('[Auth Hook] Resend error:', JSON.stringify(error))
      return Response.json({ message: 'ok' }, { status: 200 })
    }

    console.log('[Auth Hook] Sent', email_action_type, 'email to', userEmail)
    return Response.json({ message: 'ok' }, { status: 200 })

  } catch (err) {
    console.error('[Auth Hook] Unexpected error:', err.message)
    return Response.json({ message: 'ok' }, { status: 200 })
  }
}
