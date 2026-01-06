'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calculator, X, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Customer, Document, LineItem, Profile, DocumentType } from '@/types/database';

interface LineItemWithId {
  id: string;
  description: string;
  amount: number;
  isNew?: boolean;
}

interface DocumentEditFormProps {
  document: Document;
  lineItems: LineItem[];
  customers: Customer[];
  profile: Profile | null;
}

export function DocumentEditForm({ document, lineItems, customers, profile }: DocumentEditFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if document is locked (paid)
  const isLocked = document.status === 'paid';

  const [formData, setFormData] = useState({
    customer_id: document.customer_id || '',
    date: document.date || '',
    due_date: document.due_date || '',
    location: document.location || '',
    salutation: document.salutation || 'Sehr geehrte Damen und Herren,',
    introduction_text: document.introduction_text || '',
    notes: document.notes || '',
    vat_rate: document.vat_rate || 0,
    sender_name: document.sender_name || '',
  });

  const generateItemId = () => Math.random().toString(36).substring(2, 11);

  const [editLineItems, setEditLineItems] = useState<LineItemWithId[]>(
    lineItems.length > 0
      ? lineItems.map(item => ({
          id: item.id,
          description: item.description,
          amount: item.quantity * item.unit_price,
        }))
      : [{ id: generateItemId(), description: '', amount: 0, isNew: true }]
  );

  // Courtage State
  const [courtageEnabled, setCourtageEnabled] = useState(
    !!(document.courtage_base_amount && document.courtage_percentage)
  );
  const [courtageData, setCourtageData] = useState({
    baseAmount: document.courtage_base_amount || 0,
    percentage: document.courtage_percentage || 3.57,
  });

  const addLineItem = () => {
    setEditLineItems([
      ...editLineItems,
      { id: generateItemId(), description: '', amount: 0, isNew: true },
    ]);
  };

  const removeLineItem = (itemId: string) => {
    if (editLineItems.length === 1) return;
    setEditLineItems(editLineItems.filter((item) => item.id !== itemId));
  };

  const updateLineItem = (
    itemId: string,
    field: keyof Omit<LineItemWithId, 'id' | 'isNew'>,
    value: string | number
  ) => {
    setEditLineItems(editLineItems.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Calculations
  const positionsTotal = editLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const courtageAmount = courtageEnabled ? (courtageData.baseAmount * courtageData.percentage) / 100 : 0;
  const netTotal = positionsTotal + courtageAmount;
  const vatAmount = (netTotal * formData.vat_rate) / 100;
  const grossTotal = netTotal + vatAmount;

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError('Bezahlte Rechnungen können nicht bearbeitet werden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update document
      const { error: docError } = await supabase
        .from('documents')
        .update({
          customer_id: formData.customer_id || null,
          date: formData.date,
          due_date: formData.due_date,
          notes: formData.notes,
          vat_rate: formData.vat_rate,
          location: formData.location || null,
          salutation: formData.salutation || null,
          introduction_text: formData.introduction_text || null,
          sender_name: formData.sender_name || null,
          courtage_base_amount: courtageEnabled ? courtageData.baseAmount : null,
          courtage_percentage: courtageEnabled ? courtageData.percentage : null,
        })
        .eq('id', document.id)
        .eq('user_id', user.id);

      if (docError) throw docError;

      // Delete existing line items
      await supabase
        .from('line_items')
        .delete()
        .eq('document_id', document.id);

      // Insert new line items
      const lineItemsToInsert = editLineItems
        .filter((item) => item.description && item.amount > 0)
        .map((item, index) => ({
          document_id: document.id,
          description: item.description,
          quantity: 1,
          unit: 'pauschal',
          unit_price: item.amount,
          position: index,
        }));

      if (lineItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('line_items')
          .insert(lineItemsToInsert);

        if (itemsError) throw itemsError;
      }

      router.push(document.type === 'invoice' ? `/invoices/${document.id}` : `/quotes/${document.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating document:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Fehler beim Speichern der Änderungen');
      }
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  const typeLabel = document.type === 'invoice' ? 'Rechnung' : 'Angebot';

  if (isLocked) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-700 bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-400">Dokument gesperrt</h3>
                <p className="text-sm text-yellow-400/70">
                  Diese {typeLabel} ist als bezahlt markiert und kann nicht mehr bearbeitet werden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => router.back()}>
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Absender & Empfänger */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Absender & Empfänger</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
          {/* Absender (readonly) */}
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Absender</p>
            <div className="bg-gray-800 p-3 sm:p-4 rounded-xl text-gray-200 text-sm">
              {profile ? (
                <>
                  <p className="font-medium text-white">{profile.company_name || 'Firma nicht hinterlegt'}</p>
                  <p>{profile.address}</p>
                  <p>{profile.zip} {profile.city}</p>
                  {profile.tax_number && <p className="mt-1 text-gray-400">St.-Nr.: {profile.tax_number}</p>}
                </>
              ) : (
                <p className="text-gray-400">Bitte hinterlegen Sie Ihre Firmendaten in den Einstellungen.</p>
              )}
            </div>
          </div>

          {/* Empfänger */}
          <div>
            <Select
              id="customer"
              label="Empfänger"
              options={customerOptions}
              value={formData.customer_id}
              onChange={(e) =>
                setFormData({ ...formData, customer_id: e.target.value })
              }
            />
            {selectedCustomer && (
              <div className="mt-2 bg-gray-800 p-3 sm:p-4 rounded-xl text-gray-200 text-sm">
                <p className="font-medium text-white">{selectedCustomer.name}</p>
                {selectedCustomer.company && <p>{selectedCustomer.company}</p>}
                <p>{selectedCustomer.address}</p>
                <p>{selectedCustomer.zip} {selectedCustomer.city}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ort & Datum */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Ort & Datum</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="location"
              label="Ort"
              placeholder="z.B. Berlin"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
            <Input
              id="date"
              type="date"
              label={document.type === 'invoice' ? 'Rechnungsdatum' : 'Angebotsdatum'}
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <Input
              id="due_date"
              type="date"
              label={document.type === 'invoice' ? 'Fällig am' : 'Gültig bis'}
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Einleitungstext */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Anrede & Einleitung</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <Input
            id="salutation"
            label="Anrede"
            placeholder="z.B. Sehr geehrte Frau Müller,"
            value={formData.salutation}
            onChange={(e) =>
              setFormData({ ...formData, salutation: e.target.value })
            }
          />
          <Textarea
            id="introduction_text"
            rows={3}
            label="Einleitungstext"
            value={formData.introduction_text}
            onChange={(e) =>
              setFormData({ ...formData, introduction_text: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* Positionen */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Positionen</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            {/* Desktop Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-sm font-medium text-gray-400">
              <div className="col-span-8">Beschreibung</div>
              <div className="col-span-3 text-right">Betrag</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {editLineItems.map((item, index) => (
              <div key={item.id} className="space-y-3 sm:space-y-0">
                {/* Mobile: Card-style layout */}
                <div className="sm:hidden bg-gray-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase">Position {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      disabled={editLineItems.length === 1}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Beschreibung"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, 'description', e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Betrag in €"
                    value={item.amount || ''}
                    onChange={(e) =>
                      updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden sm:grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-8">
                    <Input
                      placeholder="z.B. Beratungsleistung, Vermittlung, etc."
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      disabled={editLineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLineItem} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Position hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courtage & Summen */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Courtage & Summen</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          {/* Courtage Toggle */}
          {!courtageEnabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCourtageEnabled(true)}
              className="w-full sm:w-auto"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Courtage hinzufügen
            </Button>
          ) : (
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Courtage berechnen</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCourtageEnabled(false);
                    setCourtageData({ baseAmount: 0, percentage: 3.57 });
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  label="Basisbetrag (€)"
                  placeholder="z.B. 300000"
                  value={courtageData.baseAmount || ''}
                  onChange={(e) =>
                    setCourtageData({ ...courtageData, baseAmount: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  label="Prozentsatz (%)"
                  value={courtageData.percentage}
                  onChange={(e) =>
                    setCourtageData({ ...courtageData, percentage: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          )}

          {/* USt. Rate */}
          <div className="max-w-[200px]">
            <Input
              id="vat_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              label="Umsatzsteuer (%)"
              value={formData.vat_rate}
              onChange={(e) =>
                setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Summen */}
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <div className="w-full sm:w-auto sm:min-w-[350px] space-y-2">
              <div className="flex justify-between gap-4">
                <p className="text-sm text-gray-400">Nettobetrag (Positionen)</p>
                <p className="text-sm text-white">{formatCurrency(positionsTotal)}</p>
              </div>

              {courtageEnabled && courtageAmount > 0 && (
                <div className="flex justify-between gap-4">
                  <p className="text-sm text-gray-400">
                    Courtage von {courtageData.percentage}% von {formatCurrency(courtageData.baseAmount)}
                  </p>
                  <p className="text-sm text-white">{formatCurrency(courtageAmount)}</p>
                </div>
              )}

              {courtageEnabled && courtageAmount > 0 && (
                <div className="flex justify-between gap-4 pt-1 border-t border-gray-600">
                  <p className="text-sm text-gray-400">Nettobetrag gesamt</p>
                  <p className="text-sm text-white">{formatCurrency(netTotal)}</p>
                </div>
              )}

              {formData.vat_rate > 0 && (
                <div className="flex justify-between gap-4">
                  <p className="text-sm text-gray-400">{formData.vat_rate}% USt.</p>
                  <p className="text-sm text-white">{formatCurrency(vatAmount)}</p>
                </div>
              )}

              <div className="flex justify-between gap-4 pt-2 border-t border-gray-600">
                <p className="text-sm font-medium text-gray-200">Gesamtbetrag</p>
                <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(grossTotal)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schlusstext & Anmerkungen */}
      <Card className="mt-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Schlusstext & Absender</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <Textarea
            id="notes"
            rows={2}
            label="Zahlungsbedingungen / Anmerkungen"
            placeholder="z.B. Zahlbar innerhalb von 14 Tagen..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
          <Input
            id="sender_name"
            label="Name des Absenders (Unterschrift)"
            placeholder="z.B. Max Mustermann"
            value={formData.sender_name}
            onChange={(e) =>
              setFormData({ ...formData, sender_name: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-xl">
          <p className="font-medium">Fehler:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" loading={loading} className="w-full sm:w-auto order-1">
          Änderungen speichern
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto order-2">
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
