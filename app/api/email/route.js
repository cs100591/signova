/**
 * Transactional Email API
 * POST /api/email
 * Body: { type, to, data }
 *
 * Types:
 *   workspace_invitation  → invite member to workspace
 *   share_notification    → notify reviewer of shared analysis
 *   comment_notification  → notify contract owner of new comment
 */

import { Resend } from 'resend'
import { getEmailTemplate } from '@/lib/emailTemplates.js'
import { createSupabaseServerClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Signova <noreply@signova.me>'

export async function POST(request) {
  try {
    // Auth check — must be logged in to send emails
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to) {
      return Response.json({ error: 'Missing required fields: type, to' }, { status: 400 })
    }

    // Validate allowed types
    const allowedTypes = [
      'workspace_invitation',
      'share_notification',
      'comment_notification',
    ]
    if (!allowedTypes.includes(type)) {
      return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    const { subject, html } = getEmailTemplate(type, data)

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    })

    if (error) {
      console.error(`[Email API] Resend error for ${type}:`, error)
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }

    console.log(`[Email API] Sent ${type} to ${to}`)
    return Response.json({ message: 'Email sent' }, { status: 200 })

  } catch (err) {
    console.error('[Email API] Error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
