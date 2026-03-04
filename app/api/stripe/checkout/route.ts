import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan, successUrl, cancelUrl } = body;

    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan: ' + String(plan) }, { status: 400 });
    }

    // Use existing stripe_customer_id if available; otherwise let Stripe create
    // the customer during checkout (saves one API round-trip and avoids connection errors)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    const customerId = sub?.stripe_customer_id ?? null;

    try {
      const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=1`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
        metadata: { userId: user.id, plan },
      };

      if (customerId) {
        // Returning customer — attach to existing Stripe customer record
        sessionParams.customer = customerId;
      } else {
        // New customer — let Stripe create one during checkout, pre-fill email
        sessionParams.customer_email = user.email ?? undefined;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (stripeErr: any) {
      console.error('[Checkout] Stripe error:', stripeErr);
      return NextResponse.json({ error: 'Failed to create checkout session: ' + stripeErr.message }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[Checkout] Route error:', err);
    return NextResponse.json({ error: 'Internal error: ' + err.message }, { status: 500 });
  }
}
