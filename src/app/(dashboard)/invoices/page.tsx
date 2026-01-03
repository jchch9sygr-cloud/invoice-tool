export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { DocumentList } from '@/components/documents/document-list';

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('documents')
    .select('*, customer:customers(name), line_items(*)')
    .eq('type', 'invoice')
    .order('created_at', { ascending: false });

  return (
    <div>
      <Header title="Rechnungen">
        <Link href="/invoices/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neue Rechnung
          </Button>
        </Link>
      </Header>

      <div className="p-6">
        {invoices && invoices.length > 0 ? (
          <DocumentList documents={invoices} type="invoice" />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Noch keine Rechnungen
                </h3>
                <p className="mt-2 text-gray-500">
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
