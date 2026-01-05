export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { DocumentForm } from '@/components/documents/document-form';
import { redirect } from 'next/navigation';

export default async function NewInvoicePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check subscription limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (subscription?.plan === 'free' && (subscription?.documents_count || 0) >= 3) {
    redirect('/settings?upgrade=true');
  }

  const [
    { data: customers },
    { data: profile },
    { count: invoiceCount },
  ] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'invoice'),
  ]);

  return (
    <div>
      <PageHeader title="Neue Rechnung" />
      <div className="p-4 sm:p-6 max-w-3xl">
        <DocumentForm
          type="invoice"
          customers={customers || []}
          profile={profile}
          documentCount={invoiceCount || 0}
        />
      </div>
    </div>
  );
}
