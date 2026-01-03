export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { DocumentList } from '@/components/documents/document-list';

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from('documents')
    .select('*, customer:customers(name), line_items(*)')
    .eq('type', 'quote')
    .order('created_at', { ascending: false });

  return (
    <div>
      <Header title="Angebote">
        <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neues Angebot
          </Button>
        </Link>
      </Header>

      <div className="p-6">
        {quotes && quotes.length > 0 ? (
          <DocumentList documents={quotes} type="quote" />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileCheck className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Noch keine Angebote
                </h3>
                <p className="mt-2 text-gray-500">
                  Erstelle dein erstes Angebot in unter 2 Minuten.
                </p>
                <Link href="/quotes/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Erstes Angebot erstellen
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
