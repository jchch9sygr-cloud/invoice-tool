'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, generateDocumentNumber, calculateTotal, calculateVat, calculateGrossTotal } from '@/lib/utils';
import type { Customer, LineItemFormData, DocumentType, Profile } from '@/types/database';

interface DocumentFormProps {
  type: DocumentType;
  customers: Customer[];
  profile: Profile | null;
  documentCount: number;
}

export function DocumentForm({ type, customers, profile, documentCount }: DocumentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState({
    customer_id: '',
    date: today,
    due_date: dueDate,
    location: profile?.city || '',
    introduction_text: type === 'invoice'
      ? 'gemäß den vereinbarten Vergütungskonditionen erlauben wir uns Ihnen für die erbrachten Leistungen den nachfolgenden Betrag in Rechnung zu stellen:'
      : 'wir freuen uns, Ihnen folgendes Angebot unterbreiten zu können:',
    notes: type === 'invoice' ? 'Zahlbar innerhalb von 14 Tagen.' : 'Dieses Angebot ist 30 Tage gültig.',
    vat_rate: 20,
    sender_name: '',
  });

  const [lineItems, setLineItems] = useState<LineItemFormData[]>([
    { description: '', quantity: 1, unit: 'Stück', unit_price: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unit: 'Stück', unit_price: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItemFormData,
    value: string | number
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const netTotal = calculateTotal(lineItems);
  const vatAmount = calculateVat(netTotal, formData.vat_rate);
  const grossTotal = calculateGrossTotal(netTotal, formData.vat_rate);

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const documentNumber = generateDocumentNumber(type, documentCount);

      // Create document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          customer_id: formData.customer_id || null,
          type,
          number: documentNumber,
          date: formData.date,
          due_date: formData.due_date,
          notes: formData.notes,
          vat_rate: formData.vat_rate,
          location: formData.location || null,
          introduction_text: formData.introduction_text || null,
          sender_name: formData.sender_name || null,
          status: 'draft',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create line items
      const lineItemsToInsert = lineItems
        .filter((item) => item.description && item.unit_price > 0)
        .map((item, index) => ({
          document_id: doc.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          position: index,
        }));

      if (lineItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('line_items')
          .insert(lineItemsToInsert);

        if (itemsError) throw itemsError;
      }

      router.push(type === 'invoice' ? '/invoices' : '/quotes');
      router.refresh();
    } catch (error) {
      console.error('Error creating document:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Fehler beim Erstellen des Dokuments');
      }
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Absender & Empfänger */}
      <Card>
        <CardHeader>
          <CardTitle>Absender & Empfänger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Absender (readonly) */}
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Absender</p>
            <div className="bg-gray-800 p-4 rounded-lg text-gray-200 text-sm">
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
              <div className="mt-2 bg-gray-800 p-4 rounded-lg text-gray-200 text-sm">
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
        <CardHeader>
          <CardTitle>Ort & Datum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
              label={type === 'invoice' ? 'Rechnungsdatum' : 'Angebotsdatum'}
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <Input
              id="due_date"
              type="date"
              label={type === 'invoice' ? 'Fällig am' : 'Gültig bis'}
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
        <CardHeader>
          <CardTitle>Anrede & Einleitung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 text-sm">
            <p className="mb-2">
              Sehr geehrte{selectedCustomer ? ` Damen und Herren` : ' Damen und Herren'},
            </p>
          </div>
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
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-gray-400">
              <div className="col-span-5">Beschreibung</div>
              <div className="col-span-2">Menge</div>
              <div className="col-span-2">Einheit</div>
              <div className="col-span-2">Preis (€)</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 md:col-span-5">
                  <Input
                    placeholder="z.B. Beratungsleistung, Courtage, etc."
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(index, 'description', e.target.value)
                    }
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input
                    placeholder="Stück"
                    value={item.unit}
                    onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-1" />
              Position hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Umsatzsteuer & Summen */}
      <Card>
        <CardHeader>
          <CardTitle>Umsatzsteuer & Summen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* USt. frei eingebbar */}
          <div className="max-w-xs">
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
            <div className="text-right space-y-2 min-w-[250px]">
              <div className="flex justify-between gap-8">
                <p className="text-sm text-gray-400">Nettobetrag</p>
                <p className="text-sm text-white">{formatCurrency(netTotal)}</p>
              </div>
              {formData.vat_rate > 0 && (
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-400">{formData.vat_rate}% USt.</p>
                  <p className="text-sm text-white">{formatCurrency(vatAmount)}</p>
                </div>
              )}
              <div className="flex justify-between gap-8 pt-2 border-t border-gray-600">
                <p className="text-sm font-medium text-gray-200">Gesamtbetrag</p>
                <p className="text-xl font-bold text-white">{formatCurrency(grossTotal)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schlusstext & Anmerkungen */}
      <Card>
        <CardHeader>
          <CardTitle>Schlusstext & Absender</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="text-gray-400 text-sm italic">
            <p>Wir bedanken uns für die Zusammenarbeit.</p>
            <p className="mt-2">mit freundlichen Grüßen</p>
            {formData.sender_name && <p className="mt-1 text-white">{formData.sender_name}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          <p className="font-medium">Fehler:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {type === 'invoice' ? 'Rechnung erstellen' : 'Angebot erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
