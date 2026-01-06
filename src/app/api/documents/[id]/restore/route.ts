import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      return NextResponse.json({ error: 'Dokument ist nicht archiviert' }, { status: 400 });
    }

    // Restore document
    const { error: restoreError } = await supabase
      .from('documents')
      .update({
        is_archived: false,
        archived_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (restoreError) {
      console.error('Error restoring document:', restoreError);
      throw restoreError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore document error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Wiederherstellen' },
      { status: 500 }
    );
  }
}
