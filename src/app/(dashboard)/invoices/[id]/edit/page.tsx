export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { DocumentEditForm } from '@/components/documents/document-edit-form';
import { redirect, notFound } from 'next/navigation';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: document },
    { data: customers },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('*, line_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .single(),
    supabase.from('customers').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
  ]);

  if (!document) {
    notFound();
  }

  // Redirect if document is paid
  if (document.status === 'paid') {
    redirect(`/invoices/${id}?locked=true`);
  }

  return (
    <div>
      <PageHeader title={`Rechnung ${document.number} bearbeiten`} />
      <div className="p-4 sm:p-6 max-w-3xl">
        <DocumentEditForm
          document={document}
          lineItems={document.line_items || []}
          customers={customers || []}
          profile={profile}
        />
      </div>
    </div>
  );
}
