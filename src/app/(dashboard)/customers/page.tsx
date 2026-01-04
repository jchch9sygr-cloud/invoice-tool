export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { CustomerList } from './customer-list';

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <Header title="Kunden">
        <Link href="/customers/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Kunde
          </Button>
        </Link>
      </Header>

      <div className="p-6">
        {customers && customers.length > 0 ? (
          <CustomerList customers={customers} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  Noch keine Kunden
                </h3>
                <p className="mt-2 text-gray-400">
                  Lege deinen ersten Kunden an, um Rechnungen zu erstellen.
                </p>
                <Link href="/customers/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Ersten Kunden anlegen
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
