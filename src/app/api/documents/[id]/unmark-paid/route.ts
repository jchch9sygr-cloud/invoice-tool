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

    if (document.type !== 'invoice') {
      return NextResponse.json({ error: 'Nur Rechnungen können als unbezahlt markiert werden' }, { status: 400 });
    }

    if (document.status !== 'paid') {
      return NextResponse.json({ error: 'Rechnung ist nicht als bezahlt markiert' }, { status: 400 });
    }

    // Update document status back to sent and clear paid_at
    // Keep profile_snapshot for history
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'sent',
        paid_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmark paid error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Status' },
      { status: 500 }
    );
  }
}
