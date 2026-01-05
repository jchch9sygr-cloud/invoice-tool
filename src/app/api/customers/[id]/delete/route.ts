import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
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

    // Verify customer belongs to user
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    // Check if customer has documents
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if (documents && documents.length > 0) {
      return NextResponse.json(
        { error: 'Kunde hat noch Rechnungen/Angebote. Bitte zuerst löschen.' },
        { status: 400 }
      );
    }

    // Delete the customer
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting customer:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
