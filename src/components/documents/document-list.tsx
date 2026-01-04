'use client';

import { Document, LineItem } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Download, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, calculateTotal } from '@/lib/utils';

interface DocumentWithRelations extends Omit<Document, 'customer'> {
  customer?: { name: string } | null;
  line_items?: LineItem[];
}

interface DocumentListProps {
  documents: DocumentWithRelations[];
  type: 'invoice' | 'quote';
}

export function DocumentList({ documents, type }: DocumentListProps) {
  const router = useRouter();
  const supabase = createClient();
  const basePath = type === 'invoice' ? '/invoices' : '/quotes';

  const handleDelete = async (id: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;

    await supabase.from('documents').delete().eq('id', id);
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-700 text-gray-300',
      sent: 'bg-blue-900/50 text-blue-400',
      paid: 'bg-green-900/50 text-green-400',
      cancelled: 'bg-red-900/50 text-red-400',
    };
    const labels = {
      draft: 'Entwurf',
      sent: 'Gesendet',
      paid: 'Bezahlt',
      cancelled: 'Storniert',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const total = calculateTotal(doc.line_items || []);

        return (
          <Card key={doc.id} className="hover:border-blue-600 transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {type === 'invoice' ? (
                    <FileText className="h-8 w-8 text-blue-500" />
                  ) : (
                    <FileCheck className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{doc.number}</h3>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-300">{doc.customer?.name || 'Kein Kunde'}</span>
                      <span className="mx-2">·</span>
                      <span>{formatDate(doc.date)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(total)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Link href={`${basePath}/${doc.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`${basePath}/${doc.id}/pdf`}>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
