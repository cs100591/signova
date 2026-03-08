import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, event } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_NOTIFY_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ ok: false, error: 'Not configured' });
    }

    const now = new Date().toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const messages: Record<string, string> = {
      signup: `👑 *New Signova User!*\n\n📧 ${email}\n🕐 ${now}`,
      login: `🔑 *User Login*\n\n📧 ${email}\n🕐 ${now}`,
    };

    const text = messages[event] || `📌 *Signova Event: ${event}*\n\n📧 ${email}\n🕐 ${now}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Notify] Error:', err);
    return NextResponse.json({ ok: false });
  }
}
