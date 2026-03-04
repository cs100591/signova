/**
 * Supabase Auth Hook — Send Email Handler
 * Supabase calls this endpoint instead of sending its own emails.
 * Configure in: Supabase Dashboard → Authentication → Hooks → Send Email Hook
 * Endpoint: https://signova.me/api/email/auth-hook
 *
 * IMPORTANT: Always return 200. Non-2xx blocks the entire signup flow.
 * Handles: signup, recovery (password reset), magiclink, invite
 */

import { Resend } from 'resend'
import { signupConfirmationTemplate, passwordResetTemplate } from '@/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://signova.me'
const FROM = 'Signova <noreply@signova.me>'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch (err) {
    console.error('[Auth Hook] Failed to parse body:', err.message)
    return Response.json({ message: 'ok' }, { status: 200 })
  }

  console.log('[Auth Hook] Received payload keys:', Object.keys(body || {}))

  try {
    const { user, email_data } = body
    const { token_hash, email_action_type } = email_data || {}
    const userEmail = user?.email
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

    console.log(`[Auth Hook] action=${email_action_type} email=${userEmail}`)

    if (!userEmail) {
      console.error('[Auth Hook] No user email in payload')
      return Response.json({ message: 'ok' }, { status: 200 })
    }

    let template
    let subject

    switch (email_action_type) {
      case 'signup':
      case 'magiclink': {
        const confirmUrl = `${APP_URL}/auth/confirm?token_hash=${token_hash}&type=${email_action_type === 'signup' ? 'email' : 'magiclink'}`
        const result = signupConfirmationTemplate({ name: userName, confirmUrl })
        template = result.html
        subject = result.subject
        break
      }

      case 'recovery': {
        const resetUrl = `${APP_URL}/auth/reset-password?token_hash=${token_hash}&type=recovery`
        const result = passwordResetTemplate({ name: userName, resetUrl })
        template = result.html
        subject = result.subject
        break
      }

      case 'invite': {
        const confirmUrl = `${APP_URL}/auth/confirm?token_hash=${token_hash}&type=invite`
        const result = signupConfirmationTemplate({ name: userName, confirmUrl })
        template = result.html
        subject = 'You have been invited to Signova'
        break
      }

      default:
        console.log(`[Auth Hook] Unknown email_action_type: ${email_action_type}`)
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
      // Still return 200 — signup must not be blocked by email failure
      return Response.json({ message: 'ok' }, { status: 200 })
    }

    console.log(`[Auth Hook] Sent ${email_action_type} email to ${userEmail}`)
    return Response.json({ message: 'ok' }, { status: 200 })

  } catch (err) {
    console.error('[Auth Hook] Unexpected error:', err.message)
    // Always return 200 so Supabase doesn't block the signup
    return Response.json({ message: 'ok' }, { status: 200 })
  }
}
