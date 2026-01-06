import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { level } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document belongs to user and is an invoice
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    // Can't send reminder for paid invoices
    if (document.status === 'paid') {
      return NextResponse.json(
        { error: 'Diese Rechnung ist bereits bezahlt' },
        { status: 400 }
      );
    }

    // Update reminder count and date
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        reminder_count: level,
        last_reminder_date: new Date().toISOString(),
        // Also mark as sent if still draft
        status: document.status === 'draft' ? 'sent' : document.status,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    // TODO: Actually send email if customer has email
    // For now, just log that a reminder was sent
    console.log(`Reminder level ${level} sent for invoice ${document.number} to ${document.customer?.email || 'no email'}`);

    return NextResponse.json({
      success: true,
      message: `${level}. Mahnung gesendet`,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der Mahnung' },
      { status: 500 }
    );
  }
}
