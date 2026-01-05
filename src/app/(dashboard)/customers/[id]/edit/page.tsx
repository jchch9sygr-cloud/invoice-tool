'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    zip: '',
    city: '',
    email: '',
  });

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (!customer) {
        router.push('/customers');
        return;
      }

      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        address: customer.address || '',
        zip: customer.zip || '',
        city: customer.city || '',
        email: customer.email || '',
      });
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Kunde konnte nicht geladen werden');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          company: formData.company || null,
          address: formData.address || null,
          zip: formData.zip || null,
          city: formData.city || null,
          email: formData.email || null,
        })
        .eq('id', params.id);

      if (error) throw error;

      router.push('/customers');
      router.refresh();
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div>
        <PageHeader title="Kunde bearbeiten" />
        <div className="p-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Kunde bearbeiten" />

      <div className="p-4 sm:p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Kundendaten</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                label="Name *"
                placeholder="Max Mustermann"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <Input
                id="company"
                label="Firma"
                placeholder="Musterfirma GmbH"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />

              <Input
                id="address"
                label="Straße & Hausnummer"
                placeholder="Musterstraße 1"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="zip"
                  label="PLZ"
                  placeholder="12345"
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                />
                <div className="col-span-2">
                  <Input
                    id="city"
                    label="Stadt"
                    placeholder="Berlin"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>

              <Input
                id="email"
                type="email"
                label="E-Mail"
                placeholder="kunde@beispiel.de"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" loading={loading}>
                  Änderungen speichern
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
