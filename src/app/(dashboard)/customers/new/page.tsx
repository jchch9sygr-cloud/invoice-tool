'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    zip: '',
    city: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('customers').insert({
        user_id: user?.id,
        ...formData,
      });

      if (error) throw error;

      router.push('/customers');
      router.refresh();
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Neuer Kunde" />

      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Kundendaten</CardTitle>
          </CardHeader>
          <CardContent>
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
                  Kunde speichern
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
