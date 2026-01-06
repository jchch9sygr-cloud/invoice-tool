export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Users, Plus, Sparkles, ArrowRight, Settings, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

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
  const isNewUser = (customersCount || 0) === 0 && (invoicesCount || 0) === 0;
  const { data: profile } = await supabase.from('profiles').select('company_name').eq('user_id', user?.id).single();
  const hasCompanySetup = !!profile?.company_name;

  return (
    <div>
      <PageHeader title="Dashboard">
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button size="sm" className="px-3 sm:px-4">
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Rechnung</span>
            </Button>
          </Link>
          <Link href="/quotes/new">
            <Button size="sm" variant="outline" className="px-3 sm:px-4">
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Angebot</span>
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Welcome Guide for New Users */}
        {isNewUser && (
          <Card className="border-blue-800/50 bg-gradient-to-br from-blue-900/20 to-blue-800/10">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Willkommen bei RechnungsBlitz!</h2>
                  <p className="text-sm text-gray-400">In 3 Schritten zur ersten Rechnung</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1: Settings */}
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${hasCompanySetup ? 'bg-green-900/20 border border-green-800/30' : 'bg-gray-800/50 border border-gray-700'}`}>
                  <div className={`p-2 rounded-lg ${hasCompanySetup ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                    {hasCompanySetup ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Settings className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${hasCompanySetup ? 'text-green-400' : 'text-white'}`}>
                      {hasCompanySetup ? 'Firmendaten eingerichtet' : '1. Firmendaten einrichten'}
                    </p>
                    <p className="text-xs text-gray-500">Logo, Adresse, Bankverbindung</p>
                  </div>
                  {!hasCompanySetup && (
                    <Link href="/settings">
                      <Button size="sm" variant="outline" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Step 2: Customer */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="p-2 rounded-lg bg-gray-700">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">2. Ersten Kunden anlegen</p>
                    <p className="text-xs text-gray-500">Name und Adresse eingeben</p>
                  </div>
                  <Link href="/customers/new">
                    <Button size="sm" variant="outline" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Step 3: Invoice */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="p-2 rounded-lg bg-gray-700">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">3. Erste Rechnung erstellen</p>
                    <p className="text-xs text-gray-500">Positionen eintragen, PDF herunterladen</p>
                  </div>
                  <Link href="/invoices/new">
                    <Button size="sm" variant="outline" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="mt-4 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">Tipp:</strong> Drücke <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs font-mono mx-1">⌘K</kbd> oder <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs font-mono mx-1">Strg+K</kbd> für die Schnellsuche
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free tier notice */}
        {freeDocsRemaining !== null && !isNewUser && (
          <div className="rounded-xl bg-blue-900/30 border border-blue-800 p-3 sm:p-4">
            <p className="text-sm text-blue-300">
              <strong>Kostenloser Tarif:</strong> Noch {freeDocsRemaining} von 3 Dokumenten.{' '}
              <Link href="/settings" className="underline text-blue-400">Upgraden</Link>
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:border-blue-600/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 sm:pt-6 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center sm:text-left">
                      <p className="text-xs sm:text-sm text-gray-400">{stat.name}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <stat.icon className="hidden sm:block h-10 w-10 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Letzte Dokumente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {recentDocuments && recentDocuments.length > 0 ? (
              <div className="divide-y divide-gray-800 -mx-4 sm:-mx-6">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/${doc.type === 'invoice' ? 'invoices' : 'quotes'}/${doc.id}`}
                    className="flex items-center justify-between py-3 px-4 sm:px-6 hover:bg-gray-800/50 transition-colors active:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {doc.type === 'invoice' ? (
                        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                      ) : (
                        <FileCheck className="h-5 w-5 text-green-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm sm:text-base truncate">{doc.number}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {doc.customer?.name || 'Kein Kunde'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs sm:text-sm text-gray-500">{formatDate(doc.date)}</p>
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
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Noch keine Dokumente</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  Erstelle deine erste Rechnung und sie erscheint hier.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/invoices/new">
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Rechnung erstellen
                    </Button>
                  </Link>
                  <Link href="/quotes/new">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Angebot erstellen
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
