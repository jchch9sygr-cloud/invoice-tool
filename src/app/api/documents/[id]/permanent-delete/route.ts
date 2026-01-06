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

    // Verify document belongs to user and is archived
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, is_archived')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    if (!document.is_archived) {
      return NextResponse.json(
        { error: 'Nur archivierte Dokumente können endgültig gelöscht werden' },
        { status: 400 }
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

    // Permanently delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error permanently deleting document:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permanent delete document error:', error);
    return NextResponse.json(
      { error: 'Fehler beim endgültigen Löschen' },
      { status: 500 }
    );
  }
}
