'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileWarning, Send, Download, AlertTriangle } from 'lucide-react';
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

export default function RemindersPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [reminderLevel, setReminderLevel] = useState(1);
  const [sendingReminder, setSendingReminder] = useState(false);

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
    setReminderLevel((invoice.reminder_count || 0) + 1);
  };

  const handleDownloadReminder = async () => {
    if (!selectedInvoice) return;

    // Open PDF in new tab
    window.open(`/reminders/${selectedInvoice.id}/pdf?level=${reminderLevel}`, '_blank');
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;
    setSendingReminder(true);

    try {
      const response = await fetch(`/api/documents/${selectedInvoice.id}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: reminderLevel }),
      });

      if (response.ok) {
        // Reload invoices to update reminder count
        await loadOverdueInvoices();
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setSendingReminder(false);
    }
  };

  const getReminderLevelLabel = (level: number): string => {
    switch (level) {
      case 1:
        return '1. Mahnung (Zahlungserinnerung)';
      case 2:
        return '2. Mahnung';
      case 3:
        return '3. Mahnung (letzte Mahnung)';
      default:
        return `${level}. Mahnung`;
    }
  };

  const getReminderLevelColor = (level: number): string => {
    switch (level) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-orange-400';
      default:
        return 'text-red-400';
    }
  };

  return (
    <div>
      <PageHeader title="Mahnwesen">
        <div className="text-sm text-gray-400">
          {overdueInvoices.length} überfällige Rechnung{overdueInvoices.length !== 1 ? 'en' : ''}
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nach Rechnungsnummer oder Kundenname suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Überfällige Rechnungen */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-yellow-500" />
                Überfällige Rechnungen
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Lade...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine überfälligen Rechnungen'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date);
                    const total = calculateTotal(invoice);
                    const isSelected = selectedInvoice?.id === invoice.id;

                    return (
                      <button
                        key={invoice.id}
                        onClick={() => handleSelectInvoice(invoice)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          isSelected
                            ? 'bg-blue-900/30 border-blue-600'
                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-white">{invoice.number}</p>
                            <p className="text-sm text-gray-400">
                              {invoice.customer?.name || 'Kein Kunde'}
                              {invoice.customer?.company && ` (${invoice.customer.company})`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatCurrency(total)}</p>
                            <p className={`text-xs ${daysOverdue > 14 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {daysOverdue} Tage überfällig
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Fällig: {formatDate(invoice.due_date)}</span>
                          {invoice.reminder_count > 0 && (
                            <span className={getReminderLevelColor(invoice.reminder_count)}>
                              {invoice.reminder_count}. Mahnung gesendet
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mahnung erstellen */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Mahnung erstellen</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {selectedInvoice ? (
                <div className="space-y-4">
                  {/* Ausgewählte Rechnung */}
                  <div className="p-4 bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Ausgewählte Rechnung</p>
                    <p className="font-semibold text-white text-lg">{selectedInvoice.number}</p>
                    <p className="text-gray-300">{selectedInvoice.customer?.name}</p>
                    <p className="text-xl font-bold text-white mt-2">
                      {formatCurrency(calculateTotal(selectedInvoice))}
                    </p>
                  </div>

                  {/* Mahnstufe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mahnstufe
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => setReminderLevel(level)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            reminderLevel === level
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {level}. Mahnung
                        </button>
                      ))}
                    </div>
                    <p className={`mt-2 text-sm ${getReminderLevelColor(reminderLevel)}`}>
                      {getReminderLevelLabel(reminderLevel)}
                    </p>
                  </div>

                  {/* Info zur Mahnstufe */}
                  <div className="p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400">
                    {reminderLevel === 1 && (
                      <p>Freundliche Erinnerung an die ausstehende Zahlung. Keine zusätzlichen Gebühren.</p>
                    )}
                    {reminderLevel === 2 && (
                      <p>Nachdrückliche Zahlungsaufforderung mit Hinweis auf mögliche weitere Schritte.</p>
                    )}
                    {reminderLevel >= 3 && (
                      <p>Letzte Mahnung vor eventueller Übergabe an ein Inkassounternehmen.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={handleDownloadReminder}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF herunterladen
                    </Button>
                    {selectedInvoice.customer?.email && (
                      <Button
                        onClick={handleSendReminder}
                        className="flex-1"
                        disabled={sendingReminder}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendingReminder ? 'Wird gesendet...' : 'Per E-Mail senden'}
                      </Button>
                    )}
                  </div>

                  {/* Link zur Rechnung */}
                  <Link
                    href={`/invoices/${selectedInvoice.id}`}
                    className="block text-center text-sm text-blue-400 hover:text-blue-300"
                  >
                    Rechnung anzeigen →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileWarning className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    Wähle links eine überfällige Rechnung aus, um eine Mahnung zu erstellen.
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
