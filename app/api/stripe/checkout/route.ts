import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: ' + (authError?.message || 'No user') }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan, successUrl, cancelUrl } = body;

    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan: ' + String(plan) + '. Price IDs: ' + JSON.stringify(STRIPE_PRICE_IDS) }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      try {
        const customer = await stripe.customers.create({
          email: user.email || profile?.email || undefined,
          name: profile?.full_name || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
      } catch (stripeCustErr: any) {
         return NextResponse.json({ error: 'Stripe Customer Error: ' + stripeCustErr.message }, { status: 500 });
      }
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=1`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
        metadata: { userId: user.id, plan },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (stripeSessErr: any) {
      return NextResponse.json({ error: 'Stripe Session Error: ' + stripeSessErr.message }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Fatal Route Error: ' + err.message }, { status: 500 });
  }
}
