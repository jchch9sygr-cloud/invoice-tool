'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, FileWarning, Download, AlertTriangle, Pencil, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface OverdueInvoice {
  id: string;
  number: string;
  date: string;
  due_date: string;
  status: string;
  customer: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  } | null;
  line_items: Array<{ quantity: number; unit_price: number }>;
  vat_rate: number;
  courtage_base_amount: number | null;
  courtage_percentage: number | null;
  reminder_count: number;
  last_reminder_date: string | null;
}

function calculateTotal(invoice: OverdueInvoice): number {
  const positionsTotal = (invoice.line_items || []).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const courtageAmount = invoice.courtage_base_amount && invoice.courtage_percentage
    ? (invoice.courtage_base_amount * invoice.courtage_percentage) / 100
    : 0;
  const netTotal = positionsTotal + courtageAmount;
  const vatAmount = (netTotal * (invoice.vat_rate || 0)) / 100;
  return netTotal + vatAmount;
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getDefaultReminderText(level: number, customerName: string, lastReminderDate: string | null): string {
  const salutation = customerName.toLowerCase().includes('herr')
    ? 'Sehr geehrter Herr'
    : customerName.toLowerCase().includes('frau')
    ? 'Sehr geehrte Frau'
    : 'Sehr geehrte Damen und Herren';

  switch (level) {
    case 1:
      return `${salutation},

bei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung noch nicht beglichen wurde. Wir möchten Sie freundlich daran erinnern, den ausstehenden Betrag zu überweisen.

Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie dieses bitte als gegenstandslos.`;
    case 2:
      return `${salutation},

trotz unserer Zahlungserinnerung${lastReminderDate ? ` vom ${formatDate(lastReminderDate)}` : ''} ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.

Wir bitten Sie daher nochmals, den ausstehenden Betrag umgehend zu begleichen. Sollten Sie Fragen zur Rechnung haben oder eine Ratenzahlung wünschen, nehmen Sie bitte Kontakt mit uns auf.`;
    default:
      return `${salutation},

leider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, weitere rechtliche Schritte einzuleiten.`;
  }
}

export default function RemindersPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [reminderLevel, setReminderLevel] = useState(1);
  const [reminderText, setReminderText] = useState('');
  const [closingText, setClosingText] = useState('Für Rückfragen stehen wir Ihnen gerne zur Verfügung.');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInvoices(overdueInvoices);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredInvoices(
        overdueInvoices.filter(
          (inv) =>
            inv.number.toLowerCase().includes(query) ||
            inv.customer?.name.toLowerCase().includes(query) ||
            inv.customer?.company?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, overdueInvoices]);

  // Update reminder text when level or invoice changes
  useEffect(() => {
    if (selectedInvoice) {
      const defaultText = getDefaultReminderText(
        reminderLevel,
        selectedInvoice.customer?.name || '',
        selectedInvoice.last_reminder_date
      );
      setReminderText(defaultText);
      setClosingText(
        reminderLevel >= 3
          ? 'Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.'
          : 'Für Rückfragen stehen wir Ihnen gerne zur Verfügung.'
      );
    }
  }, [reminderLevel, selectedInvoice]);

  const loadOverdueInvoices = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('documents')
      .select('*, customer:customers(*), line_items(*)')
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .in('status', ['draft', 'sent'])
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (!error && data) {
      setOverdueInvoices(data as OverdueInvoice[]);
      setFilteredInvoices(data as OverdueInvoice[]);
    }
    setLoading(false);
  };

  const handleSelectInvoice = (invoice: OverdueInvoice) => {
    setSelectedInvoice(invoice);
    const newLevel = (invoice.reminder_count || 0) + 1;
    setReminderLevel(Math.min(newLevel, 3));
    setIsEditing(false);
  };

  const handleDownloadReminder = async () => {
    if (!selectedInvoice) return;

    // Encode the custom text for URL
    const params = new URLSearchParams({
      level: reminderLevel.toString(),
      text: encodeURIComponent(reminderText),
      closing: encodeURIComponent(closingText),
    });

    window.open(`/reminders/${selectedInvoice.id}/pdf?${params.toString()}`, '_blank');
  };

  const handleDownloadWord = () => {
    if (!selectedInvoice) return;

    // Encode the custom text for URL
    const params = new URLSearchParams({
      level: reminderLevel.toString(),
      text: encodeURIComponent(reminderText),
      closing: encodeURIComponent(closingText),
    });

    // Direct download via anchor tag
    window.location.href = `/api/reminders/${selectedInvoice.id}/word?${params.toString()}`;
  };

  const handleMarkAsSent = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`/api/documents/${selectedInvoice.id}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: reminderLevel }),
      });

      if (response.ok) {
        await loadOverdueInvoices();
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Failed to mark reminder as sent:', error);
    }
  };

  const getReminderLevelLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Zahlungserinnerung';
      case 2: return '2. Mahnung';
      case 3: return 'Letzte Mahnung';
      default: return `${level}. Mahnung`;
    }
  };

  const getReminderLevelColor = (level: number): string => {
    switch (level) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div>
      <PageHeader title="Mahnwesen">
        <div className="text-sm text-gray-400">
          {overdueInvoices.length} überfällig
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="RE-Nummer oder Kundenname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Überfällige Rechnungen */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-yellow-500" />
                Überfällige Rechnungen
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Lade...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? 'Keine Ergebnisse' : 'Keine überfälligen Rechnungen'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredInvoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date);
                    const total = calculateTotal(invoice);
                    const isSelected = selectedInvoice?.id === invoice.id;

                    return (
                      <button
                        key={invoice.id}
                        onClick={() => handleSelectInvoice(invoice)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          isSelected
                            ? 'bg-blue-900/30 border-blue-600'
                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm truncate">{invoice.number}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {invoice.customer?.name || 'Kein Kunde'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-white text-sm">{formatCurrency(total)}</p>
                            <p className={`text-xs ${daysOverdue > 14 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {daysOverdue}d überfällig
                            </p>
                          </div>
                        </div>
                        {invoice.reminder_count > 0 && (
                          <p className={`text-xs mt-1 ${getReminderLevelColor(invoice.reminder_count)}`}>
                            {invoice.reminder_count}. Mahnung gesendet
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mahnung erstellen */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mahnung erstellen</CardTitle>
                {selectedInvoice && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-gray-400"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {isEditing ? 'Vorschau' : 'Bearbeiten'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {selectedInvoice ? (
                <div className="space-y-4">
                  {/* Ausgewählte Rechnung */}
                  <div className="p-3 bg-gray-800 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400">Rechnung</p>
                        <p className="font-semibold text-white">{selectedInvoice.number}</p>
                        <p className="text-sm text-gray-300">{selectedInvoice.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Offener Betrag</p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateTotal(selectedInvoice))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mahnstufe */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Mahnstufe
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => setReminderLevel(level)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            reminderLevel === level
                              ? level === 1 ? 'bg-yellow-600 text-white'
                              : level === 2 ? 'bg-orange-600 text-white'
                              : 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {getReminderLevelLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text bearbeiten oder Vorschau */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Mahnungstext
                        </label>
                        <Textarea
                          value={reminderText}
                          onChange={(e) => setReminderText(e.target.value)}
                          rows={6}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Schlusstext
                        </label>
                        <Input
                          value={closingText}
                          onChange={(e) => setClosingText(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-800/50 rounded-lg text-sm text-gray-300 max-h-48 overflow-y-auto">
                      <p className="whitespace-pre-line">{reminderText}</p>
                      <p className="mt-3 text-gray-400">{closingText}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex gap-2">
                      <Button onClick={handleDownloadReminder} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleDownloadWord} variant="outline" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleMarkAsSent}
                      className="w-full"
                    >
                      Als gesendet markieren
                    </Button>
                  </div>

                  {/* Link zur Rechnung */}
                  <Link
                    href={`/invoices/${selectedInvoice.id}`}
                    className="block text-center text-xs text-blue-400 hover:text-blue-300"
                  >
                    Rechnung anzeigen →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileWarning className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Rechnung auswählen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
