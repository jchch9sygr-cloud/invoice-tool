import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Format currency
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

    // Prepare email content based on type
    let subject = '';
    let body = '';

    if (type === 'reminder') {
      const levelNames = ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'];
      const levelName = levelNames[level] || `${level}. Mahnung`;

      subject = `${levelName} - ${document.number}`;
      body = `
Sehr geehrte Damen und Herren,

${level === 0
  ? `wir möchten Sie freundlich daran erinnern, dass die Rechnung ${document.number} mit einem Betrag von ${formatCurrency(totalAmount)} fällig ist.`
  : `wir möchten Sie darauf hinweisen, dass die Zahlung für Rechnung ${document.number} über ${formatCurrency(totalAmount)} noch aussteht.`
}

Bitte überweisen Sie den offenen Betrag auf folgendes Konto:
${profile?.bank_name ? `Bank: ${profile.bank_name}` : ''}
${profile?.iban ? `IBAN: ${profile.iban}` : ''}
${profile?.bic ? `BIC: ${profile.bic}` : ''}

Sollte sich Ihre Zahlung mit dieser Nachricht überschnitten haben, betrachten Sie diese bitte als gegenstandslos.

Mit freundlichen Grüßen
${profile?.company_name || ''}
      `.trim();
    } else {
      subject = `Rechnung ${document.number}`;
      body = `
Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${document.number} über ${formatCurrency(totalAmount)}.

Bitte überweisen Sie den Betrag auf folgendes Konto:
${profile?.bank_name ? `Bank: ${profile.bank_name}` : ''}
${profile?.iban ? `IBAN: ${profile.iban}` : ''}
${profile?.bic ? `BIC: ${profile.bic}` : ''}

Mit freundlichen Grüßen
${profile?.company_name || ''}
      `.trim();
    }

    // TODO: Integrate with email service (SendGrid, Resend, AWS SES, etc.)
    // For now, we'll just update the database and log
    console.log('=== E-Mail würde gesendet werden ===');
    console.log(`An: ${email}`);
    console.log(`Betreff: ${subject}`);
    console.log(`Inhalt:\n${body}`);
    console.log('=====================================');

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
        ? 'Zahlungserinnerung als gesendet markiert'
        : 'Rechnung als gesendet markiert',
      // In Zukunft: email_sent: true wenn E-Mail-Service integriert
      note: 'E-Mail-Versand wird in einer zukünftigen Version verfügbar sein. Dokument wurde als gesendet markiert.',
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden' },
      { status: 500 }
    );
  }
}
