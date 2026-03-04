import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' });
  }

  const info = {
    keyPrefix: key.substring(0, 12) + '...',
    keyLength: key.length,
    priceIds: {
      solo: process.env.STRIPE_PRICE_SOLO?.substring(0, 15) || 'NOT SET',
      pro: process.env.STRIPE_PRICE_PRO?.substring(0, 15) || 'NOT SET',
      business: process.env.STRIPE_PRICE_BUSINESS?.substring(0, 15) || 'NOT SET',
    },
  };

  // Try a minimal Stripe API call
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover', timeout: 15000, maxNetworkRetries: 0 });
    const customers = await stripe.customers.list({ limit: 1 });
    return NextResponse.json({ ...info, stripeTest: 'SUCCESS', customerCount: customers.data.length });
  } catch (err: any) {
    return NextResponse.json({
      ...info,
      stripeTest: 'FAILED',
      error: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      rawType: err.rawType,
      detail: err.detail,
    });
  }
}
