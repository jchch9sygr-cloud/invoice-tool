'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { AlertTriangle, Mail, X, Send, Clock, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface OverdueInvoice {
  id: string;
  number: string;
  date: string;
  due_date: string;
  customer: {
    id: string;
    name: string;
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

function getDaysSinceLastReminder(lastReminderDate: string | null): number {
  if (!lastReminderDate) return Infinity;
  const last = new Date(lastReminderDate);
  const today = new Date();
  const diffTime = today.getTime() - last.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Prüft ob eine Mahnung/Erinnerung fällig ist basierend auf dem Intervall
// Zahlungserinnerung: 3-7 Tage nach Fälligkeit
// Mahnungen: 14 Tage nach letzter Erinnerung/Mahnung
function isReminderDue(invoice: OverdueInvoice): boolean {
  const daysOverdue = getDaysOverdue(invoice.due_date);
  const daysSinceLastReminder = getDaysSinceLastReminder(invoice.last_reminder_date);

  // Erste Zahlungserinnerung: 3+ Tage überfällig, noch keine Erinnerung gesendet
  if (invoice.reminder_count === 0 && daysOverdue >= 3) {
    return true;
  }

  // Nachfolgende Mahnungen: 14 Tage seit letzter Erinnerung
  if (invoice.reminder_count > 0 && daysSinceLastReminder >= 14) {
    return true;
  }

  return false;
}

function getReminderLevel(invoice: OverdueInvoice): { level: number; label: string } {
  const count = invoice.reminder_count || 0;
  switch (count) {
    case 0: return { level: 0, label: 'Zahlungserinnerung' };
    case 1: return { level: 1, label: '1. Mahnung' };
    case 2: return { level: 2, label: '2. Mahnung' };
    default: return { level: 3, label: 'Letzte Mahnung' };
  }
}

export function OverdueNotification() {
  const supabase = createClient();
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  const loadOverdueInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('documents')
      .select('id, number, date, due_date, vat_rate, courtage_base_amount, courtage_percentage, reminder_count, last_reminder_date, customer:customers(id, name, email), line_items(*)')
      .eq('user_id', user.id)
      .eq('type', 'invoice')
      .in('status', ['draft', 'sent'])
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (!error && data) {
      // Nur Rechnungen zeigen, bei denen eine Mahnung/Erinnerung fällig ist
      const dueInvoices = (data as unknown as OverdueInvoice[]).filter(isReminderDue);
      setOverdueInvoices(dueInvoices);
    }
  };

  const handleOpenReminder = (invoice: OverdueInvoice) => {
    setSelectedInvoice(invoice);
    setEmail(invoice.customer?.email || '');
    setSent(false);
    setShowModal(true);
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice || !email) return;

    setSending(true);
    try {
      const response = await fetch(`/api/documents/${selectedInvoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'reminder',
          level: selectedInvoice.reminder_count || 0,
        }),
      });

      if (response.ok) {
        // Diese Rechnung aus der Liste entfernen (wird erst bei nächstem Intervall wieder angezeigt)
        setOverdueInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));

        // Modal nach kurzem Feedback schließen
        setSent(true);
        setTimeout(() => {
          setShowModal(false);
          setSent(false);
          setSelectedInvoice(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = (invoiceId: string) => {
    setDismissed(prev => [...prev, invoiceId]);
  };

  const visibleInvoices = overdueInvoices.filter(inv => !dismissed.includes(inv.id));

  if (visibleInvoices.length === 0) return null;

  // Show the most urgent (longest overdue) invoice first
  const urgentInvoice = visibleInvoices[0];
  const daysOverdue = getDaysOverdue(urgentInvoice.due_date);
  const reminderInfo = getReminderLevel(urgentInvoice);
  const isUrgent = reminderInfo.level >= 2;

  return (
    <>
      {/* Notification Banner */}
      <div className={`rounded-xl border p-4 ${
        isUrgent
          ? 'bg-red-900/30 border-red-800'
          : 'bg-yellow-900/30 border-yellow-800'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${
            isUrgent ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${isUrgent ? 'text-red-300' : 'text-yellow-300'}`}>
                {visibleInvoices.length === 1
                  ? `${reminderInfo.label} fällig`
                  : `${visibleInvoices.length} Mahnungen fällig`}
              </h3>
            </div>

            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-white">{urgentInvoice.number}</strong> für {urgentInvoice.customer?.name || 'Unbekannt'} ist seit <strong className={isUrgent ? 'text-red-400' : 'text-yellow-400'}>{daysOverdue} Tagen</strong> überfällig.
              {' '}Jetzt {reminderInfo.label} senden.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleOpenReminder(urgentInvoice)}
                className={isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700 text-black'}
              >
                <Mail className="h-4 w-4 mr-1" />
                {reminderInfo.label} senden
              </Button>
              <Link href="/reminders">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Mahnwesen öffnen
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(urgentInvoice.id)}
                className="text-gray-500"
              >
                Später
              </Button>
            </div>
          </div>

          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-lg font-bold text-white">{formatCurrency(calculateTotal(urgentInvoice))}</p>
            <p className="text-xs text-gray-500">Fällig: {formatDate(urgentInvoice.due_date)}</p>
          </div>
        </div>
      </div>

      {/* Send Reminder Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader>
          <h3 className="text-xl font-semibold text-white">
            {selectedInvoice ? getReminderLevel(selectedInvoice).label : 'Zahlungserinnerung'} senden
          </h3>
        </ModalHeader>
        <ModalBody>
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="p-4 bg-gray-800 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-400">Rechnung</p>
                    <p className="font-semibold text-white">{selectedInvoice.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Betrag</p>
                    <p className="font-bold text-white">{formatCurrency(calculateTotal(selectedInvoice))}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Kunde: {selectedInvoice.customer?.name}</span>
                  <span className="text-yellow-400">{getDaysOverdue(selectedInvoice.due_date)} Tage überfällig</span>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-Mail-Adresse
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kunde@beispiel.de"
                />
                <p className="text-xs text-gray-500 mt-1">
                  E-Mail-Adresse kann hier angepasst werden
                </p>
              </div>

              {/* Status message */}
              {sent && (
                <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Zahlungserinnerung wurde erfolgreich gesendet!
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {getReminderLevel(selectedInvoice).label} wird per E-Mail mit PDF-Anhang an den Kunden gesendet.
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSendReminder}
            loading={sending}
            disabled={!email || sent}
          >
            <Send className="h-4 w-4 mr-2" />
            {sent ? 'Gesendet!' : `${selectedInvoice ? getReminderLevel(selectedInvoice).label : 'Erinnerung'} senden`}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
