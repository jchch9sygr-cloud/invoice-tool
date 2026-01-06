'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DocumentPreview } from '@/components/documents/document-preview';
import { Search, FileWarning, Download, AlertTriangle, Pencil, FileText, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Profile {
  company_name: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
  logo_url: string | null;
  logo_size: number | null;
  signature_url: string | null;
  signature_size: number | null;
}

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
    case 0:
      return `${salutation},

wir möchten Sie freundlich daran erinnern, dass die oben genannte Rechnung fällig ist. Bitte überweisen Sie den ausstehenden Betrag auf das in der Rechnung angegebene Konto.

Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.`;
    case 1:
      return `${salutation},

bei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung trotz unserer Zahlungserinnerung${lastReminderDate ? ` vom ${formatDate(lastReminderDate)}` : ''} noch nicht beglichen wurde.

Wir bitten Sie, den ausstehenden Betrag innerhalb von 14 Tagen zu überweisen. Bei Fragen zur Rechnung nehmen Sie bitte Kontakt mit uns auf.`;
    case 2:
      return `${salutation},

trotz unserer bisherigen Erinnerungen ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.

Wir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 10 Tagen zu begleichen. Sollten Sie Fragen zur Rechnung haben oder eine Ratenzahlung wünschen, nehmen Sie bitte umgehend Kontakt mit uns auf.`;
    default:
      return `${salutation},

leider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten und die Forderung an ein Inkassounternehmen zu übergeben.`;
  }
}

export default function RemindersPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [reminderLevel, setReminderLevel] = useState(0);
  const [reminderText, setReminderText] = useState('');
  const [closingText, setClosingText] = useState('Für Rückfragen stehen wir Ihnen gerne zur Verfügung.');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadOverdueInvoices();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  };

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
      // Closing text based on level
      if (reminderLevel === 0) {
        setClosingText('Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.');
      } else if (reminderLevel >= 3) {
        setClosingText('Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.');
      } else {
        setClosingText('Für Rückfragen stehen wir Ihnen gerne zur Verfügung.');
      }
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
    // Start at level 0 (Zahlungserinnerung) for new, then increment
    const newLevel = invoice.reminder_count || 0;
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
      case 0: return 'Erinnerung';
      case 1: return '1. Mahnung';
      case 2: return '2. Mahnung';
      case 3: return 'Letzte Mahnung';
      default: return `${level}. Mahnung`;
    }
  };

  const getReminderLevelColor = (level: number): string => {
    switch (level) {
      case 0: return 'text-cyan-400';
      case 1: return 'text-yellow-400';
      case 2: return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const getReminderLevelBgColor = (level: number, isSelected: boolean): string => {
    if (!isSelected) return 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    switch (level) {
      case 0: return 'bg-cyan-600 text-white';
      case 1: return 'bg-yellow-600 text-white';
      case 2: return 'bg-orange-600 text-white';
      default: return 'bg-red-600 text-white';
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                          <p className={`text-xs mt-1 ${getReminderLevelColor(invoice.reminder_count - 1)}`}>
                            {getReminderLevelLabel(invoice.reminder_count - 1)} gesendet
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
                      Stufe wählen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => setReminderLevel(level)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            getReminderLevelBgColor(level, reminderLevel === level)
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
                      onClick={() => setShowPreview(true)}
                      className="w-full xl:hidden"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vorschau
                    </Button>
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

          {/* PDF-Vorschau */}
          <Card className="hidden xl:block">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                PDF-Vorschau
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {selectedInvoice && profile ? (
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                  <div className="p-6 text-gray-900 text-xs leading-relaxed" style={{ minHeight: '500px' }}>
                    {/* Header */}
                    <div className="flex justify-between mb-4">
                      <div>
                        {profile.logo_url && (
                          <img
                            src={profile.logo_url}
                            alt="Logo"
                            style={{ height: Math.min(profile.logo_size || 40, 40) }}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div className="text-right text-[10px] text-gray-600">
                        <p className="font-semibold text-gray-900">{profile.company_name}</p>
                        <p>{profile.address}</p>
                        <p>{profile.zip} {profile.city}</p>
                        {profile.phone && <p>Tel: {profile.phone}</p>}
                        {profile.email && <p>{profile.email}</p>}
                      </div>
                    </div>

                    {/* Empfänger */}
                    <div className="mb-3">
                      <p className="font-semibold">{selectedInvoice.customer?.name}</p>
                      {selectedInvoice.customer?.company && <p>{selectedInvoice.customer.company}</p>}
                    </div>

                    {/* Datum */}
                    <p className="text-right text-[10px] mb-3">
                      {profile.city}, {new Date().toLocaleDateString('de-DE')}
                    </p>

                    {/* Betreff */}
                    <h2 className="font-bold mb-3">
                      {getReminderLevelLabel(reminderLevel)} - Rechnung Nr. {selectedInvoice.number}
                    </h2>

                    {/* Warning Banner für letzte Mahnung */}
                    {reminderLevel >= 3 && (
                      <div className="bg-yellow-100 text-yellow-800 text-center py-1 px-2 rounded text-[9px] font-bold mb-3">
                        LETZTE MAHNUNG VOR EINLEITUNG RECHTLICHER SCHRITTE
                      </div>
                    )}

                    {/* Text */}
                    <p className="whitespace-pre-line text-[10px] mb-3">{reminderText}</p>

                    {/* Rechnungsdetails */}
                    <div className="bg-gray-100 p-3 rounded mb-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-600">Rechnungsnummer:</span>
                        <span className="font-semibold">{selectedInvoice.number}</span>
                      </div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-600">Rechnungsdatum:</span>
                        <span>{formatDate(selectedInvoice.date)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-600">Fälligkeitsdatum:</span>
                        <span>{formatDate(selectedInvoice.due_date)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1 border-t border-gray-300 font-bold">
                        <span>Offener Betrag:</span>
                        <span className="text-red-600">{formatCurrency(calculateTotal(selectedInvoice))}</span>
                      </div>
                    </div>

                    {/* Bankverbindung */}
                    <div className="text-[10px] mb-3">
                      <p className="mb-1">Bitte überweisen Sie den Betrag auf folgendes Konto:</p>
                      {profile.bank_name && <p>Bank: {profile.bank_name}</p>}
                      {profile.iban && <p>IBAN: {profile.iban}</p>}
                      {profile.bic && <p>BIC: {profile.bic}</p>}
                      <p>Verwendungszweck: {selectedInvoice.number}</p>
                    </div>

                    {/* Schluss */}
                    <p className="text-[10px] mb-2">{closingText}</p>
                    <p className="text-[10px] mb-2">Mit freundlichen Grüßen</p>
                    {profile.signature_url ? (
                      <img
                        src={profile.signature_url}
                        alt="Unterschrift"
                        style={{ height: Math.min(profile.signature_size || 30, 30) }}
                        className="object-contain mb-1"
                      />
                    ) : (
                      <div className="h-8" />
                    )}
                    <p className="font-semibold text-[10px]">{profile.company_name}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Eye className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Rechnung auswählen für Vorschau
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Preview Modal */}
        {showPreview && selectedInvoice && profile && (
          <div className="fixed inset-0 z-50 bg-black/80 xl:hidden overflow-y-auto">
            <div className="min-h-screen p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">PDF-Vorschau</h3>
                <Button variant="ghost" onClick={() => setShowPreview(false)}>
                  ✕
                </Button>
              </div>
              <DocumentPreview>
                {/* Header */}
                <div className="flex justify-between mb-6">
                  <div>
                    {profile.logo_url && (
                      <img
                        src={profile.logo_url}
                        alt="Logo"
                        style={{ height: profile.logo_size || 50 }}
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <p className="font-semibold text-gray-900 text-sm">{profile.company_name}</p>
                    <p>{profile.address}</p>
                    <p>{profile.zip} {profile.city}</p>
                    {profile.phone && <p>Tel: {profile.phone}</p>}
                    {profile.email && <p>{profile.email}</p>}
                  </div>
                </div>

                {/* Empfänger */}
                <div className="w-[240px] min-h-[80px] mb-2">
                  <p className="font-semibold">{selectedInvoice.customer?.name}</p>
                  {selectedInvoice.customer?.company && <p>{selectedInvoice.customer.company}</p>}
                </div>

                {/* Datum */}
                <p className="text-right text-sm mb-6">
                  {profile.city}, {new Date().toLocaleDateString('de-DE')}
                </p>

                {/* Betreff */}
                <h2 className="text-base font-bold mb-6">
                  {getReminderLevelLabel(reminderLevel)} - Rechnung Nr. {selectedInvoice.number}
                </h2>

                {/* Warning Banner für letzte Mahnung */}
                {reminderLevel >= 3 && (
                  <div className="bg-yellow-100 text-yellow-800 text-center py-2 px-3 rounded text-sm font-bold mb-4">
                    LETZTE MAHNUNG VOR EINLEITUNG RECHTLICHER SCHRITTE
                  </div>
                )}

                {/* Text */}
                <p className="whitespace-pre-line text-sm mb-4 leading-relaxed">{reminderText}</p>

                {/* Rechnungsdetails */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Rechnungsnummer:</span>
                    <span className="font-semibold">{selectedInvoice.number}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Rechnungsdatum:</span>
                    <span>{formatDate(selectedInvoice.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Fälligkeitsdatum:</span>
                    <span>{formatDate(selectedInvoice.due_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-300 font-bold">
                    <span>Offener Betrag:</span>
                    <span className="text-red-600">{formatCurrency(calculateTotal(selectedInvoice))}</span>
                  </div>
                </div>

                {/* Bankverbindung */}
                <div className="text-sm mb-4">
                  <p className="mb-2">Bitte überweisen Sie den Betrag auf folgendes Konto:</p>
                  {profile.bank_name && <p>Bank: {profile.bank_name}</p>}
                  {profile.iban && <p>IBAN: {profile.iban}</p>}
                  {profile.bic && <p>BIC: {profile.bic}</p>}
                  <p>Verwendungszweck: {selectedInvoice.number}</p>
                </div>

                {/* Schluss */}
                <div className="mt-6">
                  <p className="mb-4 text-sm">{closingText}</p>
                  <p className="mb-2 text-sm">Mit freundlichen Grüßen</p>
                  {profile.signature_url ? (
                    <img
                      src={profile.signature_url}
                      alt="Unterschrift"
                      style={{ height: profile.signature_size || 50 }}
                      className="object-contain mb-1"
                    />
                  ) : (
                    <div className="h-12 my-2" />
                  )}
                  <p className="font-semibold">{profile.company_name}</p>
                </div>

                {/* Footer */}
                <div className="mt-10 pt-4 border-t border-gray-300">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <div>
                      <p className="font-semibold">{profile.company_name}</p>
                      <p>{profile.address}</p>
                      <p>{profile.zip} {profile.city}</p>
                    </div>
                    <div>
                      {profile.phone && <p>Tel: {profile.phone}</p>}
                      {profile.email && <p>{profile.email}</p>}
                      {profile.tax_number && <p>St.-Nr.: {profile.tax_number}</p>}
                    </div>
                    {(profile.bank_name || profile.iban) && (
                      <div className="text-right">
                        <p className="font-semibold">Bankverbindung</p>
                        {profile.bank_name && <p>{profile.bank_name}</p>}
                        {profile.iban && <p>IBAN: {profile.iban}</p>}
                        {profile.bic && <p>BIC: {profile.bic}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </DocumentPreview>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
