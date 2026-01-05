export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDate, calculateTotal, calculateVat, calculateGrossTotal, getKleinunternehmerText } from '@/lib/utils';
import { DocumentActions } from '@/components/documents/document-actions';
import { DocumentPreview } from '@/components/documents/document-preview';

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

  // Use profile snapshot for paid invoices, otherwise use current profile
  const isPaid = document.status === 'paid';
  const effectiveProfile = isPaid && document.profile_snapshot
    ? document.profile_snapshot
    : profile;

  // Calculate positions total
  const positionsTotal = (document.line_items || []).reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unit_price),
    0
  );

  // Calculate courtage if present
  const hasCourtage = document.courtage_base_amount && document.courtage_percentage;
  const courtageAmount = hasCourtage
    ? (document.courtage_base_amount * document.courtage_percentage) / 100
    : 0;

  const netTotal = positionsTotal + courtageAmount;
  const vatRate = document.vat_rate || 0;
  const vatAmount = (netTotal * vatRate) / 100;
  const grossTotal = netTotal + vatAmount;

  return (
    <div>
      <PageHeader title={`Rechnung ${document.number}`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-1">Zurück</span>
            </Button>
          </Link>
          <Link href={`/invoices/${id}/pdf`}>
            <Button size="sm" className="px-2 sm:px-3">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-1">PDF</span>
            </Button>
          </Link>
          <DocumentActions document={document} />
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6 max-w-4xl">
        {/* Status Badge */}
        {isPaid && (
          <div className="mb-4 flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-green-400 font-medium">Bezahlt</span>
            {document.paid_at && (
              <span className="text-green-400/70 text-sm">
                am {formatDate(document.paid_at)}
              </span>
            )}
            <Lock className="h-3 w-3 text-green-400/50 ml-auto" />
            <span className="text-green-400/50 text-xs">Gesperrt</span>
          </div>
        )}
        {document.status === 'sent' && (
          <div className="mb-4 flex items-center gap-2 bg-blue-900/30 border border-blue-700 rounded-xl px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-blue-400 font-medium">Gesendet</span>
          </div>
        )}

        {/* Vorschau im DIN 5008 Stil - wie PDF */}
        <DocumentPreview>
          {/* Kopfbereich: Logo links, Absender rechts */}
            <div className="flex justify-between mb-6">
              <div>
                {effectiveProfile?.logo_url && (
                  <img
                    src={effectiveProfile.logo_url}
                    alt="Logo"
                    className="h-14 w-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-semibold text-gray-900 text-sm">{effectiveProfile?.company_name}</p>
                <p>{effectiveProfile?.address}</p>
                <p>{effectiveProfile?.zip} {effectiveProfile?.city}</p>
                {effectiveProfile?.phone && <p>Tel: {effectiveProfile.phone}</p>}
                {effectiveProfile?.email && <p>{effectiveProfile.email}</p>}
                {effectiveProfile?.tax_number && <p>St.-Nr.: {effectiveProfile.tax_number}</p>}
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
              <p className="mb-1">{document.salutation || 'Sehr geehrte Damen und Herren,'}</p>
              {document.introduction_text && (
                <p>{document.introduction_text}</p>
              )}
            </div>

            {/* Positionstabelle - Vereinfacht */}
            <table className="w-full mb-4 text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-xs text-gray-700">
                  <th className="p-2">Beschreibung</th>
                  <th className="p-2 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {document.line_items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summenblock rechts */}
            <div className="flex justify-end mb-6">
              <div className="text-sm min-w-[320px]">
                {/* Nettobetrag (Positionen) */}
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Nettobetrag:</span>
                  <span>{formatCurrency(positionsTotal)}</span>
                </div>

                {/* Courtage Zeile */}
                {hasCourtage && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">
                      Courtage von {document.courtage_percentage}% von {formatCurrency(document.courtage_base_amount)}:
                    </span>
                    <span>{formatCurrency(courtageAmount)}</span>
                  </div>
                )}

                {/* USt. */}
                {vatRate > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">{vatRate}% USt.:</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}

                {/* Gesamtbetrag */}
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
            {effectiveProfile?.is_kleinunternehmer && (
              <p className="text-xs text-gray-500 italic mb-4">
                {getKleinunternehmerText()}
              </p>
            )}

            {/* Grußformel */}
            <div className="mt-6 text-sm">
              <p className="mb-4">Wir bedanken uns für die Zusammenarbeit.</p>
              <p className="mb-8">Mit freundlichen Grüßen</p>
              <p className="font-semibold">
                {document.sender_name || effectiveProfile?.company_name}
              </p>
            </div>

            {/* Fußzeile */}
            <div className="mt-10 pt-4 border-t border-gray-300">
              <div className="flex justify-between text-[10px] text-gray-500">
                <div>
                  <p className="font-semibold">{effectiveProfile?.company_name}</p>
                  <p>{effectiveProfile?.address}</p>
                  <p>{effectiveProfile?.zip} {effectiveProfile?.city}</p>
                </div>
                <div>
                  {effectiveProfile?.phone && <p>Tel: {effectiveProfile.phone}</p>}
                  {effectiveProfile?.email && <p>{effectiveProfile.email}</p>}
                  {effectiveProfile?.tax_number && <p>St.-Nr.: {effectiveProfile.tax_number}</p>}
                </div>
                {(effectiveProfile?.bank_name || effectiveProfile?.iban) && (
                  <div className="text-right">
                    <p className="font-semibold">Bankverbindung</p>
                    {effectiveProfile.bank_name && <p>{effectiveProfile.bank_name}</p>}
                    {effectiveProfile.iban && <p>IBAN: {effectiveProfile.iban}</p>}
                    {effectiveProfile.bic && <p>BIC: {effectiveProfile.bic}</p>}
                  </div>
                )}
              </div>
            </div>
        </DocumentPreview>
      </div>
    </div>
  );
}
