'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  MoreVertical,
  Settings,
  Trash2,
  FileDown,
} from 'lucide-react';
import type { Document } from '@/types/database';

interface DocumentActionsProps {
  document: Document;
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<{ message: string; showSettings?: boolean } | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    setMessage(null);
    setShowDropdown(false);

    try {
      const response = await fetch(`/api/documents/${document.id}/${action}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Aktion fehlgeschlagen');
      }

      // Handle success based on action
      switch (action) {
        case 'mark-paid':
          setMessage({ type: 'success', text: 'Rechnung als bezahlt markiert' });
          router.refresh();
          break;
        case 'unmark-paid':
          setMessage({ type: 'success', text: 'Bezahlt-Status aufgehoben' });
          router.refresh();
          break;
        case 'convert':
          setMessage({ type: 'success', text: `Rechnung ${data.invoiceNumber} erstellt` });
          setTimeout(() => router.push(`/invoices/${data.invoiceId}`), 1500);
          break;
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Aktion fehlgeschlagen'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    setDeleteError(null);

    try {
      const response = await fetch(`/api/documents/${document.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError({
          message: data.error || 'Löschen fehlgeschlagen',
          showSettings: data.hint === 'settings',
        });
        setLoading(null);
        return;
      }

      setShowDeleteConfirm(false);
      setMessage({ type: 'success', text: 'Dokument gelöscht' });

      // Redirect to list page
      const listPath = document.type === 'invoice' ? '/invoices' : '/quotes';
      setTimeout(() => router.push(listPath), 1000);
    } catch (error) {
      setDeleteError({
        message: error instanceof Error ? error.message : 'Löschen fehlgeschlagen',
      });
    } finally {
      setLoading(null);
    }
  };

  const isInvoice = document.type === 'invoice';
  const isPaid = document.status === 'paid';
  const canMarkPaid = isInvoice && !isPaid;
  const canUnmarkPaid = isInvoice && isPaid;
  const canConvert = document.type === 'quote';
  const canDelete = true; // API prüft ob bezahlte Rechnungen gelöscht werden dürfen

  return (
    <div className="relative">
      {/* Desktop Actions */}
      <div className="hidden sm:flex gap-2">
        {canMarkPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('mark-paid')}
            disabled={!!loading}
          >
            {loading === 'mark-paid' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Als bezahlt
          </Button>
        )}

        {canUnmarkPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('unmark-paid')}
            disabled={!!loading}
            className="text-yellow-400 hover:text-yellow-300 hover:border-yellow-500"
          >
            {loading === 'unmark-paid' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Unbezahlt
          </Button>
        )}

        {canConvert && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('convert')}
            disabled={!!loading}
          >
            {loading === 'convert' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            → Rechnung
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!!loading}
            className="text-red-400 hover:text-red-300 hover:border-red-500"
          >
            {loading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Löschen
          </Button>
        )}
      </div>

      {/* Mobile Dropdown */}
      <div className="sm:hidden relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={!!loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px]">
              {canMarkPaid && (
                <button
                  onClick={() => handleAction('mark-paid')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Als bezahlt markieren
                </button>
              )}

              {canUnmarkPaid && (
                <button
                  onClick={() => handleAction('unmark-paid')}
                  className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Bezahlt-Status aufheben
                </button>
              )}

              {canConvert && (
                <button
                  onClick={() => handleAction('convert')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  In Rechnung umwandeln
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              if (!loading) {
                setShowDeleteConfirm(false);
                setDeleteError(null);
              }
            }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isInvoice ? 'Rechnung' : 'Angebot'} löschen?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Möchtest du {isInvoice ? 'die Rechnung' : 'das Angebot'} <strong className="text-white">{document.number}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm">
                <p className="text-red-300">{deleteError.message}</p>
                {deleteError.showSettings && (
                  <Link
                    href="/settings"
                    className="mt-2 flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      setShowDeleteConfirm(false);
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
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={!!loading}
              >
                Abbrechen
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={!!loading}
              >
                {loading === 'delete' ? (
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

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            message.type === 'success'
              ? 'bg-green-900 text-green-200 border border-green-700'
              : 'bg-red-900 text-red-200 border border-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
