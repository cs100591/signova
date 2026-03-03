/**
 * Signova Email Templates
 * All 5 transactional email templates.
 * Sender: noreply@signova.me
 * Colors: text #1a1714, accent #c8873a, bg #f5f0e8, font DM Sans
 */

const BASE_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f0e8;
      color: #1a1714;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e8e0d0;
    }
    .header {
      background: #1a1714;
      padding: 32px 40px;
      text-align: center;
    }
    .logo {
      font-size: 22px;
      font-weight: 600;
      color: #f5f0e8;
      letter-spacing: -0.3px;
    }
    .logo span { color: #c8873a; }
    .body {
      padding: 40px;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #1a1714;
      margin-bottom: 12px;
    }
    p {
      color: #4a4540;
      font-size: 15px;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-block;
      background: #c8873a;
      color: #ffffff !important;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      margin: 8px 0 24px;
    }
    .meta {
      background: #f5f0e8;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #6b6560;
    }
    .meta strong { color: #1a1714; }
    .footer {
      padding: 24px 40px;
      border-top: 1px solid #e8e0d0;
      text-align: center;
      color: #9b9590;
      font-size: 13px;
    }
    .footer a { color: #c8873a; text-decoration: none; }
    .note {
      font-size: 13px;
      color: #9b9590;
      margin-top: 0;
    }
  </style>
`

const layout = (body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${BASE_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Signo<span>va</span></div>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Signova · AI Contract Manager</p>
      <p style="margin-top:6px"><a href="https://signova.me">signova.me</a></p>
    </div>
  </div>
</body>
</html>
`

// ── 1. Signup Confirmation ───────────────────────────────────────────────────
export const signupConfirmationTemplate = ({ name, confirmUrl }) => ({
  subject: 'Verify your Signova account',
  html: layout(`
    <h1>Verify your email</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Welcome to Signova! Please verify your email address to activate your account.</p>
    <a href="${confirmUrl}" class="btn">Verify Email →</a>
    <p class="note">This link expires in 24 hours.</p>
    <p class="note">If you did not create an account, you can safely ignore this email.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `)
})

// ── 2. Password Reset ────────────────────────────────────────────────────────
export const passwordResetTemplate = ({ name, resetUrl }) => ({
  subject: 'Reset your Signova password',
  html: layout(`
    <h1>Reset your password</h1>
    <p>Hi ${name || 'there'},</p>
    <p>We received a request to reset your password. Click below to choose a new one.</p>
    <a href="${resetUrl}" class="btn">Reset Password →</a>
    <p class="note">This link expires in 1 hour.</p>
    <p class="note">If you did not request this, you can safely ignore this email. Your password won't change.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `)
})

// ── 3. Workspace Invitation ──────────────────────────────────────────────────
export const workspaceInvitationTemplate = ({ inviterName, workspaceName, role, inviteUrl }) => ({
  subject: `${inviterName} invited you to ${workspaceName} on Signova`,
  html: layout(`
    <h1>You're invited</h1>
    <p>Hi,</p>
    <p><strong>${inviterName}</strong> has invited you to join a workspace on Signova.</p>
    <div class="meta">
      <p><strong>Workspace:</strong> ${workspaceName}</p>
      <p><strong>Role:</strong> ${role || 'Member'}</p>
    </div>
    <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
    <p class="note">This invitation expires in 7 days.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `)
})

// ── 4. Share Notification (to lawyer / reviewer) ─────────────────────────────
export const shareNotificationTemplate = ({ userName, contractName, riskLevel, shareUrl, expiryDate }) => {
  const riskColor = riskLevel === 'HIGH RISK' ? '#dc2626' :
                    riskLevel === 'NEGOTIATE'  ? '#d97706' : '#16a34a'
  return {
    subject: `${userName} shared a contract analysis with you`,
    html: layout(`
      <h1>Contract shared with you</h1>
      <p>Hi,</p>
      <p><strong>${userName}</strong> shared a contract analysis with you via Signova.</p>
      <div class="meta">
        <p><strong>Contract:</strong> ${contractName}</p>
        <p><strong>Risk Level:</strong> <span style="color:${riskColor};font-weight:600">${riskLevel}</span></p>
      </div>
      <a href="${shareUrl}" class="btn">View Analysis →</a>
      <p class="note">No account required to view.</p>
      ${expiryDate ? `<p class="note">This link expires on ${expiryDate}.</p>` : ''}
      <p style="margin-top:24px">— The Signova Team</p>
    `)
  }
}

// ── 5. Comment Notification ──────────────────────────────────────────────────
export const commentNotificationTemplate = ({ userName, lawyerName, contractName, commentPreview, contractUrl }) => ({
  subject: `New comment on ${contractName}`,
  html: layout(`
    <h1>New comment on your contract</h1>
    <p>Hi ${userName || 'there'},</p>
    <p><strong>${lawyerName}</strong> left a comment on your contract.</p>
    <div class="meta">
      <p><strong>Contract:</strong> ${contractName}</p>
      ${commentPreview ? `<p style="margin-top:8px;font-style:italic;">"${commentPreview}"</p>` : ''}
    </div>
    <a href="${contractUrl}" class="btn">View Comment →</a>
    <p style="margin-top:24px">— The Signova Team</p>
  `)
})

// ── Helper: get template by type ─────────────────────────────────────────────
export const getEmailTemplate = (type, data) => {
  switch (type) {
    case 'signup_confirmation':   return signupConfirmationTemplate(data)
    case 'password_reset':        return passwordResetTemplate(data)
    case 'workspace_invitation':  return workspaceInvitationTemplate(data)
    case 'share_notification':    return shareNotificationTemplate(data)
    case 'comment_notification':  return commentNotificationTemplate(data)
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}
