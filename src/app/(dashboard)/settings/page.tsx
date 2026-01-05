'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { UpgradeButton } from '@/components/pricing/upgrade-button';
import { Upload, Check, Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { Profile, Subscription } from '@/types/database';

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Partial<Subscription> | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({
    company_name: '',
    address: '',
    zip: '',
    city: '',
    phone: '',
    email: '',
    tax_number: '',
    is_kleinunternehmer: false,
    allow_paid_invoice_deletion: false,
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
    if (!file) return;

    // Validierung: Erlaubte Dateitypen
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Nur PNG, JPG, GIF oder WebP erlaubt.');
      e.target.value = '';
      return;
    }

    // Validierung: Maximale Dateigröße (2 MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setLogoError('Logo darf maximal 2 MB groß sein.');
      e.target.value = '';
      return;
    }

    // Validierung: Dateiendung prüfen
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setLogoError('Ungültige Dateiendung.');
      e.target.value = '';
      return;
    }

    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Möchtest du dein Abo wirklich kündigen? Du behältst den Zugang bis zum Ende der Laufzeit.')) {
      return;
    }

    setCancelLoading(true);
    try {
      const response = await fetch('/api/stripe/cancel', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setSubscription((prev) => prev ? {
          ...prev,
          cancel_at_period_end: true,
          current_period_end: data.period_end,
        } : null);
      } else {
        alert('Fehler beim Kündigen: ' + data.error);
      }
    } catch {
      alert('Ein Fehler ist aufgetreten.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setLogoError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let logoUrl = formData.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          setLogoError('Logo-Upload fehlgeschlagen. Bitte versuche es erneut.');
        } else {
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

      setLogoFile(null); // Reset file after successful upload
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
      <PageHeader title="Einstellungen" />

      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
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
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Kostenloser Tarif</p>
                    <p className="text-sm text-gray-400">
                      {3 - (subscription.documents_count || 0)} von 3 Dokumenten übrig
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium">
                    Free
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg text-white">60 €</span>
                      <span className="text-sm text-gray-400">einmalig</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Lebenslanger Zugang, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="lifetime">
                      Jetzt kaufen
                    </UpgradeButton>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg text-white">10 €</span>
                      <span className="text-sm text-gray-400">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Monatlich kündbar, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="monthly" variant="outline">
                      Abo starten
                    </UpgradeButton>
                  </div>
                </div>
              </div>
            ) : subscription?.plan === 'lifetime' ? (
              <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-400">Lifetime-Zugang</p>
                    <p className="text-sm text-green-600">
                      Unbegrenzte Rechnungen & Angebote - für immer
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-900 text-green-400 rounded-full text-sm font-medium">
                  Aktiv
                </span>
              </div>
            ) : subscription?.cancel_at_period_end ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-yellow-900/30 border border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-400">Abo gekündigt</p>
                      <p className="text-sm text-yellow-600">
                        Zugang bis {formatDate(subscription.current_period_end || null)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-900 text-yellow-400 rounded-full text-sm font-medium">
                    Gekündigt
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Du behältst den vollen Zugang bis zum Ende deiner Laufzeit.
                </p>
              </div>
            ) : subscription?.status === 'expired' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-900/30 border border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium text-red-400">Abo abgelaufen</p>
                      <p className="text-sm text-red-600">
                        Bitte erneuere dein Abo für unbegrenzten Zugang
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-900 text-red-400 rounded-full text-sm font-medium">
                    Abgelaufen
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UpgradeButton plan="lifetime">
                    Lifetime kaufen (60 €)
                  </UpgradeButton>
                  <UpgradeButton plan="monthly" variant="outline">
                    Abo erneuern (10 €/Monat)
                  </UpgradeButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-400">Monatliches Abo</p>
                      <p className="text-sm text-green-600">
                        Unbegrenzte Rechnungen & Angebote
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-900 text-green-400 rounded-full text-sm font-medium">
                    Aktiv
                  </span>
                </div>

                {/* Upgrade zu Lifetime */}
                <div className="border border-blue-800 bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-400">Auf Lifetime upgraden</p>
                      <p className="text-sm text-gray-400">
                        Einmalig 60 € - nie wieder zahlen
                      </p>
                    </div>
                    <UpgradeButton plan="lifetime" size="sm">
                      Upgrade
                    </UpgradeButton>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="text-gray-500 hover:text-red-400"
                  >
                    {cancelLoading ? 'Wird gekündigt...' : 'Abo kündigen'}
                  </Button>
                </div>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo (optional)
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-16 w-auto max-w-[120px] object-contain rounded border border-gray-700 bg-white p-1"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <span className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                          {logoPreview ? 'Logo ändern' : 'Logo hochladen'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview(null);
                            setLogoFile(null);
                            setFormData({ ...formData, logo_url: null });
                          }}
                          className="text-sm text-red-400 hover:text-red-300 hover:underline"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF oder WebP (max. 2 MB)</span>
                    {logoError && (
                      <span className="text-xs text-red-400">{logoError}</span>
                    )}
                  </div>
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
                description={formData.is_kleinunternehmer ? "Auf Rechnungen erscheint der Hinweis zur Kleinunternehmerregelung" : undefined}
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

          {/* Erweiterte Einstellungen */}
          <Card>
            <CardHeader>
              <CardTitle>Erweiterte Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                label="Bezahlte Rechnungen löschen erlauben"
                description={formData.allow_paid_invoice_deletion
                  ? "Achtung: Bezahlte Rechnungen können gelöscht werden. Dies kann buchhalterische Probleme verursachen."
                  : "Bezahlte Rechnungen sind vor versehentlichem Löschen geschützt."}
                checked={formData.allow_paid_invoice_deletion || false}
                onChange={(checked) =>
                  setFormData({ ...formData, allow_paid_invoice_deletion: checked })
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
