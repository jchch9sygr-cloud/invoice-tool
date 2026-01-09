import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  convertMillimetersToTwip,
} from 'docx';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const level = parseInt(searchParams.get('level') || '0', 10);
    const customText = searchParams.get('text') ? decodeURIComponent(searchParams.get('text')!) : null;
    const customClosing = searchParams.get('closing') ? decodeURIComponent(searchParams.get('closing')!) : null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch document with customer and line items
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*, customer:customers(*), line_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Calculate totals
    const positionsTotal = (doc.line_items || []).reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    );
    const hasCourtage = doc.courtage_base_amount && doc.courtage_percentage;
    const courtageAmount = hasCourtage
      ? (doc.courtage_base_amount * doc.courtage_percentage) / 100
      : 0;
    const netTotal = positionsTotal + courtageAmount;
    const vatRate = doc.vat_rate || 0;
    const vatAmount = (netTotal * vatRate) / 100;
    const totalAmount = netTotal + vatAmount;

    // Get level title
    const getLevelTitle = () => {
      switch (level) {
        case 0: return 'Zahlungserinnerung';
        case 1: return '1. Mahnung';
        case 2: return '2. Mahnung';
        case 3: return 'Letzte Mahnung';
        default: return `${level}. Mahnung`;
      }
    };

    // Get default text
    const getDefaultText = () => {
      const customerName = doc.customer?.name || '';
      const salutation = customerName.toLowerCase().includes('herr')
        ? 'Sehr geehrter Herr'
        : customerName.toLowerCase().includes('frau')
        ? 'Sehr geehrte Frau'
        : 'Sehr geehrte Damen und Herren';

      switch (level) {
        case 0:
          return `${salutation},\n\nwir möchten Sie freundlich daran erinnern, dass die oben genannte Rechnung fällig ist. Bitte überweisen Sie den ausstehenden Betrag auf das in der Rechnung angegebene Konto.\n\nSollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.`;
        case 1:
          return `${salutation},\n\nbei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung trotz unserer Zahlungserinnerung noch nicht beglichen wurde.\n\nWir bitten Sie, den ausstehenden Betrag innerhalb von 14 Tagen zu überweisen.`;
        case 2:
          return `${salutation},\n\ntrotz unserer bisherigen Erinnerungen ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.\n\nWir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 10 Tagen zu begleichen.`;
        default:
          return `${salutation},\n\nleider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.\n\nDies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.`;
      }
    };

    const getDefaultClosing = () => {
      return level >= 3
        ? 'Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.'
        : 'Für Rückfragen stehen wir Ihnen gerne zur Verfügung.';
    };

    const reminderText = customText || getDefaultText();
    const closingText = customClosing || getDefaultClosing();
    const today = formatDate(new Date().toISOString());

    // Build Word document - A4 Format (210 x 297 mm) mit DIN 5008 Rändern
    const wordDoc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: convertMillimetersToTwip(210),  // A4 Breite
                height: convertMillimetersToTwip(297), // A4 Höhe
              },
              margin: {
                top: convertMillimetersToTwip(15),     // 15mm oben
                bottom: convertMillimetersToTwip(25),  // 25mm unten
                left: convertMillimetersToTwip(25),    // 25mm links (DIN 5008)
                right: convertMillimetersToTwip(20),   // 20mm rechts (DIN 5008)
              },
            },
          },
          children: [
            // Header - Company Name
            new Paragraph({
              children: [
                new TextRun({
                  text: profile?.company_name || '',
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
            // Header - Address
            new Paragraph({
              children: [
                new TextRun({
                  text: `${profile?.address || ''}, ${profile?.zip || ''} ${profile?.city || ''}`,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
            // Header - Contact
            new Paragraph({
              children: [
                new TextRun({
                  text: `${profile?.email || ''} | ${profile?.phone || ''}`,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),

            // Customer address
            new Paragraph({
              children: [new TextRun({ text: doc.customer?.name || '', bold: true })],
            }),
            ...(doc.customer?.company
              ? [new Paragraph({ children: [new TextRun({ text: doc.customer.company })] })]
              : []),
            new Paragraph({
              children: [new TextRun({ text: doc.customer?.address || '' })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `${doc.customer?.zip || ''} ${doc.customer?.city || ''}` })],
              spacing: { after: 400 },
            }),

            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `${profile?.city ? profile.city + ', ' : ''}${today}`,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 300 },
            }),

            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLevelTitle()} - Rechnung Nr. ${doc.number}`,
                  bold: true,
                  size: 28,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            // Warning for level 3+
            ...(level >= 3
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'LETZTE MAHNUNG VOR EINLEITUNG RECHTLICHER SCHRITTE',
                        bold: true,
                        color: '92400E',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    shading: { fill: 'FEF3C7' },
                    spacing: { before: 100, after: 200 },
                  }),
                ]
              : []),

            // Body text - split by newlines
            ...reminderText.split('\n').map(
              (line) =>
                new Paragraph({
                  children: [new TextRun({ text: line })],
                  spacing: { after: line === '' ? 200 : 100 },
                })
            ),

            // Invoice details box
            new Paragraph({ spacing: { before: 300 } }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Rechnungsnummer: ', color: '6B7280' }),
                new TextRun({ text: doc.number, bold: true }),
              ],
              shading: { fill: 'F3F4F6' },
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Rechnungsdatum: ', color: '6B7280' }),
                new TextRun({ text: formatDate(doc.date), bold: true }),
              ],
              shading: { fill: 'F3F4F6' },
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Fälligkeitsdatum: ', color: '6B7280' }),
                new TextRun({ text: formatDate(doc.due_date), bold: true }),
              ],
              shading: { fill: 'F3F4F6' },
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Offener Betrag: ', bold: true, size: 24 }),
                new TextRun({ text: formatCurrency(totalAmount), bold: true, size: 24, color: 'DC2626' }),
              ],
              shading: { fill: 'F3F4F6' },
              spacing: { after: 300 },
            }),

            // Bank details
            new Paragraph({
              children: [new TextRun({ text: 'Bitte überweisen Sie den Betrag auf folgendes Konto:' })],
              spacing: { after: 100 },
            }),
            ...(profile?.bank_name
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: `Bank: ${profile.bank_name}` })],
                  }),
                ]
              : []),
            ...(profile?.iban
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: `IBAN: ${profile.iban}` })],
                  }),
                ]
              : []),
            ...(profile?.bic
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: `BIC: ${profile.bic}` })],
                  }),
                ]
              : []),
            new Paragraph({
              children: [new TextRun({ text: `Verwendungszweck: ${doc.number}` })],
              spacing: { after: 300 },
            }),

            // Closing
            new Paragraph({
              children: [new TextRun({ text: closingText })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Mit freundlichen Grüßen' })],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: profile?.company_name || '',
                  bold: true,
                }),
              ],
            }),

            // Footer - Bank details
            new Paragraph({ spacing: { before: 600 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '─'.repeat(50),
                  size: 16,
                  color: 'CCCCCC',
                }),
              ],
            }),
            ...(profile?.bank_name || profile?.iban
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Bankverbindung: ${profile.bank_name || ''} | IBAN: ${profile.iban || ''} | BIC: ${profile.bic || ''}`,
                        size: 18,
                        color: '666666',
                      }),
                    ],
                  }),
                ]
              : []),
          ],
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(wordDoc);

    // Return as downloadable file
    const levelName = level === 1 ? 'Zahlungserinnerung' : level === 2 ? '2_Mahnung' : 'Letzte_Mahnung';
    const filename = `${levelName}_${doc.number.replace(/\//g, '-')}.docx`;

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Reminder Word export error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Word-Dokuments' },
      { status: 500 }
    );
  }
}
