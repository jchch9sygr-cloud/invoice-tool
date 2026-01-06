import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
    }

    // Get subscription from database
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Fehler beim Laden der Subscription:', fetchError);
      return NextResponse.json({ error: 'Abo nicht gefunden' }, { status: 400 });
    }

    if (!subscription?.stripe_subscription_id) {
      console.error('Keine stripe_subscription_id gefunden:', subscription);
      return NextResponse.json({
        error: 'Keine Stripe Subscription ID vorhanden. Bitte kontaktiere den Support.',
        debug: { plan: subscription?.plan, hasCustomerId: !!subscription?.stripe_customer_id }
      }, { status: 400 });
    }

    // Cancel at period end (user keeps access until subscription ends)
    await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Fetch subscription to get current_period_end
    const stripeResponse = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Cast to any for debugging and access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeSubscription = stripeResponse as any;

    // Debug: Log the full Stripe response
    console.log('=== STRIPE SUBSCRIPTION DEBUG ===');
    console.log('Type:', typeof stripeSubscription);
    console.log('Keys:', Object.keys(stripeSubscription));
    console.log('current_period_end:', stripeSubscription.current_period_end);
    console.log('cancel_at_period_end:', stripeSubscription.cancel_at_period_end);
    console.log('status:', stripeSubscription.status);
    console.log('=================================');

    // Get current period end from the subscription
    let periodEnd: string | null = null;
    if (stripeSubscription.current_period_end) {
      periodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
      console.log('Parsed periodEnd:', periodEnd);
    } else {
      console.log('current_period_end is missing or falsy');
    }

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        ...(periodEnd && { current_period_end: periodEnd }),
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      period_end: periodEnd,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Fehler beim Kündigen: ${errorMessage}` },
      { status: 500 }
    );
  }
}
