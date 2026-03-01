import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Manual trigger for testing (admin only)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // Simple admin check - in production, use proper auth
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { email, contractName, daysLeft } = body;

  if (!email || !contractName || daysLeft === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: email, contractName, daysLeft' },
      { status: 400 }
    );
  }

  try {
    const { sendExpiryReminder } = await import('@/lib/email');
    
    await sendExpiryReminder({
      id: 0,
      name: contractName,
      type: 'Test',
      expiryDate: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString(),
      userEmail: email,
      userName: email.split('@')[0],
      daysLeft,
    });

    return NextResponse.json({
      success: true,
      message: `Test reminder sent to ${email}`
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}

// Get database migration status
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if reminder columns exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name IN ('reminder_90_sent', 'reminder_30_sent', 'reminder_7_sent', 'reminder_0_sent')
    `);

    const existingColumns = checkResult.rows.map(r => r.column_name);
    const requiredColumns = ['reminder_90_sent', 'reminder_30_sent', 'reminder_7_sent', 'reminder_0_sent'];
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));

    return NextResponse.json({
      status: missingColumns.length === 0 ? 'ready' : 'needs_migration',
      existingColumns,
      missingColumns,
      migrationSQL: missingColumns.length > 0 ? `
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS reminder_90_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_30_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_7_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_0_sent BOOLEAN DEFAULT false;
      `.trim() : null
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
