/**
 * Supabase Auth Hook — Send Email Handler
 * Supabase calls this endpoint instead of sending its own emails.
 * Configure in: Supabase Dashboard → Authentication → Hooks → Send Email Hook
 * Endpoint: https://signova.me/api/email/auth-hook
 *
 * Handles: signup, recovery (password reset), magiclink, invite
 */

import { Resend } from 'resend'
import { signupConfirmationTemplate, passwordResetTemplate } from '@/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://signova.me'
const FROM = 'Signova <noreply@signova.me>'

export async function POST(request) {
  try {
    // Verify Supabase hook secret
    const hookSecret = process.env.SUPABASE_HOOK_SECRET
    if (hookSecret) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${hookSecret}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { user, email_data } = body

    // email_data contains: token, token_hash, redirect_to, email_action_type
    const { token_hash, email_action_type } = email_data || {}
    const userEmail = user?.email
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

    if (!userEmail) {
      return Response.json({ error: 'No user email' }, { status: 400 })
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
        // Workspace invitations are handled by /api/email directly
        // For Supabase invites, fall back to signup confirmation style
        const confirmUrl = `${APP_URL}/auth/confirm?token_hash=${token_hash}&type=invite`
        const result = signupConfirmationTemplate({
          name: userName,
          confirmUrl,
        })
        template = result.html
        subject = 'You have been invited to Signova'
        break
      }

      default:
        console.log(`[Auth Hook] Unknown email_action_type: ${email_action_type}`)
        return Response.json({ message: 'Unhandled email type' }, { status: 200 })
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject,
      html: template,
    })

    if (error) {
      console.error('[Auth Hook] Resend error:', error)
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }

    console.log(`[Auth Hook] Sent ${email_action_type} email to ${userEmail}`)
    return Response.json({ message: 'Email sent' }, { status: 200 })

  } catch (err) {
    console.error('[Auth Hook] Error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
