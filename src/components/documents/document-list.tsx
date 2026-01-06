'use client';

import { Document, LineItem } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Download, MoreVertical, Loader2, Settings, AlertTriangle, Mail, Archive, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, calculateTotal } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface DocumentWithRelations extends Omit<Document, 'customer' | 'reminder_count' | 'due_date' | 'paid_at'> {
  customer?: { name: string } | null;
  line_items?: LineItem[];
  reminder_count?: number | null;
  due_date?: string | null;
  paid_at?: string | null;
}

interface DocumentListProps {
  documents: DocumentWithRelations[];
  type: 'invoice' | 'quote';
}

function ActionMenu({
  docId,
  basePath,
  onDelete
}: {
  docId: string;
  basePath: string;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white sm:hidden"
        aria-label="Aktionen"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-xl sm:hidden">
          <Link
            href={`${basePath}/${docId}/pdf`}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <Download className="h-4 w-4" />
            PDF herunterladen
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-orange-400 hover:bg-gray-700"
          >
            <Archive className="h-4 w-4" />
            Archivieren
          </button>
        </div>
      )}

      {/* Desktop Buttons */}
      <div className="hidden items-center gap-1 sm:flex">
        <Link href={`${basePath}/${docId}/pdf`} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" title="PDF herunterladen">
            <Download className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Archivieren"
        >
          <Archive className="h-4 w-4 text-orange-500" />
        </Button>
      </div>
    </div>
  );
}

export function DocumentList({ documents, type }: DocumentListProps) {
  const router = useRouter();
  const basePath = type === 'invoice' ? '/invoices' : '/quotes';
  const [deleteDoc, setDeleteDoc] = useState<DocumentWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<{ message: string; showSettings?: boolean } | null>(null);

  const handleDelete = async () => {
    if (!deleteDoc) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/documents/${deleteDoc.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError({
          message: data.error || 'Löschen fehlgeschlagen',
          showSettings: data.hint === 'settings',
        });
        return;
      }

      setDeleteDoc(null);
      router.refresh();
    } catch (error) {
      setDeleteError({
        message: error instanceof Error ? error.message : 'Löschen fehlgeschlagen',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (doc: DocumentWithRelations) => {
    const status = doc.status;
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

    // Show paid date for paid invoices
    if (status === 'paid' && doc.paid_at) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-900/50 text-green-400 px-2 py-0.5 text-xs font-medium">
          <CheckCircle className="h-3 w-3" />
          Bezahlt am {formatDate(doc.paid_at)}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Mahnstatus Badge
  const getReminderBadge = (doc: DocumentWithRelations) => {
    if (type !== 'invoice') return null;
    if (doc.status === 'paid' || doc.status === 'cancelled') return null;

    const reminderCount = doc.reminder_count || 0;
    if (reminderCount === 0) {
      // Prüfen ob überfällig
      if (doc.due_date) {
        const dueDate = new Date(doc.due_date);
        const today = new Date();
        if (today > dueDate) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/50 text-yellow-400 px-2 py-0.5 text-xs font-medium">
              <AlertTriangle className="h-3 w-3" />
              {daysOverdue}d überfällig
            </span>
          );
        }
      }
      return null;
    }

    const reminderLabels = ['Erinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'];
    const label = reminderLabels[Math.min(reminderCount - 1, 3)];
    const colors = [
      'bg-cyan-900/50 text-cyan-400',
      'bg-yellow-900/50 text-yellow-400',
      'bg-orange-900/50 text-orange-400',
      'bg-red-900/50 text-red-400',
    ];
    const color = colors[Math.min(reminderCount - 1, 3)];

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        <Mail className="h-3 w-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const total = calculateTotal(doc.line_items || []);

        return (
          <Link key={doc.id} href={`${basePath}/${doc.id}`} className="block">
            <Card className="hover:border-blue-600/50 transition-colors cursor-pointer active:scale-[0.99]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Icon + Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="shrink-0 mt-0.5">
                      {type === 'invoice' ? (
                        <FileText className="h-6 w-6 text-blue-500 sm:h-8 sm:w-8" />
                      ) : (
                        <FileCheck className="h-6 w-6 text-green-500 sm:h-8 sm:w-8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Number + Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-white text-sm sm:text-base">{doc.number}</h3>
                        {getStatusBadge(doc)}
                        {getReminderBadge(doc)}
                      </div>
                      {/* Customer + Date */}
                      <p className="text-sm text-gray-400 mt-0.5 truncate">
                        {doc.customer?.name || 'Kein Kunde'}
                      </p>
                      {/* Mobile: Amount + Date in row */}
                      <div className="flex items-center justify-between mt-2 sm:hidden">
                        <span className="text-base font-semibold text-white">
                          {formatCurrency(total)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(doc.date)}
                        </span>
                      </div>
                      {/* Desktop: Date */}
                      <p className="text-sm text-gray-500 hidden sm:block">
                        {formatDate(doc.date)}
                      </p>
                    </div>
                  </div>

                  {/* Desktop: Amount + Actions */}
                  <div className="hidden sm:flex items-center gap-4">
                    <p className="text-lg font-semibold text-white whitespace-nowrap">
                      {formatCurrency(total)}
                    </p>
                    <div onClick={(e) => e.preventDefault()}>
                      <ActionMenu
                        docId={doc.id}
                        basePath={basePath}
                        onDelete={() => setDeleteDoc(doc)}
                      />
                    </div>
                  </div>

                  {/* Mobile: Action Menu */}
                  <div className="sm:hidden" onClick={(e) => e.preventDefault()}>
                    <ActionMenu
                      docId={doc.id}
                      basePath={basePath}
                      onDelete={() => setDeleteDoc(doc)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              if (!isDeleting) {
                setDeleteDoc(null);
                setDeleteError(null);
              }
            }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-400" />
              {type === 'invoice' ? 'Rechnung' : 'Angebot'} archivieren?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Möchtest du {type === 'invoice' ? 'die Rechnung' : 'das Angebot'}{' '}
              <strong className="text-white">{deleteDoc.number}</strong> ins Archiv verschieben?
              Du kannst es dort wiederherstellen oder endgültig löschen.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm">
                <p className="text-red-300">{deleteError.message}</p>
                {deleteError.showSettings && (
                  <Link
                    href="/settings"
                    className="mt-2 flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      setDeleteDoc(null);
                      setDeleteError(null);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    In den Einstellungen ändern
                  </Link>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteDoc(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4 mr-1" />
                )}
                Archivieren
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
