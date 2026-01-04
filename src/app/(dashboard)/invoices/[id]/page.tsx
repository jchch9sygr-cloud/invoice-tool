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
        {/* Vorschau im DIN 5008 Stil - wie PDF */}
        <Card className="bg-white">
          <CardContent className="p-10 text-gray-900">
            {/* Kopfbereich: Logo links, Absender rechts */}
            <div className="flex justify-between mb-6">
              <div>
                {profile?.logo_url && (
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-14 w-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-semibold text-gray-900 text-sm">{profile?.company_name}</p>
                <p>{profile?.address}</p>
                <p>{profile?.zip} {profile?.city}</p>
                {profile?.phone && <p>Tel: {profile.phone}</p>}
                {profile?.email && <p>{profile.email}</p>}
                {profile?.tax_number && <p>St.-Nr.: {profile.tax_number}</p>}
              </div>
            </div>

            {/* Empfängeradresse (ohne Rücksendezeile für Fensterkuvert) */}
            <div className="w-[240px] min-h-[80px] mb-2">
              {document.customer ? (
                <div className="text-sm">
                  <p className="font-semibold">{document.customer.name}</p>
                  {document.customer.company && <p>{document.customer.company}</p>}
                  {document.customer.address && <p>{document.customer.address}</p>}
                  <p>{document.customer.zip} {document.customer.city}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">—</p>
              )}
            </div>

            {/* Ort, Datum - rechts unter Empfänger */}
            <p className="text-right text-sm mb-6">
              {document.location ? `${document.location}, ` : ''}{formatDate(document.date)}
            </p>

            {/* Betreff (DIN 5008: fett) */}
            <h2 className="text-base font-bold mb-6">
              Rechnung Nr. {document.number}
            </h2>

            {/* Anrede und Einleitung */}
            <div className="mb-4 text-sm leading-relaxed">
              <p className="mb-1">Sehr geehrte Damen und Herren,</p>
              {document.introduction_text && (
                <p>{document.introduction_text}</p>
              )}
            </div>

            {/* Positionstabelle */}
            <table className="w-full mb-4 text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-xs text-gray-700">
                  <th className="p-2">Beschreibung</th>
                  <th className="p-2 text-right">Menge</th>
                  <th className="p-2 text-center">Einheit</th>
                  <th className="p-2 text-right">Einzelpreis</th>
                  <th className="p-2 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {document.line_items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-center">{item.unit}</td>
                    <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summenblock rechts */}
            <div className="flex justify-end mb-6">
              <div className="text-right text-sm min-w-[180px]">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Nettobetrag:</span>
                  <span>{formatCurrency(netTotal)}</span>
                </div>
                {vatRate > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">{vatRate}% USt.:</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-gray-900 font-bold text-base">
                  <span>Gesamtbetrag:</span>
                  <span>{formatCurrency(grossTotal)}</span>
                </div>
              </div>
            </div>

            {/* Zahlungshinweis */}
            {document.notes && (
              <p className="mb-4 text-sm leading-relaxed">{document.notes}</p>
            )}

            {/* Kleinunternehmer Hinweis */}
            {profile?.is_kleinunternehmer && (
              <p className="text-xs text-gray-500 italic mb-4">
                {getKleinunternehmerText()}
              </p>
            )}

            {/* Grußformel */}
            <div className="mt-6 text-sm">
              <p className="mb-4">Wir bedanken uns für die Zusammenarbeit.</p>
              <p className="mb-8">Mit freundlichen Grüßen</p>
              <p className="font-semibold">
                {document.sender_name || profile?.company_name}
              </p>
            </div>

            {/* Fußzeile */}
            <div className="mt-10 pt-4 border-t border-gray-300">
              <div className="flex justify-between text-[10px] text-gray-500">
                <div>
                  <p className="font-semibold">{profile?.company_name}</p>
                  <p>{profile?.address}</p>
                  <p>{profile?.zip} {profile?.city}</p>
                </div>
                <div>
                  {profile?.phone && <p>Tel: {profile.phone}</p>}
                  {profile?.email && <p>{profile.email}</p>}
                  {profile?.tax_number && <p>St.-Nr.: {profile.tax_number}</p>}
                </div>
                {(profile?.bank_name || profile?.iban) && (
                  <div className="text-right">
                    <p className="font-semibold">Bankverbindung</p>
                    {profile.bank_name && <p>{profile.bank_name}</p>}
                    {profile.iban && <p>IBAN: {profile.iban}</p>}
                    {profile.bic && <p>BIC: {profile.bic}</p>}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
