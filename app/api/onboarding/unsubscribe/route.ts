/**
 * GET /api/onboarding/unsubscribe?token=xxx
 *
 * Verifies the HMAC token and marks the user's onboarding sequence as completed.
 * Redirects to /unsubscribe?success=1 or /unsubscribe?error=1.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/emails/unsubscribeToken.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing', request.url))
  }

  const userId = verifyUnsubscribeToken(token)
  if (!userId) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid', request.url))
  }

  const { error } = await supabase
    .from('onboarding_emails')
    .update({ completed: true })
    .eq('user_id', userId)

  if (error) {
    console.error('[Unsubscribe] DB update error:', error.message)
    return NextResponse.redirect(new URL('/unsubscribe?error=server', request.url))
  }

  console.log('[Unsubscribe] User', userId, 'unsubscribed from onboarding sequence')
  return NextResponse.redirect(new URL('/unsubscribe?success=1', request.url))
}
