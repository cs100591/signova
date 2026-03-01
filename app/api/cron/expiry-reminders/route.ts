import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendExpiryReminder, ContractReminder } from '@/lib/email';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set, skipping verification');
    return true;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

interface ContractRow {
  id: number;
  name: string;
  type: string;
  expiry_date: string | null;
  user_email: string;
  user_name: string;
  reminder_90_sent: boolean;
  reminder_30_sent: boolean;
  reminder_7_sent: boolean;
  reminder_0_sent: boolean;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Find contracts that need reminders
    // Checks for: 90 days, 30 days, 7 days, and 0 days (expired today)
    const query = `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.expiry_date,
        u.email as user_email,
        COALESCE(u.name, u.email) as user_name,
        c.reminder_90_sent,
        c.reminder_30_sent,
        c.reminder_7_sent,
        c.reminder_0_sent
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.expiry_date IS NOT NULL
        AND c.status != 'archived'
        AND (
          -- 90 days before expiry (not sent yet)
          (c.expiry_date BETWEEN NOW() + INTERVAL '90 days' AND NOW() + INTERVAL '91 days' 
           AND c.reminder_90_sent = false)
          OR
          -- 30 days before expiry (not sent yet)
          (c.expiry_date BETWEEN NOW() + INTERVAL '30 days' AND NOW() + INTERVAL '31 days' 
           AND c.reminder_30_sent = false)
          OR
          -- 7 days before expiry (not sent yet)
          (c.expiry_date BETWEEN NOW() + INTERVAL '7 days' AND NOW() + INTERVAL '8 days' 
           AND c.reminder_7_sent = false)
          OR
          -- Expires today (not sent yet)
          (c.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '1 day'
           AND c.reminder_0_sent = false)
        )
      ORDER BY c.expiry_date ASC
    `;

    const result = await pool.query(query);
    const contracts: ContractRow[] = result.rows;

    console.log(`Found ${contracts.length} contracts needing expiry reminders`);

    const remindersSent: Array<{ contractId: number; daysLeft: number; email: string }> = [];
    const errors: Array<{ contractId: number; error: string }> = [];

    // Send reminders and update flags
    for (const contract of contracts) {
      const expiryDate = new Date(contract.expiry_date!);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const reminder: ContractReminder = {
        id: contract.id,
        name: contract.name,
        type: contract.type,
        expiryDate: contract.expiry_date,
        userEmail: contract.user_email,
        userName: contract.user_name,
        daysLeft: Math.max(0, daysLeft),
      };

      try {
        // Send email
        await sendExpiryReminder(reminder);

        // Update reminder flag based on which reminder was sent
        let updateField: string;
        if (daysLeft <= 0) updateField = 'reminder_0_sent';
        else if (daysLeft <= 7) updateField = 'reminder_7_sent';
        else if (daysLeft <= 30) updateField = 'reminder_30_sent';
        else updateField = 'reminder_90_sent';

        await pool.query(
          `UPDATE contracts SET ${updateField} = true WHERE id = $1`,
          [contract.id]
        );

        remindersSent.push({
          contractId: contract.id,
          daysLeft: Math.max(0, daysLeft),
          email: contract.user_email
        });

        console.log(`Sent ${updateField} reminder for contract ${contract.id} (${contract.name})`);

      } catch (error) {
        console.error(`Failed to send reminder for contract ${contract.id}:`, error);
        errors.push({
          contractId: contract.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${contracts.length} contracts`,
      remindersSent: remindersSent.length,
      errors: errors.length,
      details: {
        sent: remindersSent,
        failed: errors
      }
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process expiry reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
