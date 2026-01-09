import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { SimpleReminderEmail } from '@/components/emails/simple-reminder-email';
import { ReminderPDFServer } from '@/components/pdf/reminder-pdf-server';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { z } from 'zod';

// Input Validierung
const sendEmailSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  type: z.enum(['invoice', 'reminder']).optional().default('invoice'),
  level: z.number().int().min(0).max(4).optional().default(0),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse und validiere Request Body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
    }

    const validation = sendEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.issues[0]?.message || 'Ungültige Eingabe'
      }, { status: 400 });
    }

    const { email, type, level } = validation.data;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'E-Mail-Service nicht konfiguriert. Bitte RESEND_API_KEY in den Umgebungsvariablen setzen.'
      }, { status: 500 });
    }

    // Check if FROM_EMAIL is configured (not using default onboarding domain)
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail || fromEmail.includes('onboarding@resend.dev')) {
      console.warn('RESEND_FROM_EMAIL not configured or using onboarding domain');
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

    const currentLevel = level ?? 0;

    // Determine document type name
    const levelNames = ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'];
    const levelName = levelNames[Math.min(currentLevel, 3)] || 'Zahlungserinnerung';

    // Email subject and PDF filename
    const subject = type === 'reminder'
      ? `${levelName} - Rechnung ${document.number}`
      : `Rechnung ${document.number} - ${profile?.company_name || 'RechnungsBlitz'}`;

    const pdfFilename = type === 'reminder'
      ? `${levelName.replace(/\. /g, '-').replace(/ /g, '_')}_${document.number}.pdf`
      : `Rechnung_${document.number}.pdf`;

    // Generate PDF
    let pdfBuffer: Buffer | null = null;
    try {
      console.log('Generating PDF for', levelName);

      const pdfElement = createElement(ReminderPDFServer, {
        document: {
          number: document.number,
          date: document.date,
          due_date: document.due_date,
        },
        profile: profile || {},
        customer: document.customer,
        level: currentLevel,
        totalAmount,
      });

      // @ts-expect-error - renderToBuffer accepts React elements
      pdfBuffer = await renderToBuffer(pdfElement);
      console.log('PDF generated successfully, size:', pdfBuffer?.length);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Continue without PDF if generation fails
    }

    // Prepare email attachments
    const attachments = pdfBuffer ? [
      {
        filename: pdfFilename,
        content: pdfBuffer,
      }
    ] : [];

    // Absender: Firmenname des Benutzers, Reply-To auf Benutzer-E-Mail
    const senderName = profile?.company_name || 'RechnungsBlitz';
    const replyToEmail = profile?.email || undefined;

    // Extrahiere Email-Adresse aus FROM_EMAIL (Format: "Name <email@domain.com>")
    const extractEmail = (emailStr: string): string => {
      const match = emailStr.match(/<(.+)>/);
      return match ? match[1] : emailStr;
    };
    const senderEmail = extractEmail(FROM_EMAIL);

    // Send email using Resend with simple template
    const resend = getResend();
    console.log('[Email] Sending from:', `${senderName} <${senderEmail}>`, 'to:', email);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      replyTo: replyToEmail,
      to: email,
      subject,
      react: createElement(SimpleReminderEmail, {
        customerName: document.customer?.name || 'Kunde',
        documentType: levelName,
        invoiceNumber: document.number,
        companyName: senderName,
      }),
      attachments,
    });

    if (emailError) {
      console.error('Resend error:', emailError);

      // Bessere Fehlermeldungen basierend auf Fehlertyp
      let errorMessage = 'E-Mail konnte nicht gesendet werden';
      const errMsg = emailError.message?.toLowerCase() || '';

      if (errMsg.includes('domain') || errMsg.includes('not verified')) {
        errorMessage = 'Sender-Domain nicht verifiziert. Bitte RESEND_FROM_EMAIL mit einer verifizierten Domain konfigurieren.';
      } else if (errMsg.includes('rate') || errMsg.includes('limit')) {
        errorMessage = 'E-Mail-Limit erreicht. Bitte später versuchen.';
      } else if (errMsg.includes('invalid') && errMsg.includes('email')) {
        errorMessage = 'Ungültige Empfänger-E-Mail-Adresse.';
      } else if (emailError.message) {
        errorMessage = `E-Mail-Fehler: ${emailError.message}`;
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log('Email sent successfully:', emailData?.id, 'with PDF:', !!pdfBuffer, 'PDF size:', pdfBuffer?.length || 0);

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
      const { error: updateError } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Document update error after email sent:', updateError);
        // Email wurde gesendet, aber Status konnte nicht aktualisiert werden
      }
    }

    // Also update customer email if different
    if (document.customer && email !== document.customer.email) {
      const { error: customerError } = await supabase
        .from('customers')
        .update({ email })
        .eq('id', document.customer.id)
        .eq('user_id', user.id);

      if (customerError) {
        console.error('Customer email update error:', customerError);
      }
    }

    return NextResponse.json({
      success: true,
      message: type === 'reminder'
        ? `${levelName} wurde per E-Mail gesendet`
        : 'Rechnung wurde per E-Mail gesendet',
      emailId: emailData?.id,
      pdfAttached: !!pdfBuffer,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}
