import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDocumentNumber } from '@/lib/utils';

export async function POST(
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

    // Fetch the quote with line items
    const { data: quote, error: fetchError } = await supabase
      .from('documents')
      .select('*, line_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    if (quote.type !== 'quote') {
      return NextResponse.json({ error: 'Nur Angebote können in Rechnungen umgewandelt werden' }, { status: 400 });
    }

    // Get current invoice count for number generation
    const { count: invoiceCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'invoice')
      .eq('user_id', user.id);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create new invoice from quote
    const { data: invoice, error: createError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        customer_id: quote.customer_id,
        type: 'invoice',
        number: generateDocumentNumber('invoice', invoiceCount || 0),
        date: today,
        due_date: dueDate,
        notes: 'Zahlbar innerhalb von 14 Tagen.',
        vat_rate: quote.vat_rate,
        location: quote.location,
        salutation: quote.salutation,
        introduction_text: 'gemäß den vereinbarten Vergütungskonditionen erlauben wir uns Ihnen für die erbrachten Leistungen den nachfolgenden Betrag in Rechnung zu stellen:',
        sender_name: quote.sender_name,
        status: 'draft',
      })
      .select()
      .single();

    if (createError || !invoice) {
      throw createError;
    }

    // Copy line items
    if (quote.line_items && quote.line_items.length > 0) {
      const lineItemsToInsert = quote.line_items.map((item: any, index: number) => ({
        document_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        position: index,
      }));

      const { error: itemsError } = await supabase
        .from('line_items')
        .insert(lineItemsToInsert);

      if (itemsError) {
        // Rollback: delete the created invoice
        await supabase.from('documents').delete().eq('id', invoice.id);
        throw itemsError;
      }
    }

    // Increment document count for subscription
    await supabase.rpc('increment_document_count', { user_uuid: user.id });

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    });
  } catch (error) {
    console.error('Convert to invoice error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Umwandlung' },
      { status: 500 }
    );
  }
}
