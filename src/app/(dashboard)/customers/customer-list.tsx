'use client';

import { Customer } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (id: string) => {
    if (!confirm('Kunde wirklich löschen?')) return;

    await supabase.from('customers').delete().eq('id', id);
    router.refresh();
  };

  return (
    <div className="grid gap-4">
      {customers.map((customer) => (
        <Card key={customer.id} className="hover:border-blue-600 transition-colors">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white">{customer.name}</h3>
                {customer.company && (
                  <p className="text-sm text-gray-400">{customer.company}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-300">{customer.email}</span>
                    </span>
                  )}
                  {customer.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-300">{customer.zip} {customer.city}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link href={`/customers/${customer.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(customer.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
