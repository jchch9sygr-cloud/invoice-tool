export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDate, calculateTotal, calculateVat, calculateGrossTotal, getKleinunternehmerText } from '@/lib/utils';

export default async function InvoiceDetailPage({
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

  const netTotal = calculateTotal(document.line_items || []);
  const vatRate = document.vat_rate || 0;
  const vatAmount = calculateVat(netTotal, vatRate);
  const grossTotal = calculateGrossTotal(netTotal, vatRate);

  return (
    <div>
      <Header title={`Rechnung ${document.number}`}>
        <div className="flex gap-2">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <Link href={`/invoices/${id}/pdf`}>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              PDF herunterladen
            </Button>
          </Link>
        </div>
      </Header>

      <div className="p-6 max-w-4xl">
        {/* Preview Card - Brief-Standard */}
        <Card>
          <CardContent className="p-8">
            {/* Header mit Logo und Absender */}
            <div className="flex justify-between mb-8">
              <div>
                {profile?.logo_url && (
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-20 w-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right text-sm text-gray-400">
                <p className="font-semibold text-white">{profile?.company_name}</p>
                <p>{profile?.address}</p>
                <p>{profile?.zip} {profile?.city}</p>
                {profile?.phone && <p>Tel: {profile.phone}</p>}
                {profile?.email && <p>{profile.email}</p>}
                {profile?.tax_number && <p className="mt-1">St.-Nr.: {profile.tax_number}</p>}
              </div>
            </div>

            {/* Absenderzeile klein */}
            <p className="text-xs text-gray-500 mb-2 border-b border-gray-700 pb-1">
              {profile?.company_name} · {profile?.address} · {profile?.zip} {profile?.city}
            </p>

            {/* Empfänger und Datum */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Empfänger links */}
              <div>
                {document.customer ? (
                  <div className="text-gray-200">
                    <p className="font-medium text-white">{document.customer.name}</p>
                    {document.customer.company && <p>{document.customer.company}</p>}
                    <p>{document.customer.address}</p>
                    <p>{document.customer.zip} {document.customer.city}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Kein Empfänger zugewiesen</p>
                )}
              </div>
              {/* Ort und Datum rechts */}
              <div className="text-right text-gray-200">
                <p>
                  {document.location && `${document.location}, `}
                  {formatDate(document.date)}
                </p>
              </div>
            </div>

            {/* Betreff / Titel */}
            <h2 className="text-xl font-bold text-white mb-6">
              Rechnung Nr. {document.number}
            </h2>

            {/* Anrede und Einleitungstext */}
            <div className="mb-6 text-gray-200">
              <p className="mb-2">Sehr geehrte Damen und Herren,</p>
              {document.introduction_text && (
                <p>{document.introduction_text}</p>
              )}
            </div>

            {/* Positionen-Tabelle */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-800 text-left text-sm text-gray-300">
                  <th className="p-3">Beschreibung</th>
                  <th className="p-3 text-right">Menge</th>
                  <th className="p-3 text-center">Einheit</th>
                  <th className="p-3 text-right">Preis</th>
                  <th className="p-3 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody className="text-gray-200">
                {document.line_items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-700">
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

            {/* Summen: Netto, USt., Brutto */}
            <div className="flex justify-end mb-6">
              <div className="text-right space-y-1 min-w-[200px]">
                <div className="flex justify-between text-gray-400">
                  <span>Nettobetrag:</span>
                  <span className="text-gray-200">{formatCurrency(netTotal)}</span>
                </div>
                {vatRate > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>{vatRate}% USt.:</span>
                    <span className="text-gray-200">{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-600 font-bold">
                  <span className="text-gray-200">Gesamtbetrag:</span>
                  <span className="text-white text-lg">{formatCurrency(grossTotal)}</span>
                </div>
              </div>
            </div>

            {/* Zahlungshinweis */}
            {document.notes && (
              <div className="mb-6 text-gray-200">
                <p>{document.notes}</p>
              </div>
            )}

            {/* Bankverbindung */}
            {(profile?.bank_name || profile?.iban) && (
              <div className="mb-6 text-sm text-gray-400 bg-gray-800 p-4 rounded-lg">
                <p className="font-medium text-gray-300 mb-1">Bankverbindung:</p>
                {profile.bank_name && <p>{profile.bank_name}</p>}
                {profile.iban && <p>IBAN: {profile.iban}</p>}
                {profile.bic && <p>BIC: {profile.bic}</p>}
              </div>
            )}

            {/* Kleinunternehmer Hinweis */}
            {profile?.is_kleinunternehmer && (
              <p className="text-sm text-gray-400 italic mb-4">
                {getKleinunternehmerText()}
              </p>
            )}

            {/* Danksagung und Grußformel */}
            <div className="text-gray-300 mt-6">
              <p>Wir bedanken uns für die Zusammenarbeit.</p>
              <p className="mt-4">mit freundlichen Grüßen</p>
              <p className="mt-2 font-medium text-white">
                {document.sender_name || profile?.company_name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
