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

    // Get profile settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('allow_paid_invoice_deletion')
      .eq('user_id', user.id)
      .single();

    // Verify document belongs to user
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, type, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    // Check if trying to delete a paid invoice without permission
    if (document.status === 'paid' && !profile?.allow_paid_invoice_deletion) {
      return NextResponse.json(
        {
          error: 'Bezahlte Rechnungen können nicht gelöscht werden.',
          hint: 'settings',
        },
        { status: 403 }
      );
    }

    // Delete line items first (foreign key constraint)
    const { error: lineItemsError } = await supabase
      .from('line_items')
      .delete()
      .eq('document_id', id);

    if (lineItemsError) {
      console.error('Error deleting line items:', lineItemsError);
      throw lineItemsError;
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
