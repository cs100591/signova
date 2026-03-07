/**
 * Unsubscribe token helpers.
 * Uses HMAC-SHA256 with CRON_SECRET to sign/verify user_id.
 * Token format: base64url(userId) + '.' + base64url(hmac)
 */

import { createHmac } from 'crypto'

const APP_URL = 'https://signova.me'

function getSecret() {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new Error('CRON_SECRET env var not set')
  return secret
}

/** Build a signed unsubscribe token for a given user_id */
export function buildUnsubscribeToken(userId) {
  const secret = getSecret()
  const userPart = Buffer.from(userId).toString('base64url')
  const sig = createHmac('sha256', secret).update(userId).digest('base64url')
  return `${userPart}.${sig}`
}

/** Verify a token and return the user_id, or null if invalid */
export function verifyUnsubscribeToken(token) {
  try {
    const [userPart, sig] = token.split('.')
    if (!userPart || !sig) return null
    const userId = Buffer.from(userPart, 'base64url').toString()
    const expectedSig = createHmac('sha256', getSecret()).update(userId).digest('base64url')
    if (sig !== expectedSig) return null
    return userId
  } catch {
    return null
  }
}

/** Build the full unsubscribe URL for a user */
export function buildUnsubscribeUrl(userId) {
  const token = buildUnsubscribeToken(userId)
  return `${APP_URL}/unsubscribe?token=${token}`
}
