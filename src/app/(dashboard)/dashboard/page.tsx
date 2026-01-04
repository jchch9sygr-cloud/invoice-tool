export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats
  const [
    { count: customersCount },
    { count: invoicesCount },
    { count: quotesCount },
    { data: recentDocuments },
    { data: subscription },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'invoice'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'quote'),
    supabase
      .from('documents')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('subscriptions').select('*').eq('user_id', user?.id).single(),
  ]);

  const stats = [
    { name: 'Kunden', value: customersCount || 0, icon: Users, href: '/customers' },
    { name: 'Rechnungen', value: invoicesCount || 0, icon: FileText, href: '/invoices' },
    { name: 'Angebote', value: quotesCount || 0, icon: FileCheck, href: '/quotes' },
  ];

  const freeDocsRemaining = subscription?.plan === 'free' ? Math.max(0, 3 - (subscription?.documents_count || 0)) : null;

  return (
    <div>
      <Header title="Dashboard">
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neue Rechnung
            </Button>
          </Link>
          <Link href="/quotes/new">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Neues Angebot
            </Button>
          </Link>
        </div>
      </Header>

      <div className="p-6 space-y-6">
        {/* Free tier notice */}
        {freeDocsRemaining !== null && (
          <div className="rounded-lg bg-blue-900/30 border border-blue-800 p-4">
            <p className="text-sm text-blue-300">
              <strong>Kostenloser Tarif:</strong> Du hast noch {freeDocsRemaining} von 3 kostenlosen Rechnungen/Angeboten.{' '}
              <Link href="/settings" className="underline text-blue-400">Jetzt upgraden</Link>
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:border-blue-600 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.name}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <stat.icon className="h-10 w-10 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Dokumente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocuments && recentDocuments.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/${doc.type === 'invoice' ? 'invoices' : 'quotes'}/${doc.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-800 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {doc.type === 'invoice' ? (
                        <FileText className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileCheck className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-white">{doc.number}</p>
                        <p className="text-sm text-gray-400">
                          {doc.customer?.name || 'Kein Kunde'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{formatDate(doc.date)}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          doc.status === 'paid'
                            ? 'bg-green-900/50 text-green-400'
                            : doc.status === 'sent'
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {doc.status === 'draft' ? 'Entwurf' : doc.status === 'sent' ? 'Gesendet' : doc.status === 'paid' ? 'Bezahlt' : 'Storniert'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Noch keine Dokumente erstellt.</p>
                <Link href="/invoices/new">
                  <Button variant="outline" className="mt-4">
                    Erste Rechnung erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
