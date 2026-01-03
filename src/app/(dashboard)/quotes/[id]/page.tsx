export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDate, calculateTotal, getKleinunternehmerText } from '@/lib/utils';

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: document },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('*, customer:customers(*), line_items(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single(),
  ]);

  if (!document) {
    notFound();
  }

  const total = calculateTotal(document.line_items || []);

  return (
    <div>
      <Header title={`Angebot ${document.number}`}>
        <div className="flex gap-2">
          <Link href="/quotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <Link href={`/quotes/${id}/pdf`}>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              PDF herunterladen
            </Button>
          </Link>
        </div>
      </Header>

      <div className="p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between mb-8">
              <div>
                {profile?.logo_url && (
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-16 w-16 object-contain"
                  />
                )}
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-semibold text-gray-900">{profile?.company_name}</p>
                <p>{profile?.address}</p>
                <p>{profile?.zip} {profile?.city}</p>
                {profile?.tax_number && <p>St.-Nr.: {profile.tax_number}</p>}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">ANGEBOT {document.number}</h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Kunde</p>
                {document.customer ? (
                  <>
                    <p className="font-medium">{document.customer.name}</p>
                    {document.customer.company && <p>{document.customer.company}</p>}
                    <p>{document.customer.address}</p>
                    <p>{document.customer.zip} {document.customer.city}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Kein Kunde zugewiesen</p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-xs text-gray-500 uppercase">Angebotsdatum</p>
                  <p>{formatDate(document.date)}</p>
                </div>
                {document.due_date && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Gültig bis</p>
                    <p>{formatDate(document.due_date)}</p>
                  </div>
                )}
              </div>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-50 text-left text-sm">
                  <th className="p-3">Beschreibung</th>
                  <th className="p-3 text-right">Menge</th>
                  <th className="p-3 text-center">Einheit</th>
                  <th className="p-3 text-right">Preis</th>
                  <th className="p-3 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {document.line_items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-center">{item.unit}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Gesamtbetrag</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>

            {profile?.is_kleinunternehmer && (
              <p className="text-sm text-gray-500 italic mb-4">
                {getKleinunternehmerText()}
              </p>
            )}

            {document.notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-1">Anmerkungen</p>
                <p className="text-sm">{document.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
