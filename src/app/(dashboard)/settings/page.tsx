'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { UpgradeButton } from '@/components/pricing/upgrade-button';
import { Upload, Check, Zap, CheckCircle } from 'lucide-react';
import type { Profile, Subscription } from '@/types/database';

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Partial<Subscription> | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({
    company_name: '',
    address: '',
    zip: '',
    city: '',
    phone: '',
    email: '',
    tax_number: '',
    is_kleinunternehmer: true,
    bank_name: '',
    iban: '',
    bic: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: profileData }, { data: subData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileData) {
      setFormData(profileData);
      if (profileData.logo_url) {
        setLogoPreview(profileData.logo_url);
      }
    }

    if (subData) {
      setSubscription(subData);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let logoUrl = formData.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${user.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Einstellungen" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Dein Tarif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription?.plan === 'free' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Kostenloser Tarif</p>
                    <p className="text-sm text-gray-500">
                      {3 - (subscription.documents_count || 0)} von 3 Dokumenten übrig
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    Free
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">29 €</span>
                      <span className="text-sm text-gray-500">einmalig</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Lebenslanger Zugang, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="lifetime">
                      Jetzt kaufen
                    </UpgradeButton>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">5 €</span>
                      <span className="text-sm text-gray-500">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Monatlich kündbar, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="monthly" variant="outline">
                      Abo starten
                    </UpgradeButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {subscription?.plan === 'lifetime' ? 'Lifetime-Zugang' : 'Monatliches Abo'}
                    </p>
                    <p className="text-sm text-green-600">
                      Unbegrenzte Rechnungen & Angebote
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                  Aktiv
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Firmendaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded border"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded border flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:underline">
                      Logo hochladen
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              </div>

              <Input
                id="company_name"
                label="Firmenname"
                placeholder="Dein Unternehmen"
                value={formData.company_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />

              <Input
                id="address"
                label="Straße & Hausnummer"
                placeholder="Musterstraße 1"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="zip"
                  label="PLZ"
                  placeholder="12345"
                  value={formData.zip || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                />
                <div className="col-span-2">
                  <Input
                    id="city"
                    label="Stadt"
                    placeholder="Berlin"
                    value={formData.city || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="phone"
                  label="Telefon"
                  placeholder="+49 123 456789"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <Input
                  id="email"
                  type="email"
                  label="E-Mail"
                  placeholder="info@firma.de"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <Input
                id="tax_number"
                label="Steuernummer / USt-IdNr."
                placeholder="DE123456789"
                value={formData.tax_number || ''}
                onChange={(e) =>
                  setFormData({ ...formData, tax_number: e.target.value })
                }
              />

              <Toggle
                label="Kleinunternehmer (§19 UStG)"
                description="Auf Rechnungen erscheint der Hinweis zur Kleinunternehmerregelung"
                checked={formData.is_kleinunternehmer || false}
                onChange={(checked) =>
                  setFormData({ ...formData, is_kleinunternehmer: checked })
                }
              />
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bankverbindung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="bank_name"
                label="Bank"
                placeholder="Sparkasse Berlin"
                value={formData.bank_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
              />

              <Input
                id="iban"
                label="IBAN"
                placeholder="DE89 3704 0044 0532 0130 00"
                value={formData.iban || ''}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
              />

              <Input
                id="bic"
                label="BIC"
                placeholder="COBADEFFXXX"
                value={formData.bic || ''}
                onChange={(e) =>
                  setFormData({ ...formData, bic: e.target.value })
                }
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading}>
              Speichern
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Gespeichert
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
