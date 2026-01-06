export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { DocumentList } from '@/components/documents/document-list';

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('documents')
    .select('*, customer:customers(name), line_items(*), reminder_count, due_date')
    .eq('type', 'invoice')
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Rechnungen">
        <Link href="/invoices/new">
          <Button size="sm" className="px-3 sm:px-4">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Neue Rechnung</span>
          </Button>
        </Link>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {invoices && invoices.length > 0 ? (
          <DocumentList documents={invoices} type="invoice" />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  Noch keine Rechnungen
                </h3>
                <p className="mt-2 text-gray-400">
                  Erstelle deine erste Rechnung in unter 2 Minuten.
                </p>
                <Link href="/invoices/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Erste Rechnung erstellen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
