import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validierung für level Parameter
const reminderSchema = z.object({
  level: z.number().int().min(0).max(4),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validiere Request Body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
    }

    const validation = reminderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Level muss eine Zahl zwischen 0 und 4 sein' }, { status: 400 });
    }

    const { level } = validation.data;
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

    const levelNames = ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'];
    const levelName = levelNames[Math.min(level, 3)] || 'Mahnung';

    // Hinweis: Diese Route aktualisiert NUR den Mahnstatus
    // Für E-Mail-Versand nutze /api/documents/[id]/send-email mit type: 'reminder'
    const hasEmail = !!document.customer?.email;

    return NextResponse.json({
      success: true,
      message: `${levelName} wurde erfasst`,
      emailSent: false,
      hint: hasEmail
        ? 'Nutze "Per E-Mail senden" für den E-Mail-Versand an den Kunden.'
        : 'Kunde hat keine E-Mail-Adresse hinterlegt.',
      customerEmail: document.customer?.email || null,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Mahnstatus' },
      { status: 500 }
    );
  }
}
