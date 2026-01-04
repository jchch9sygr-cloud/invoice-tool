export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { DocumentForm } from '@/components/documents/document-form';
import { redirect } from 'next/navigation';

export default async function NewQuotePage() {
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
    { count: quoteCount },
  ] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'quote'),
  ]);

  return (
    <div>
      <Header title="Neues Angebot" />
      <div className="p-6 max-w-3xl">
        <DocumentForm
          type="quote"
          customers={customers || []}
          profile={profile}
          documentCount={quoteCount || 0}
        />
      </div>
    </div>
  );
}
