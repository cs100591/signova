# Expiry Reminder Email System

This document describes the contract expiry reminder system implemented in Signova.

## Overview

The system automatically sends email reminders for contracts expiring at:
- **90 days** before expiry
- **30 days** before expiry  
- **7 days** before expiry
- **0 days** (on the day of expiry)

## Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_your_api_key_here

# Cron job secret (for securing the cron endpoint)
CRON_SECRET=your_random_secret_here

# Admin secret (for testing endpoints)
ADMIN_SECRET=your_admin_secret_here
```

### 2. Database Migration

Run the migration to add reminder tracking columns:

```bash
npx ts-node lib/migrate-reminders.ts
```

Or execute the SQL directly:

```sql
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS reminder_90_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_30_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_7_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_0_sent BOOLEAN DEFAULT false;
```

### 3. Domain Verification (Resend)

Before sending emails, verify your domain in Resend:
1. Go to https://resend.com/domains
2. Add `signova.me` (or your domain)
3. Follow DNS configuration instructions
4. Wait for verification

## Usage

### Automatic Cron Job

Set up a daily cron job to check for expiring contracts:

**Vercel:**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expiry-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**External Cron Service (e.g., cron-job.org):**
```
GET https://your-app.vercel.app/api/cron/expiry-reminders
Headers:
  Authorization: Bearer your_cron_secret
```

**Local Testing:**
```bash
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/expiry-reminders
```

### Manual Testing

Send a test reminder email:

```bash
curl -X POST \
  -H "Authorization: Bearer your_admin_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "contractName": "Test Contract",
    "daysLeft": 7
  }' \
  http://localhost:3000/api/admin/email-test
```

Check migration status:
```bash
curl -H "Authorization: Bearer your_admin_secret" \
  http://localhost:3000/api/admin/email-test
```

## Email Templates

Emails are dynamically generated with:
- Urgency-based color coding (red/orange/blue)
- Contract details and expiry date
- Direct links to view contract
- AI analysis link
- Email preference management

## How It Works

1. **Daily Check:** The cron job runs daily and queries for contracts expiring in exactly 90, 30, 7, or 0 days
2. **Duplicate Prevention:** Each reminder type is only sent once per contract (tracked via `reminder_*_sent` flags)
3. **Batch Processing:** All reminders are sent asynchronously with error tracking
4. **Status Updates:** After sending, the corresponding flag is set to `true` to prevent duplicate sends

## Monitoring

The cron endpoint returns:
- Total contracts processed
- Number of reminders sent
- Any errors encountered
- Details of sent/failed notifications

Check logs in your deployment platform (Vercel, Railway, etc.) for:
```
Found X contracts needing expiry reminders
Sent reminder_*_sent reminder for contract Y (Contract Name)
Email send complete: X successful, Y failed
```

## Troubleshooting

**No emails sent:**
- Check `RESEND_API_KEY` is set
- Verify domain is verified in Resend
- Check cron secret is correct
- Review database has contracts with expiry dates

**Duplicate emails:**
- Migration may not have run - check columns exist
- Cron job may be running multiple times simultaneously

**Emails in spam:**
- Complete domain verification in Resend
- Set up SPF, DKIM, and DMARC records
- Warm up the sending domain gradually
