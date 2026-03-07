/**
 * Signova — Onboarding Email Sequence Templates
 * 7 emails sent over 14 days after signup.
 * Follows the same layout/style as lib/emailTemplates.js.
 * Sender: hello@signova.me
 */

const APP_URL = 'https://signova.me'

// ── Shared base styles ────────────────────────────────────────────────────────
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
    .logo { font-size: 22px; font-weight: 600; color: #f5f0e8; letter-spacing: -0.3px; }
    .logo span { color: #c8873a; }
    .body { padding: 40px; }
    h1 { font-size: 22px; font-weight: 600; color: #1a1714; margin-bottom: 12px; }
    p { color: #4a4540; font-size: 15px; margin-bottom: 16px; }
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
    .highlight {
      background: #f5f0e8;
      border-left: 3px solid #c8873a;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .highlight p { margin-bottom: 0; font-size: 14px; color: #3a3530; }
    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .risk-high  { background: #fee2e2; color: #dc2626; }
    .risk-med   { background: #fef3c7; color: #d97706; }
    .risk-low   { background: #f3f4f6; color: #6b7280; }
    .step-list { list-style: none; margin-bottom: 24px; }
    .step-list li {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid #f0ebe4;
      font-size: 14px; color: #4a4540;
    }
    .step-num {
      flex-shrink: 0;
      width: 24px; height: 24px;
      background: #1a1714; color: #f5f0e8;
      border-radius: 50%;
      font-size: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
    }
    .footer {
      padding: 24px 40px;
      border-top: 1px solid #e8e0d0;
      text-align: center;
      color: #9b9590;
      font-size: 13px;
    }
    .footer a { color: #c8873a; text-decoration: none; }
    .note { font-size: 13px; color: #9b9590; margin-top: 0; }
  </style>
`

/**
 * Shared layout — wraps body content and adds logo + footer with unsubscribe link.
 * @param {string} body - Inner HTML content
 * @param {string} unsubscribeUrl - Personalized unsubscribe URL
 */
const layout = (body, unsubscribeUrl) => `
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
      <p style="margin-top:6px"><a href="${APP_URL}">signova.me</a></p>
      <p style="margin-top:12px;font-size:12px;color:#b0aaa5;">
        You're receiving this because you signed up for Signova.<br>
        <a href="${unsubscribeUrl}" style="color:#9b9590;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`

// ── Step 1 — Welcome (sent immediately on signup) ─────────────────────────────
export const welcomeEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'Welcome to Signova 👋',
  html: layout(`
    <h1>Welcome to Signova!</h1>
    <p>Hi ${name || 'there'},</p>
    <p>You've just joined thousands of people who use Signova to understand contracts before they sign them.</p>
    <p>Your free plan gives you <strong>3 contract analyses</strong> — no credit card needed. Let's use the first one.</p>
    <a href="${APP_URL}/upload" class="btn">Upload Your First Contract →</a>
    <div class="highlight">
      <p><strong>Tip:</strong> Upload any PDF, image, or scanned document. Our AI will extract the text and analyze the risks within 60 seconds.</p>
    </div>
    <p>If you have any questions, just reply to this email.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 2 — How to analyze (Day 1) ───────────────────────────────────────────
export const howToAnalyzeEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'How to analyze your first contract',
  html: layout(`
    <h1>Get your first analysis in 60 seconds</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Here's exactly how Signova works:</p>
    <ul class="step-list">
      <li>
        <span class="step-num">1</span>
        <span><strong>Upload your contract</strong> — PDF, image, or paste the text directly.</span>
      </li>
      <li>
        <span class="step-num">2</span>
        <span><strong>Tell us which party you are</strong> — we analyze from your perspective, not generically.</span>
      </li>
      <li>
        <span class="step-num">3</span>
        <span><strong>Review your risk report</strong> — risk score, key findings, and suggested rewrites.</span>
      </li>
      <li>
        <span class="step-num">4</span>
        <span><strong>Ask the AI anything</strong> — use the chat to dig deeper into any clause.</span>
      </li>
    </ul>
    <a href="${APP_URL}/upload" class="btn">Analyze a Contract Now →</a>
    <p>Most users get their first analysis done in under 2 minutes.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 3 — Hidden risks (Day 3) ─────────────────────────────────────────────
export const hiddenRisksEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'Hidden risks lurking in your contracts 🔍',
  html: layout(`
    <h1>The clauses people miss most</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Based on thousands of contracts analyzed on Signova, here are the 3 risk clauses people overlook most often:</p>

    <div class="highlight">
      <p><span class="risk-badge risk-high">High</span></p>
      <p style="margin-top:8px"><strong>Unlimited liability clauses</strong> — You're responsible for all damages with no cap. This can wipe out your savings if something goes wrong.</p>
    </div>

    <div class="highlight">
      <p><span class="risk-badge risk-med">Medium</span></p>
      <p style="margin-top:8px"><strong>Auto-renewal with 60-day notice</strong> — The contract renews automatically unless you give 60 days notice. Easy to miss.</p>
    </div>

    <div class="highlight">
      <p><span class="risk-badge risk-med">Medium</span></p>
      <p style="margin-top:8px"><strong>Broad IP assignment</strong> — All work — including your pre-existing tools and code — is assigned to the other party.</p>
    </div>

    <p>Signova catches all of these automatically. Upload a contract and see what's hiding in yours.</p>
    <a href="${APP_URL}/upload" class="btn">Check My Contract →</a>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 4 — Sample report (Day 5) ───────────────────────────────────────────
export const sampleReportEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'See what a real risk report looks like',
  html: layout(`
    <h1>Here's a real Signova analysis</h1>
    <p>Hi ${name || 'there'},</p>
    <p>This is what Signova gives you for a typical vendor agreement:</p>

    <div style="background:#f8f7f4;border:1px solid #e0d9ce;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="font-size:13px;color:#9a8f82;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Risk Score</p>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:56px;height:56px;border-radius:50%;border:3px solid #dc2626;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#1a1714;">72</div>
        <div>
          <div style="font-size:16px;font-weight:600;color:#dc2626;">High Risk</div>
          <div style="font-size:13px;color:#7a7168;">3 issues require attention</div>
        </div>
      </div>
      <div style="background:white;border:1px solid #e0d9ce;border-radius:8px;padding:12px;margin-bottom:8px;">
        <span class="risk-badge risk-high">HIGH</span>
        <span style="font-size:13px;color:#1a1714;font-weight:500;margin-left:8px;">Unlimited liability clause</span>
        <p style="font-size:12px;color:#7a7168;margin-top:6px;margin-bottom:0;">Add a liability cap equal to fees paid in the last 12 months.</p>
      </div>
      <div style="background:white;border:1px solid #e0d9ce;border-radius:8px;padding:12px;margin-bottom:8px;">
        <span class="risk-badge risk-med">MED</span>
        <span style="font-size:13px;color:#1a1714;font-weight:500;margin-left:8px;">Auto-renewal without notice</span>
        <p style="font-size:12px;color:#7a7168;margin-top:6px;margin-bottom:0;">Require 30-day written notice before renewal.</p>
      </div>
    </div>

    <p>Every finding includes a plain-language explanation and a suggested rewrite you can use in negotiation.</p>
    <a href="${APP_URL}/upload" class="btn">Get My Risk Report →</a>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 5 — Quota reminder (Day 7) ──────────────────────────────────────────
export const quotaReminderEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'Your free analysis quota is running low ⏳',
  html: layout(`
    <h1>Make the most of your free plan</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Your free Signova plan includes <strong>3 AI contract analyses</strong>. If you haven't used them yet, now is a good time.</p>
    <p>Here are some contracts worth analyzing:</p>
    <ul class="step-list">
      <li><span class="step-num">→</span><span>Your current employment or freelance contract</span></li>
      <li><span class="step-num">→</span><span>Any lease or rental agreement you've signed</span></li>
      <li><span class="step-num">→</span><span>A SaaS or software license you depend on</span></li>
    </ul>
    <a href="${APP_URL}/upload" class="btn">Use My Free Analysis →</a>
    <p>Need more analyses? The <strong>Solo plan at $9.9/month</strong> gives you 30 analyses per month — and a 7-day free trial.</p>
    <a href="${APP_URL}/#pricing" style="color:#c8873a;text-decoration:none;font-size:14px;">View pricing →</a>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 6 — Pro features (Day 10) ───────────────────────────────────────────
export const proFeaturesEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'What Pro users do differently… 💼',
  html: layout(`
    <h1>How serious users use Signova</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Here's what users on our paid plans get that free users don't:</p>

    <div class="highlight">
      <p><strong>💬 Unlimited AI chat</strong> — Ask any question about any clause. Pro users dig deep, not just skim the summary.</p>
    </div>
    <div class="highlight">
      <p><strong>⏰ Expiry alerts</strong> — Email notifications before contracts expire. Never miss a renewal window again.</p>
    </div>
    <div class="highlight">
      <p><strong>👥 Team workspaces</strong> — Share contracts with your team. Invite a lawyer to review directly in Signova.</p>
    </div>
    <div class="highlight">
      <p><strong>📋 Unlimited storage</strong> — Keep all your contracts in one secure place. Search and filter anytime.</p>
    </div>

    <p>Most of our paid users recover the monthly cost on their very first negotiation.</p>
    <a href="${APP_URL}/#pricing" class="btn">See Plans & Pricing →</a>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Step 7 — Upgrade offer (Day 14) ──────────────────────────────────────────
export const upgradeOfferEmail = ({ name, unsubscribeUrl }) => ({
  subject: 'Limited offer: 20% off your first month 🎁',
  html: layout(`
    <h1>A thank-you gift from Signova</h1>
    <p>Hi ${name || 'there'},</p>
    <p>You've been with Signova for 2 weeks. To celebrate, we're giving you <strong>20% off your first month</strong> on any paid plan.</p>

    <div style="background:#fdf3e3;border:1px solid #c8873a33;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="font-size:13px;color:#9a8f82;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your discount code</p>
      <p style="font-size:28px;font-weight:700;color:#c8873a;letter-spacing:2px;margin-bottom:4px;">WELCOME20</p>
      <p style="font-size:13px;color:#9a8f82;margin-bottom:0">Valid for 48 hours</p>
    </div>

    <p>Apply it at checkout to get:</p>
    <ul class="step-list">
      <li><span class="step-num">✓</span><span>Solo plan: <strong>$7.92/month</strong> (was $9.9)</span></li>
      <li><span class="step-num">✓</span><span>Pro plan: <strong>$23.20/month</strong> (was $29)</span></li>
    </ul>

    <a href="${APP_URL}/#pricing" class="btn">Claim 20% Off →</a>
    <p class="note">Offer expires in 48 hours. Code applies to your first month only.</p>
    <p style="margin-top:24px">— The Signova Team</p>
  `, unsubscribeUrl),
})

// ── Sequence map ─────────────────────────────────────────────────────────────
// Maps step number → { template function, days delay since signup }
export const ONBOARDING_STEPS = {
  1: { fn: welcomeEmail,      daysAfterSignup: 0  },  // Immediate
  2: { fn: howToAnalyzeEmail, daysAfterSignup: 1  },
  3: { fn: hiddenRisksEmail,  daysAfterSignup: 3  },
  4: { fn: sampleReportEmail, daysAfterSignup: 5  },
  5: { fn: quotaReminderEmail,daysAfterSignup: 7  },
  6: { fn: proFeaturesEmail,  daysAfterSignup: 10 },
  7: { fn: upgradeOfferEmail, daysAfterSignup: 14 },
}

export const TOTAL_STEPS = 7
