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

    // Archive instead of delete - move to archive
    const { error: archiveError } = await supabase
      .from('documents')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (archiveError) {
      console.error('Error archiving document:', archiveError);
      throw archiveError;
    }

    return NextResponse.json({ success: true, archived: true });
  } catch (error) {
    console.error('Archive document error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Archivieren' },
      { status: 500 }
    );
  }
}
