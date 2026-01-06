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
      .select('stripe_subscription_id, stripe_customer_id, plan, cancel_at_period_end')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Fehler beim Laden der Subscription:', fetchError);
      return NextResponse.json({ error: 'Abo nicht gefunden' }, { status: 400 });
    }

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({
        error: 'Keine Stripe Subscription ID vorhanden.',
      }, { status: 400 });
    }

    // Check if subscription is actually cancelled
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({
        error: 'Das Abo ist nicht gekündigt.',
      }, { status: 400 });
    }

    // Fetch subscription from Stripe to verify status
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Check if subscription can be reactivated
    if (stripeSubscription.status !== 'active') {
      return NextResponse.json({
        error: 'Das Abo kann nicht mehr reaktiviert werden. Bitte starte ein neues Abo.',
      }, { status: 400 });
    }

    // Reactivate by removing cancel_at_period_end
    await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false }
    );

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Abo erfolgreich reaktiviert',
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Fehler beim Reaktivieren: ${errorMessage}` },
      { status: 500 }
    );
  }
}
