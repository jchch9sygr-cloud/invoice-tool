import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 });
  }

  try {
    // Auth client for user verification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Service client for database updates (bypasses RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Fetch subscription first to check status
    const stripeResponse = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeSubscription = stripeResponse as any;

    console.log('=== STRIPE SUBSCRIPTION STATUS ===');
    console.log('status:', stripeSubscription.status);
    console.log('cancel_at_period_end:', stripeSubscription.cancel_at_period_end);
    console.log('current_period_end:', stripeSubscription.current_period_end);
    console.log('==================================');

    // Only update if not already cancelled
    if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
      await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );
      console.log('Subscription cancelled successfully');
    } else {
      console.log('Subscription already cancelled or not active, skipping update');
    }

    // Get current period end from the subscription
    let periodEnd: string | null = null;
    if (stripeSubscription.current_period_end) {
      periodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
      console.log('Parsed periodEnd:', periodEnd);
    }

    // Update database using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        ...(periodEnd && { current_period_end: periodEnd }),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update failed:', updateError);
      // Stripe was updated but database failed - return partial success
      return NextResponse.json({
        success: true,
        period_end: periodEnd,
        warning: 'Stripe aktualisiert, aber lokale Datenbank fehlgeschlagen. Bitte Seite neu laden.',
      });
    }

    console.log('Database updated successfully for user:', user.id);

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
