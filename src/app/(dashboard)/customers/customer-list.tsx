'use client';

import { Customer } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Mail, MapPin, MoreVertical, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface CustomerListProps {
  customers: Customer[];
}

function ActionMenu({
  customerId,
  onDelete
}: {
  customerId: string;
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
      {/* Mobile: Dropdown Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white sm:hidden"
        aria-label="Aktionen"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-xl sm:hidden">
          <Link
            href={`/customers/${customerId}/edit`}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4" />
            Löschen
          </button>
        </div>
      )}

      {/* Desktop Buttons */}
      <div className="hidden items-center gap-1 sm:flex">
        <Link href={`/customers/${customerId}/edit`}>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteCustomer) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/customers/${deleteCustomer.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Löschen fehlgeschlagen');
      }

      setDeleteCustomer(null);
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <Card key={customer.id} className="hover:border-blue-600/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* Avatar + Info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 sm:h-12 sm:w-12">
                  <User className="h-5 w-5 text-gray-400 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white text-sm sm:text-base truncate">{customer.name}</h3>
                  {customer.company && (
                    <p className="text-sm text-gray-400 truncate">{customer.company}</p>
                  )}
                  {/* Contact Info - stacked on mobile */}
                  <div className="mt-2 space-y-1 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 text-sm text-gray-400">
                    {customer.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-300 truncate">{customer.email}</span>
                      </span>
                    )}
                    {customer.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-300">{customer.zip} {customer.city}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <ActionMenu
                customerId={customer.id}
                onDelete={() => setDeleteCustomer(customer)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              if (!isDeleting) {
                setDeleteCustomer(null);
                setDeleteError(null);
              }
            }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">
              Kunde löschen?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Möchtest du den Kunden{' '}
              <strong className="text-white">{deleteCustomer.name}</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteCustomer(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Abbrechen
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
  );
}
