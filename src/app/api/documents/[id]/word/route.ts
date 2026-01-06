import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  BorderStyle,
  WidthType,
  HeadingLevel,
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
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Use profile snapshot for paid invoices
    const isPaid = doc.status === 'paid';
    const effectiveProfile = isPaid && doc.profile_snapshot ? doc.profile_snapshot : profile;

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
    const grossTotal = netTotal + vatAmount;

    const docTypeLabel = doc.type === 'invoice' ? 'Rechnung' : 'Angebot';

    // Build Word document
    const wordDoc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header - Company Name
            new Paragraph({
              children: [
                new TextRun({
                  text: effectiveProfile?.company_name || '',
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
                  text: `${effectiveProfile?.address || ''}, ${effectiveProfile?.zip || ''} ${effectiveProfile?.city || ''}`,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
            // Header - Contact
            new Paragraph({
              children: [
                new TextRun({
                  text: `${effectiveProfile?.email || ''} | ${effectiveProfile?.phone || ''}`,
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
                  text: `${doc.location ? doc.location + ', ' : ''}${formatDate(doc.date)}`,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 300 },
            }),

            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: `${docTypeLabel} Nr. ${doc.number}`,
                  bold: true,
                  size: 28,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            // Salutation
            new Paragraph({
              children: [new TextRun({ text: doc.salutation || 'Sehr geehrte Damen und Herren,' })],
              spacing: { after: 100 },
            }),

            // Introduction
            ...(doc.introduction_text
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: doc.introduction_text })],
                    spacing: { after: 300 },
                  }),
                ]
              : []),

            // Items table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Beschreibung', bold: true })] })],
                      shading: { fill: 'EEEEEE' },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Betrag', bold: true })],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: 'EEEEEE' },
                    }),
                  ],
                }),
                // Item rows
                ...(doc.line_items || []).map(
                  (item: { description: string; quantity: number; unit_price: number }) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: item.description })] })],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: formatCurrency(item.quantity * item.unit_price) })],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              ],
            }),

            // Totals
            new Paragraph({ spacing: { before: 300 } }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Nettobetrag: ' }),
                new TextRun({ text: formatCurrency(positionsTotal), bold: true }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
            ...(hasCourtage
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Courtage (${doc.courtage_percentage}%): ` }),
                      new TextRun({ text: formatCurrency(courtageAmount), bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ]
              : []),
            ...(vatRate > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${vatRate}% USt.: ` }),
                      new TextRun({ text: formatCurrency(vatAmount), bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ]
              : []),
            new Paragraph({
              children: [
                new TextRun({ text: 'Gesamtbetrag: ', bold: true, size: 24 }),
                new TextRun({ text: formatCurrency(grossTotal), bold: true, size: 24 }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { before: 100, after: 300 },
            }),

            // Notes
            ...(doc.notes
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: doc.notes })],
                    spacing: { after: 300 },
                  }),
                ]
              : []),

            // Kleinunternehmer notice
            ...(effectiveProfile?.is_kleinunternehmer
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
                        italics: true,
                        size: 18,
                      }),
                    ],
                    spacing: { after: 300 },
                  }),
                ]
              : []),

            // Closing
            new Paragraph({
              children: [new TextRun({ text: 'Wir bedanken uns für die Zusammenarbeit.' })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Mit freundlichen Grüßen' })],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.sender_name || effectiveProfile?.company_name || '',
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
            ...(effectiveProfile?.bank_name || effectiveProfile?.iban
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Bankverbindung: ${effectiveProfile.bank_name || ''} | IBAN: ${effectiveProfile.iban || ''} | BIC: ${effectiveProfile.bic || ''}`,
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
    const filename = `${docTypeLabel}_${doc.number.replace(/\//g, '-')}.docx`;

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Word export error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Word-Dokuments' },
      { status: 500 }
    );
  }
}
