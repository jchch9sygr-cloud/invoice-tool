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
      return NextResponse.json({ error: 'Nur Rechnungen können als bezahlt markiert werden' }, { status: 400 });
    }

    // Fetch current profile to create snapshot
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, address, city, zip, phone, email, tax_number, logo_url, is_kleinunternehmer, bank_name, iban, bic')
      .eq('user_id', user.id)
      .single();

    // Create profile snapshot
    const profileSnapshot = profile ? {
      company_name: profile.company_name,
      address: profile.address,
      city: profile.city,
      zip: profile.zip,
      phone: profile.phone,
      email: profile.email,
      tax_number: profile.tax_number,
      logo_url: profile.logo_url,
      is_kleinunternehmer: profile.is_kleinunternehmer,
      bank_name: profile.bank_name,
      iban: profile.iban,
      bic: profile.bic,
    } : null;

    // Update document status to paid with profile snapshot
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        profile_snapshot: profileSnapshot,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark paid error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Status' },
      { status: 500 }
    );
  }
}
