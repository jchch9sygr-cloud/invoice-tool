'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/pdf/invoice-pdf';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InvoicePDFPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    generatePDF();
  }, []);

  const generatePDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [
        { data: document },
        { data: profile },
      ] = await Promise.all([
        supabase
          .from('documents')
          .select('*, customer:customers(*), line_items(*)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (!document || !profile) {
        router.push('/invoices');
        return;
      }

      // Use profile snapshot for paid invoices
      const isPaid = document.status === 'paid';
      const effectiveProfile = isPaid && document.profile_snapshot
        ? document.profile_snapshot
        : profile;

      setDocumentNumber(document.number);
      setCustomerName(document.customer?.name || '');

      const blob = await pdf(
        <InvoicePDF
          document={document}
          lineItems={document.line_items || []}
          profile={effectiveProfile}
          customer={document.customer}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      // Dateiname: RE-Nr + Kundenname (Sonderzeichen entfernt)
      const safeCustomerName = customerName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_');
      const fileName = safeCustomerName
        ? `${documentNumber}_${safeCustomerName}.pdf`
        : `${documentNumber}.pdf`;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header - Dunkles Theme */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/invoices/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <h1 className="font-semibold text-white">{documentNumber || 'PDF Vorschau'}</h1>
        </div>
        <Button onClick={handleDownload} disabled={!pdfUrl}>
          <Download className="h-4 w-4 mr-1" />
          Herunterladen
        </Button>
      </div>

      {/* PDF Viewer */}
      <div className="flex items-center justify-center p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-400">PDF wird erstellt...</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full max-w-4xl h-[calc(100vh-150px)] bg-white shadow-lg rounded-lg"
          />
        ) : (
          <p className="text-gray-400">Fehler beim Erstellen der PDF.</p>
        )}
      </div>
    </div>
  );
}
