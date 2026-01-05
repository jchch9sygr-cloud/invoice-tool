import Stripe from 'stripe';

// Only initialize Stripe if secret key is available (not during build)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    })
  : (null as unknown as Stripe);

export const PLANS = {
  lifetime: {
    priceId: process.env.STRIPE_PRICE_LIFETIME!,
    name: 'Einmalzahlung',
    price: 60,
    mode: 'payment' as const,
  },
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: 'Monatlich',
    price: 10,
    mode: 'subscription' as const,
  },
};
