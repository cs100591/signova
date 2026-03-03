# Signova — Email & Auth Setup Guide
> Domain: signova.me
> Email sender: noreply@signova.me (Resend, already verified ✅)
> Goal: Custom email verification — Supabase sends nothing, Resend sends everything

---

## Overview

```
User signs up / logs in
    ↓
Supabase Auth triggers
    ↓
Supabase sends NOTHING (default emails disabled)
    ↓
Supabase calls our auth hook endpoint
    ↓
Our route sends email via Resend
using noreply@signova.me
    ↓
User clicks link
    ↓
Lands on signova.me/auth/confirm (custom page)
    ↓
Verified → enters app
```

---

## Part 1 — Supabase Auth Configuration

### Step 1: Disable Supabase Default Emails

Supabase Dashboard →
Authentication → Email Templates

Clear the content of ALL templates:
- Confirm signup
- Invite user
- Magic Link
- Change Email Address
- Reset Password

Do NOT delete them. Just clear the body content.
This prevents Supabase from sending its own emails.

---

### Step 2: Configure Custom SMTP via Resend

Supabase Dashboard →
Project Settings → Authentication → SMTP Settings

```
Enable Custom SMTP: ON

Host:         smtp.resend.com
Port:         465
Username:     resend
Password:     [your Resend API Key]
Sender name:  Signova
Sender email: noreply@signova.me
```

Save changes.

---

### Step 3: Configure Redirect URLs

Supabase Dashboard →
Authentication → URL Configuration

```
Site URL:
https://signova.me

Redirect URLs (whitelist all):
https://signova.me/auth/confirm
https://signova.me/auth/callback
https://signova.me/auth/reset-password
https://signova.me/invite/*
https://signova.me/join/*
```

---

### Step 4: Update Email Template URLs

Supabase Dashboard →
Authentication → Email Templates

Update the confirmation URL in each template
(body stays empty, only update the URL variable):

Confirm signup:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Reset password:
```
{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

Magic link:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
```

---

### Step 5: Set Up Supabase Auth Hook

Supabase Dashboard →
Authentication → Hooks → Send Email Hook

```
Hook type:     Send Email
HTTP endpoint: https://signova.me/api/email/auth-hook
```

This routes ALL Supabase auth emails through
our custom endpoint. Supabase sends nothing directly.

---

## Part 2 — Email Types

```
1. signup_confirmation   → new user verifies email
2. password_reset        → forgot password flow
3. workspace_invitation  → invite member to workspace
4. share_notification    → notify lawyer of shared contract
5. comment_notification  → notify user of lawyer comment
```

---

## Part 3 — Email Templates

**① Signup Confirmation**
```
From:    Signova <noreply@signova.me>
Subject: Verify your Signova account

Hi [Name],

Welcome to Signova! Please verify your email
address to activate your account.

[Verify Email →]
https://signova.me/auth/confirm?token_hash=XXX&type=email

This link expires in 24 hours.
If you did not create an account, ignore this email.

— The Signova Team
```

**② Password Reset**
```
From:    Signova <noreply@signova.me>
Subject: Reset your Signova password

Hi [Name],

We received a request to reset your password.

[Reset Password →]
https://signova.me/auth/reset-password?token_hash=XXX

This link expires in 1 hour.
If you did not request this, ignore this email.

— The Signova Team
```

**③ Workspace Invitation**
```
From:    Signova <noreply@signova.me>
Subject: [InviterName] invited you to [WorkspaceName] on Signova

Hi,

[InviterName] has invited you to join
[WorkspaceName] as [Role] on Signova.

[Accept Invitation →]
https://signova.me/invite/[token]

This invitation expires in 7 days.

— The Signova Team
```

**④ Share Notification (to lawyer)**
```
From:    Signova <noreply@signova.me>
Subject: [UserName] shared a contract analysis with you

Hi,

[UserName] shared a contract analysis with you.

Contract:   [ContractName]
Risk Level: [HIGH RISK / NEGOTIATE / SAFE]

No account required to view.

[View Analysis →]
https://signova.me/share/[token]

Expires on [ExpiryDate].

— The Signova Team
```

**⑤ Comment Notification**
```
From:    Signova <noreply@signova.me>
Subject: New comment on [ContractName]

Hi [UserName],

[LawyerName] left a comment on your contract.

"[CommentPreview]"

[View Comment →]
https://signova.me/contracts/[contractId]

— The Signova Team
```

---

## Part 4 — Auth Pages

### /auth/confirm
File: `app/auth/confirm/page.jsx`

```
1. Read URL params: token_hash, type
2. Call supabase.auth.verifyOtp({ token_hash, type })
3. Success → redirect /dashboard
4. Failure → show error + resend button

UI states:
  Loading  → spinner + "Verifying your email..."
  Success  → ✅ "Email verified! Redirecting..."
  Error    → ❌ "Link expired or invalid"
               [Resend Verification Email]
               [Back to Login]
```

### /auth/reset-password
File: `app/auth/reset-password/page.jsx`

```
1. Read URL params: token_hash
2. Show new password form
3. supabase.auth.updateUser({ password })
4. Success → redirect /dashboard
5. Failure → show error

UI:
  New password      [____________]
  Confirm password  [____________]
  [Reset Password]
```

### /auth/callback
File: `app/auth/callback/route.js`

```
OAuth code exchange (for future Google login)
Read code → exchangeCodeForSession → redirect /dashboard
```

---

## Part 5 — New Files

```
app/
  api/
    email/
      route.js                 ← workspace/share/comment emails
      auth-hook/
        route.js               ← Supabase auth hook handler
  auth/
    confirm/
      page.jsx                 ← email verification page
    reset-password/
      page.jsx                 ← password reset page
    callback/
      route.js                 ← OAuth callback

lib/
  emailTemplates.js            ← all 5 email HTML templates
```

---

## Part 6 — Environment Variables

Add to `.env.local` AND Vercel Dashboard:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
SUPABASE_HOOK_SECRET=your_hook_secret_from_supabase
NEXT_PUBLIC_APP_URL=https://signova.me
```

---

## Part 7 — Manual Steps (Do Yourself)

### Supabase Dashboard

```
□ Project Settings → Authentication → SMTP
  Host:         smtp.resend.com
  Port:         465
  Username:     resend
  Password:     [RESEND_API_KEY]
  Sender name:  Signova
  Sender email: noreply@signova.me

□ Authentication → URL Configuration
  Site URL: https://signova.me
  Redirect URLs:
    https://signova.me/auth/confirm
    https://signova.me/auth/callback
    https://signova.me/auth/reset-password
    https://signova.me/invite/*
    https://signova.me/join/*

□ Authentication → Hooks → Send Email Hook
  https://signova.me/api/email/auth-hook

□ Authentication → Email Templates
  Clear all template body content
  Update confirmation URLs to signova.me paths
```

### Vercel Dashboard

```
□ Project Settings → Environment Variables
  RESEND_API_KEY       = re_xxxxxxxxxxxx
  SUPABASE_HOOK_SECRET = your_hook_secret
  NEXT_PUBLIC_APP_URL  = https://signova.me
```

---

## Part 8 — Test Checklist

```
□ Sign up
  → Email from noreply@signova.me
  → Click → signova.me/auth/confirm
  → "Email verified!" → dashboard

□ Forgot password
  → Email from noreply@signova.me
  → Click → signova.me/auth/reset-password
  → Reset → dashboard

□ Workspace invitation
  → Invited user receives email
  → Click → signova.me/invite/[token]
  → Login/signup → auto-joined workspace

□ Share with lawyer
  → Lawyer receives email
  → Click → view analysis (no login needed)

□ Lawyer comment
  → Owner receives email
  → Click → contract page with comment
```

---

## Claude Code Prompt

```
BEFORE DOING ANYTHING:
1. Read memory.md — understand full project state
2. Read docs/signova-email-setup.md — this spec
3. Show me:
   - All existing auth-related files
   - Any existing email sending code
   - Current redirect URLs in use
4. List ALL files you plan to create or modify
5. Wait for my confirmation before writing any code

━━━━━━━━━━━━━━━━━━━━━━
PROTECTION RULES — NON NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━
⛔ DO NOT modify any existing auth logic
⛔ DO NOT modify any existing API routes
⛔ DO NOT modify any existing UI components
⛔ DO NOT modify Supabase client configuration
⛔ DO NOT modify any existing redirect logic
⛔ DO NOT modify workspace, contracts, or AI logic
⛔ DO NOT modify buildSystemPrompt.js
⛔ DO NOT modify environment variable usage elsewhere
⛔ DO NOT install new packages without telling me first

You are ONLY allowed to CREATE these new files:
✅ lib/emailTemplates.js
✅ app/api/email/route.js
✅ app/api/email/auth-hook/route.js
✅ app/auth/confirm/page.jsx
✅ app/auth/reset-password/page.jsx
✅ app/auth/callback/route.js

━━━━━━━━━━━━━━━━━━━━━━
EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Audit existing auth flow
  List all auth-related files
  Check for any existing email logic
  Confirm no conflicts with new files
  Wait for my confirmation before proceeding

Step 2 — Create lib/emailTemplates.js
  All 5 email templates as per spec
  Clean minimal HTML
  Signova brand colors:
    text: #1a1714
    accent: #c8873a
    background: #f5f0e8
    font: DM Sans
  git commit: "feat: Resend email templates"

Step 3 — Create app/api/email/auth-hook/route.js
  Verify SUPABASE_HOOK_SECRET on every request
  Handle payload types:
    signup    → signup_confirmation template
    recovery  → password_reset template
    magiclink → signup_confirmation template
  Send via Resend using noreply@signova.me
  git commit: "feat: Supabase auth hook handler"

Step 4 — Create app/api/email/route.js
  Handle POST { type, to, data }
  Types:
    workspace_invitation
    share_notification
    comment_notification
  Send via Resend
  git commit: "feat: transactional email route"

Step 5 — Create auth pages
  app/auth/confirm/page.jsx
  app/auth/reset-password/page.jsx
  app/auth/callback/route.js
  Match Signova design exactly:
    background: #fafdf5
    accent: #c8873a
    font: DM Sans
  git commit: "feat: custom auth pages"

Step 6 — Environment variables
  Add to .env.local:
    RESEND_API_KEY
    SUPABASE_HOOK_SECRET
    NEXT_PUBLIC_APP_URL=https://signova.me
  Tell me which ones to add to Vercel

Step 7 — List all manual steps I need to do in:
  Supabase Dashboard
  Vercel Dashboard

Step 8 — Update memory.md with:
  Email service: Resend
  Sender: noreply@signova.me
  Auth hook endpoint: /api/email/auth-hook
  Email templates location: lib/emailTemplates.js
  All 5 email types and their triggers
  Auth page locations
  All whitelisted redirect URLs
```

---

*Signova Email Setup Guide v1.0*
