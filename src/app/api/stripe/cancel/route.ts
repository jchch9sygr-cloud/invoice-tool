import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    // Cancel at period end (user keeps access until subscription ends)
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Get current period end from the subscription response
    const currentPeriodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;
    const periodEnd = new Date(currentPeriodEnd * 1000).toISOString();

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        current_period_end: periodEnd,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      period_end: periodEnd,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
