'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, FileText, FileCheck, Trash2, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ArchivedDocument {
  id: string;
  number: string;
  type: 'invoice' | 'quote';
  date: string;
  status: string;
  archived_at: string;
  customer: { name: string } | null;
  line_items: Array<{ quantity: number; unit_price: number }>;
}

function calculateTotal(lineItems: Array<{ quantity: number; unit_price: number }>): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export default function ArchivePage() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ArchivedDocument | null>(null);

  useEffect(() => {
    loadArchivedDocuments();
  }, []);

  const loadArchivedDocuments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*, customer:customers(name), line_items(*)')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false });

    if (data) {
      setDocuments(data as ArchivedDocument[]);
    }
    setLoading(false);
  };

  const handleRestore = async (doc: ArchivedDocument) => {
    setActionLoading(doc.id);
    try {
      const response = await fetch(`/api/documents/${doc.id}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadArchivedDocuments();
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirm) return;

    setActionLoading(deleteConfirm.id);
    try {
      const response = await fetch(`/api/documents/${deleteConfirm.id}/permanent-delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadArchivedDocuments();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Archiv">
        <div className="text-sm text-gray-400">
          {documents.length} archiviert
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Archive className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  Archiv ist leer
                </h3>
                <p className="mt-2 text-gray-400">
                  Gelöschte Dokumente erscheinen hier und können wiederhergestellt werden.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const total = calculateTotal(doc.line_items || []);
              const isLoading = actionLoading === doc.id;

              return (
                <Card key={doc.id} className="hover:border-gray-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="shrink-0 mt-0.5">
                          {doc.type === 'invoice' ? (
                            <FileText className="h-6 w-6 text-blue-500" />
                          ) : (
                            <FileCheck className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-white text-sm sm:text-base">
                              {doc.number}
                            </h3>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300">
                              {doc.type === 'invoice' ? 'Rechnung' : 'Angebot'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5 truncate">
                            {doc.customer?.name || 'Kein Kunde'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Archiviert am {formatDate(doc.archived_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="text-base font-semibold text-white whitespace-nowrap hidden sm:block">
                          {formatCurrency(total)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(doc)}
                            disabled={isLoading}
                            title="Wiederherstellen"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(doc)}
                            disabled={isLoading}
                            title="Endgültig löschen"
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
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setDeleteConfirm(null)}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 w-[90%] max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Endgültig löschen?
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Möchtest du <strong className="text-white">{deleteConfirm.number}</strong> wirklich
                endgültig löschen? Diese Aktion kann <strong className="text-red-400">nicht</strong> rückgängig gemacht werden.
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handlePermanentDelete}
                  disabled={actionLoading === deleteConfirm.id}
                >
                  {actionLoading === deleteConfirm.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Endgültig löschen
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
