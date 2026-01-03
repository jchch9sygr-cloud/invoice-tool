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
import { formatCurrency, generateDocumentNumber, calculateTotal } from '@/lib/utils';
import type { Customer, LineItemFormData, DocumentType } from '@/types/database';

interface DocumentFormProps {
  type: DocumentType;
  customers: Customer[];
  documentCount: number;
}

export function DocumentForm({ type, customers, documentCount }: DocumentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState({
    customer_id: '',
    date: today,
    due_date: dueDate,
    notes: type === 'invoice' ? 'Zahlbar innerhalb von 14 Tagen.' : 'Dieses Angebot ist 30 Tage gültig.',
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

  const total = calculateTotal(lineItems);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      {/* Customer & Dates */}
      <Card>
        <CardHeader>
          <CardTitle>
            {type === 'invoice' ? 'Rechnungsdetails' : 'Angebotsdetails'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            id="customer"
            label="Kunde"
            options={customerOptions}
            value={formData.customer_id}
            onChange={(e) =>
              setFormData({ ...formData, customer_id: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="date"
              type="date"
              label="Datum"
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

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-gray-500">
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
                    placeholder="z.B. Webdesign, Beratung, etc."
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

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-500">Gesamtbetrag</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Anmerkungen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Optionale Anmerkungen..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
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
