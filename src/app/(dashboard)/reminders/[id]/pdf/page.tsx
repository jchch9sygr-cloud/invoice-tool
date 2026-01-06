'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { pdf } from '@react-pdf/renderer';
import { ReminderPDF } from '@/components/pdf/reminder-pdf';
import { Loader2 } from 'lucide-react';
import type { Document, LineItem, Profile, Customer } from '@/types/database';

interface ReminderPDFPageProps {
  params: Promise<{ id: string }>;
}

export default function ReminderPDFPage({ params }: ReminderPDFPageProps) {
  const searchParams = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1', 10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePDF = async () => {
      try {
        const { id } = await params;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Nicht angemeldet');
          return;
        }

        // Fetch document data
        const [
          { data: document },
          { data: profile },
        ] = await Promise.all([
          supabase
            .from('documents')
            .select('*, customer:customers(*), line_items(*)')
            .eq('id', id)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single(),
        ]);

        if (!document || !profile) {
          setError('Dokument nicht gefunden');
          return;
        }

        // Calculate total
        const positionsTotal = (document.line_items || []).reduce(
          (sum: number, item: LineItem) => sum + item.quantity * item.unit_price,
          0
        );
        const courtageAmount = document.courtage_base_amount && document.courtage_percentage
          ? (document.courtage_base_amount * document.courtage_percentage) / 100
          : 0;
        const netTotal = positionsTotal + courtageAmount;
        const vatAmount = (netTotal * (document.vat_rate || 0)) / 100;
        const totalAmount = netTotal + vatAmount;

        // Generate PDF
        const blob = await pdf(
          <ReminderPDF
            document={document as Document}
            lineItems={document.line_items || []}
            profile={profile as Profile}
            customer={document.customer as Customer | null}
            level={level}
            totalAmount={totalAmount}
          />
        ).toBlob();

        // Create download
        const url = URL.createObjectURL(blob);
        const filename = `Mahnung_${level}_${document.number.replace(/\//g, '-')}.pdf`;

        // Open in new tab or download
        const link = window.document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Redirect back
        setTimeout(() => {
          window.close();
        }, 1000);

      } catch (err) {
        console.error('PDF generation error:', err);
        setError('Fehler beim Erstellen der PDF');
      } finally {
        setLoading(false);
      }
    };

    generatePDF();
  }, [params, level]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Mahnung wird erstellt...</p>
      </div>
    </div>
  );
}
