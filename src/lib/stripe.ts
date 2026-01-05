import Stripe from 'stripe';

// Only initialize Stripe if secret key is available (not during build)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    })
  : (null as unknown as Stripe);

export const PLANS = {
  yearly: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    name: 'Jahresabo',
    price: 30,
    mode: 'subscription' as const,
  },
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: 'Monatsabo',
    price: 5,
    mode: 'subscription' as const,
  },
};
