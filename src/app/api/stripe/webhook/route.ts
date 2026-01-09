import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  // Use service role for webhook (no user context)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Null-Check für Signature Header
  if (!signature) {
    console.error('Webhook: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Null-Check für Webhook Secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          // subscription kann ein String oder ein Objekt sein
          let subscriptionId: string | null = null;
          let currentPeriodEnd: string | null = null;

          if (session.mode === 'subscription' && session.subscription) {
            subscriptionId = typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;

            // Fetch full subscription details to get period end
            if (subscriptionId) {
              try {
                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_end: number };
                if (stripeSubscription.current_period_end) {
                  currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
                }
              } catch (err) {
                console.error('Failed to fetch subscription details:', err);
              }
            }
          }

          await supabase
            .from('subscriptions')
            .update({
              plan: plan,
              status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: false,
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
        const cancelAtPeriodEnd = (subscription as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end;
        const status = (subscription as unknown as { status: string }).status;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          await supabase
            .from('subscriptions')
            .update({
              status: status === 'active' ? 'active' : 'cancelled',
              cancel_at_period_end: cancelAtPeriodEnd,
              current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            })
            .eq('user_id', sub.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          // Subscription ended - set to expired, reset to free
          await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              plan: 'free',
              stripe_subscription_id: null,
              cancel_at_period_end: false,
              current_period_end: null,
            })
            .eq('user_id', sub.user_id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
