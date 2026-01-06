import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { PaymentReminderEmail } from '@/components/emails/payment-reminder';
import { createElement } from 'react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, type, level } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse erforderlich' }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'E-Mail-Service nicht konfiguriert. Bitte RESEND_API_KEY in den Umgebungsvariablen setzen.'
      }, { status: 500 });
    }

    // Verify document belongs to user
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, customer:customers(*), line_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    // Get profile for company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Calculate total
    const positionsTotal = (document.line_items || []).reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    );
    const courtageAmount = document.courtage_base_amount && document.courtage_percentage
      ? (document.courtage_base_amount * document.courtage_percentage) / 100
      : 0;
    const netTotal = positionsTotal + courtageAmount;
    const vatAmount = (netTotal * (document.vat_rate || 0)) / 100;
    const totalAmount = netTotal + vatAmount;

    const daysOverdue = getDaysOverdue(document.due_date);

    // Determine email subject based on type and level
    let subject = '';
    const levelNames = ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'];

    if (type === 'reminder') {
      const levelName = levelNames[level] || 'Zahlungserinnerung';
      subject = `${levelName} - Rechnung ${document.number}`;
    } else {
      subject = `Rechnung ${document.number} - ${profile?.company_name || 'RechnungsBlitz'}`;
    }

    // Send email using Resend
    const resend = getResend();
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      react: createElement(PaymentReminderEmail, {
        customerName: document.customer?.name || 'Kunde',
        invoiceNumber: document.number,
        amount: formatCurrency(totalAmount),
        dueDate: formatDate(document.due_date),
        daysOverdue,
        level: level || 0,
        companyName: profile?.company_name || 'RechnungsBlitz',
        bankName: profile?.bank_name,
        iban: profile?.iban,
        bic: profile?.bic,
      }),
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({
        error: 'E-Mail konnte nicht gesendet werden: ' + emailError.message
      }, { status: 500 });
    }

    console.log('Email sent successfully:', emailData?.id);

    // Update document status
    const updates: Record<string, unknown> = {};

    if (type === 'reminder') {
      updates.reminder_count = (document.reminder_count || 0) + 1;
      updates.last_reminder_date = new Date().toISOString();
    }

    if (document.status === 'draft') {
      updates.status = 'sent';
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
    }

    // Also update customer email if different
    if (document.customer && email !== document.customer.email) {
      await supabase
        .from('customers')
        .update({ email })
        .eq('id', document.customer.id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      message: type === 'reminder'
        ? 'Zahlungserinnerung wurde per E-Mail gesendet'
        : 'Rechnung wurde per E-Mail gesendet',
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}
