import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  // Auth check - nur eingeloggte User dürfen Sessions verifizieren
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Sicherheitscheck: Session muss zum eingeloggten User gehören
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.payment_status === 'paid' || session.status === 'complete') {
      return NextResponse.json({
        success: true,
        plan: session.metadata?.plan,
        email: session.customer_details?.email,
      });
    }

    return NextResponse.json({
      success: false,
      status: session.payment_status,
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { error: 'Could not verify session' },
      { status: 500 }
    );
  }
}
