import Stripe from 'stripe';
import { PLANS, type PlanKey } from './plans';

export { PLANS, type PlanKey } from './plans';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

export const STRIPE_PRICE_IDS: Record<string, string> = {
  solo: process.env.STRIPE_PRICE_SOLO!,
  pro: process.env.STRIPE_PRICE_PRO!,
  business: process.env.STRIPE_PRICE_BUSINESS!,
};

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) return plan as PlanKey;
  }
  return 'free';
}
