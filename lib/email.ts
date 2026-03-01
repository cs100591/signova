import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface ContractReminder {
  id: number;
  name: string;
  type: string;
  expiryDate: string | null;
  userEmail: string;
  userName: string;
  daysLeft: number;
}

const getSubject = (daysLeft: number): string => {
  if (daysLeft === 0) return '⏰ Your contract expires today';
  if (daysLeft <= 7) return `🚨 Your contract expires in ${daysLeft} days`;
  if (daysLeft <= 30) return `⚠️ Your contract expires in ${daysLeft} days`;
  return `📅 Your contract expires in ${daysLeft} days`;
};

const getEmailTemplate = (reminder: ContractReminder): string => {
  const { name, type, expiryDate, daysLeft, userName } = reminder;
  const formattedDate = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'No expiry date';

  const urgencyClass = daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'warning' : 'normal';
  const urgencyColor = daysLeft <= 7 ? '#DC2626' : daysLeft <= 30 ? '#F59E0B' : '#3B82F6';
  const urgencyBg = daysLeft <= 7 ? '#FEF2F2' : daysLeft <= 30 ? '#FFFBEB' : '#EFF6FF';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contract Expiry Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1A1A1A; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 24px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; }
        .urgency-banner { background: ${urgencyBg}; border: 1px solid ${urgencyColor}; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center; }
        .urgency-icon { font-size: 32px; margin-bottom: 8px; }
        .days-count { font-size: 48px; font-weight: 700; color: ${urgencyColor}; margin-bottom: 8px; }
        .days-label { font-size: 16px; color: #6B7280; }
        .contract-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .contract-name { font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; }
        .contract-type { display: inline-block; background: #F3F4F6; color: #374151; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
        .expiry-date { color: ${daysLeft <= 7 ? '#DC2626' : '#6B7280'}; font-weight: ${daysLeft <= 7 ? '600' : '400'}; }
        .cta-button { display: inline-block; background: #1A1A1A; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px; }
        .footer { text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 12px; }
        .footer a { color: #6B7280; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Signova</div>
          <p style="color: #6B7280; margin: 0;">AI Contract Manager</p>
        </div>

        <div class="urgency-banner">
          <div class="urgency-icon">${daysLeft === 0 ? '⏰' : daysLeft <= 7 ? '🚨' : daysLeft <= 30 ? '⚠️' : '📅'}</div>
          <div class="days-count">${daysLeft === 0 ? 'TODAY' : daysLeft}</div>
          <div class="days-label">${daysLeft === 0 ? 'Contract expires today' : daysLeft === 1 ? 'day remaining' : 'days remaining'}</div>
        </div>

        <div class="contract-card">
          <div class="contract-name">${name}</div>
          <div class="contract-type">${type}</div>
          <p style="margin: 0 0 8px 0; color: #6B7280;"><strong>Expiry Date:</strong> <span class="expiry-date">${formattedDate}</span></p>
          ${daysLeft <= 7 ? '<p style="margin: 0; color: #DC2626; font-size: 14px;">⚡ Action required: Consider renewing or terminating this contract.</p>' : ''}
          <a href="https://signova.me/contracts/${reminder.id}" class="cta-button">View Contract</a>
        </div>

        <p style="color: #6B7280; font-size: 14px; text-align: center;">
          Need help understanding your contract? <a href="https://signova.me/contracts/${reminder.id}/analyze" style="color: #F59E0B; text-decoration: none;">Analyze with AI</a>
        </p>

        <div class="footer">
          <p>You're receiving this because you have a contract expiring soon on Signova.</p>
          <p style="margin-top: 16px;">
            <a href="https://signova.me/settings/notifications">Manage email preferences</a> • 
            <a href="https://signova.me">Signova</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendExpiryReminder(reminder: ContractReminder): Promise<void> {
  if (!resend) {
    console.log('Resend API key not configured, skipping email send');
    console.log('Would have sent:', {
      to: reminder.userEmail,
      subject: getSubject(reminder.daysLeft),
      contract: reminder.name,
      daysLeft: reminder.daysLeft
    });
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Signova <reminders@signova.me>',
      to: reminder.userEmail,
      subject: getSubject(reminder.daysLeft),
      html: getEmailTemplate(reminder),
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data?.id);
  } catch (error) {
    console.error('Error sending expiry reminder:', error);
    throw error;
  }
}

export async function sendBulkReminders(reminders: ContractReminder[]): Promise<void> {
  console.log(`Sending ${reminders.length} expiry reminders...`);
  
  const results = await Promise.allSettled(
    reminders.map(reminder => sendExpiryReminder(reminder))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Email send complete: ${successful} successful, ${failed} failed`);
}
