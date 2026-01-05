import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Sanitize search query - remove special characters that could cause issues
function sanitizeSearchQuery(query: string): string {
  // Remove special PostgREST/SQL characters, keep only alphanumeric, spaces, German umlauts
  return query
    .replace(/[%_'"\\;(){}[\]]/g, '') // Remove dangerous characters
    .slice(0, 100); // Limit length
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q')?.trim();

    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const query = sanitizeSearchQuery(rawQuery);

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Search invoices by number
    const { data: invoices } = await supabase
      .from('documents')
      .select('id, number, type, status, customer:customers(name)')
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .ilike('number', `%${query}%`)
      .limit(5);

    // Search quotes by number
    const { data: quotes } = await supabase
      .from('documents')
      .select('id, number, type, status, customer:customers(name)')
      .eq('user_id', user.id)
      .eq('type', 'quote')
      .ilike('number', `%${query}%`)
      .limit(5);

    // Search customers by name or company
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, company, email')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,company.ilike.%${query}%`)
      .limit(5);

    // Also search documents by customer name
    const { data: docsByCustomer } = await supabase
      .from('documents')
      .select('id, number, type, status, customer:customers!inner(name)')
      .eq('user_id', user.id)
      .ilike('customers.name', `%${query}%`)
      .limit(5);

    // Combine and format results
    const results = [
      ...(invoices || []).map(inv => ({
        id: inv.id,
        type: 'invoice' as const,
        title: inv.number,
        subtitle: (inv.customer as any)?.name || 'Kein Kunde',
        status: inv.status,
        href: `/invoices/${inv.id}`,
      })),
      ...(quotes || []).map(q => ({
        id: q.id,
        type: 'quote' as const,
        title: q.number,
        subtitle: (q.customer as any)?.name || 'Kein Kunde',
        status: q.status,
        href: `/quotes/${q.id}`,
      })),
      ...(customers || []).map(c => ({
        id: c.id,
        type: 'customer' as const,
        title: c.name,
        subtitle: c.company || c.email || '',
        href: `/customers/${c.id}/edit`,
      })),
      // Add documents found by customer name (avoid duplicates)
      ...(docsByCustomer || [])
        .filter(d => {
          const existing = [...(invoices || []), ...(quotes || [])];
          return !existing.some(e => e.id === d.id);
        })
        .map(d => ({
          id: d.id,
          type: d.type as 'invoice' | 'quote',
          title: d.number,
          subtitle: (d.customer as any)?.name || 'Kein Kunde',
          status: d.status,
          href: d.type === 'invoice' ? `/invoices/${d.id}` : `/quotes/${d.id}`,
        })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Suche fehlgeschlagen' }, { status: 500 });
  }
}
