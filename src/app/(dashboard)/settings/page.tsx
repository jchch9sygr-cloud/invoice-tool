'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { UpgradeButton } from '@/components/pricing/upgrade-button';
import { Upload, Check, Zap, CheckCircle, AlertCircle, XCircle, RefreshCw, Calendar, CreditCard, Search, Bell, Info } from 'lucide-react';
import { HelpPanel, settingsHelp } from '@/components/ui/help-panel';
import { WorkflowGuide } from '@/components/ui/workflow-guide';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import type { Profile, Subscription } from '@/types/database';

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className || ''}`} />
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<{ endDate: string } | null>(null);
  const [reactivateSuccess, setReactivateSuccess] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Partial<Subscription> | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
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
    logo_size: 56,
    signature_size: 50,
    reminder_days_first: 7,
    reminder_days_second: 14,
    reminder_days_third: 14,
    reminder_days_final: 7,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [{ data: profileData }, { data: subData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      ]);

      if (profileData) {
        setFormData({
          ...profileData,
          logo_size: profileData.logo_size || 56,
          signature_size: profileData.signature_size || 50,
          reminder_days_first: profileData.reminder_days_first ?? 7,
          reminder_days_second: profileData.reminder_days_second ?? 14,
          reminder_days_third: profileData.reminder_days_third ?? 14,
          reminder_days_final: profileData.reminder_days_final ?? 7,
        });
        if (profileData.logo_url) {
          setLogoPreview(profileData.logo_url);
        }
        if (profileData.signature_url) {
          setSignaturePreview(profileData.signature_url);
        }
      }

      if (subData) {
        setSubscription(subData);
      }
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Calculate remaining days until period end
  const getRemainingDays = (): number | null => {
    if (!subscription?.current_period_end) return null;
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSignatureError('Nur PNG, JPG, GIF oder WebP erlaubt.');
      e.target.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setSignatureError('Unterschrift darf maximal 2 MB groß sein.');
      e.target.value = '';
      return;
    }

    setSignatureError(null);
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const response = await fetch('/api/stripe/cancel', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setShowCancelModal(false);
        // Update local state
        const endDate = data.period_end ? formatDate(data.period_end) : 'Ende der Laufzeit';
        setCancelSuccess({ endDate });
        setSubscription(prev => prev ? {
          ...prev,
          cancel_at_period_end: true,
          current_period_end: data.period_end,
        } : null);
      } else {
        console.error('Cancel error:', data);
        alert('Fehler beim Kündigen: ' + data.error);
      }
    } catch (err) {
      console.error('Cancel exception:', err);
      alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true);
    try {
      const response = await fetch('/api/stripe/reactivate', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setCancelSuccess(null);
        setReactivateSuccess(true);
        setSubscription(prev => prev ? {
          ...prev,
          cancel_at_period_end: false,
        } : null);
        // Hide success message after 5 seconds
        setTimeout(() => setReactivateSuccess(false), 5000);
      } else {
        console.error('Reactivate error:', data);
        alert('Fehler beim Reaktivieren: ' + data.error);
      }
    } catch (err) {
      console.error('Reactivate exception:', err);
      alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setReactivateLoading(false);
    }
  };

  const getPlanDisplayName = () => {
    if (subscription?.plan === 'yearly') return 'Jahresabo';
    if (subscription?.plan === 'monthly') return 'Monatsabo';
    return 'Abo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setLogoError(null);
    setSignatureError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let logoUrl = formData.logo_url;
      let signatureUrl = formData.signature_url;

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

      // Upload signature if changed
      if (signatureFile) {
        const fileExt = signatureFile.name.split('.').pop()?.toLowerCase();
        const fileName = `signature_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, signatureFile, { upsert: true });

        if (uploadError) {
          console.error('Signature upload error:', uploadError);
          setSignatureError('Unterschrift-Upload fehlgeschlagen.');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          signatureUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          logo_url: logoUrl,
          signature_url: signatureUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setLogoFile(null);
      setSignatureFile(null);
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

      <div className="p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl">
          {/* Main Content */}
          <div className="flex-1 max-w-2xl space-y-6">
        {/* Cancel Confirmation Modal */}
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-white">Abo kündigen?</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-300">
                Möchtest du dein {getPlanDisplayName()} wirklich kündigen?
              </p>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Keine Sorge!</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-400">
                      <li>Du behältst den vollen Zugang bis zum Ende der Laufzeit</li>
                      <li>Bereits bezahlte Beträge werden nicht erstattet</li>
                      <li>Du kannst jederzeit wieder reaktivieren</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelLoading}
            >
              Abbrechen
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelSubscription}
              loading={cancelLoading}
            >
              Ja, kündigen
            </Button>
          </ModalFooter>
        </Modal>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Dein Tarif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading skeleton */}
            {subscriptionLoading ? (
              <SubscriptionSkeleton />
            ) : (
              <>
                {/* Success message after cancellation */}
                {cancelSuccess && (
                  <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-400">Kündigung erfolgreich</p>
                        <p className="text-sm text-green-600">
                          Dein Zugang bleibt bis zum {cancelSuccess.endDate} aktiv.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success message after reactivation */}
                {reactivateSuccess && (
                  <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-400">Abo reaktiviert!</p>
                        <p className="text-sm text-green-600">
                          Dein Abo wird wie gewohnt verlängert.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscription?.plan === 'free' ? (
              /* FREE PLAN */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Kostenloser Tarif</p>
                    <p className="text-sm text-gray-400">
                      {Math.max(0, 3 - (subscription.documents_count || 0))} von 3 Dokumenten übrig
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium">
                    Free
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg text-white">30 €</span>
                      <span className="text-sm text-gray-400">/ Jahr</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Jährlich, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="yearly">
                      Jahresabo starten
                    </UpgradeButton>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg text-white">5 €</span>
                      <span className="text-sm text-gray-400">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Monatlich kündbar, unbegrenzte Dokumente
                    </p>
                    <UpgradeButton plan="monthly" variant="outline">
                      Monatsabo starten
                    </UpgradeButton>
                  </div>
                </div>
              </div>
            ) : subscription?.cancel_at_period_end ? (
              /* CANCELLED (but still active until period end) */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-900/30 border border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-400">{getPlanDisplayName()} gekündigt</p>
                      <p className="text-sm text-yellow-600">
                        Zugang bis {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'Ende der Laufzeit'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-900 text-yellow-400 rounded-full text-sm font-medium">
                    Gekündigt
                  </span>
                </div>

                {/* Big end date display */}
                <div className="text-center py-6 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-400">Dein Zugang endet am</p>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {subscription.current_period_end ? formatDate(subscription.current_period_end) : '—'}
                  </p>
                  {getRemainingDays() !== null && (
                    <p className="text-lg font-medium text-yellow-400">
                      Noch {getRemainingDays()} {getRemainingDays() === 1 ? 'Tag' : 'Tage'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    Bis dahin kannst du alle Funktionen weiter nutzen.
                  </p>
                </div>

                {/* Reactivate button */}
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-400">Abo reaktivieren</p>
                      <p className="text-sm text-gray-400">
                        Abo fortsetzen ohne Unterbrechung
                      </p>
                    </div>
                    <Button
                      onClick={handleReactivateSubscription}
                      disabled={reactivateLoading}
                      className="gap-2"
                    >
                      {reactivateLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Wird reaktiviert...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Reaktivieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Or start a new subscription */}
                <div className="text-center text-sm text-gray-500">
                  <p>Oder starte nach Ablauf ein neues Abo:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UpgradeButton plan="yearly" variant="outline">
                    Jahresabo (30 €/Jahr)
                  </UpgradeButton>
                  <UpgradeButton plan="monthly" variant="outline">
                    Monatsabo (5 €/Monat)
                  </UpgradeButton>
                </div>
              </div>
            ) : subscription?.status === 'expired' ? (
              /* EXPIRED */
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
                  <UpgradeButton plan="yearly">
                    Jahresabo (30 €/Jahr)
                  </UpgradeButton>
                  <UpgradeButton plan="monthly" variant="outline">
                    Monatsabo (5 €/Monat)
                  </UpgradeButton>
                </div>
              </div>
            ) : (subscription?.plan === 'yearly' || subscription?.plan === 'monthly') ? (
              /* ACTIVE PAID PLAN */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-400">{getPlanDisplayName()}</p>
                      <p className="text-sm text-green-600">
                        Unbegrenzte Rechnungen & Angebote
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-900 text-green-400 rounded-full text-sm font-medium">
                    Aktiv
                  </span>
                </div>

                {/* Next billing date if available */}
                {subscription.current_period_end && (
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Nächste Verlängerung</p>
                      <p className="font-medium text-white">{formatDate(subscription.current_period_end)}</p>
                    </div>
                  </div>
                )}

                {/* Upgrade option for monthly subscribers */}
                {subscription?.plan === 'monthly' && (
                  <div className="border border-blue-800 bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-400">Auf Jahresabo wechseln</p>
                        <p className="text-sm text-gray-400">
                          30 €/Jahr - spare 30 € gegenüber monatlich
                        </p>
                      </div>
                      <UpgradeButton plan="yearly" size="sm">
                        Wechseln
                      </UpgradeButton>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    Abo kündigen
                  </Button>
                </div>
              </div>
            ) : (
              /* FALLBACK - Unknown state */
              <div className="text-center py-4 text-gray-400">
                <p>Abo-Status konnte nicht geladen werden.</p>
              </div>
            )}
              </>
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
                {/* Logo Größe */}
                {logoPreview && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">
                      Logo-Größe: {formData.logo_size || 56}px
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={formData.logo_size || 56}
                      onChange={(e) => setFormData({ ...formData, logo_size: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Unterschrift Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unterschrift (optional)
                </label>
                <div className="flex items-center gap-4">
                  {signaturePreview ? (
                    <img
                      src={signaturePreview}
                      alt="Unterschrift"
                      style={{ height: `${formData.signature_size || 50}px` }}
                      className="w-auto max-w-[150px] object-contain rounded border border-gray-700 bg-white p-1"
                    />
                  ) : (
                    <div className="h-12 w-24 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-500">Keine</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <span className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                          {signaturePreview ? 'Ändern' : 'Hochladen'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={handleSignatureChange}
                        />
                      </label>
                      {signaturePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setSignaturePreview(null);
                            setSignatureFile(null);
                            setFormData({ ...formData, signature_url: null });
                          }}
                          className="text-sm text-red-400 hover:text-red-300 hover:underline"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Für Rechnungen & Angebote</span>
                    {signatureError && (
                      <span className="text-xs text-red-400">{signatureError}</span>
                    )}
                  </div>
                </div>
                {/* Unterschrift Größe */}
                {signaturePreview && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">
                      Unterschrift-Größe: {formData.signature_size || 50}px
                    </label>
                    <input
                      type="range"
                      min="25"
                      max="80"
                      value={formData.signature_size || 50}
                      onChange={(e) => setFormData({ ...formData, signature_size: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}
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

          {/* Mahnwesen Einstellungen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Mahnwesen Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Erklärung */}
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-gray-300 space-y-2">
                    <p className="font-medium text-blue-400">So funktioniert das Mahnwesen:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li><strong className="text-white">Zahlungserinnerung</strong> – freundliche Erinnerung nach Fälligkeit</li>
                      <li><strong className="text-white">1. Mahnung</strong> – formelle erste Mahnung</li>
                      <li><strong className="text-white">2. Mahnung</strong> – dringendere Mahnung</li>
                      <li><strong className="text-white">Letzte Mahnung</strong> – Ankündigung weiterer Schritte</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Intervall-Einstellungen */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Zeitabstände konfigurieren</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Tage nach Fälligkeit → Zahlungserinnerung
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.reminder_days_first || 7}
                        onChange={(e) => setFormData({ ...formData, reminder_days_first: parseInt(e.target.value) || 7 })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-500">Tage</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Nach Erinnerung → 1. Mahnung
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.reminder_days_second || 14}
                        onChange={(e) => setFormData({ ...formData, reminder_days_second: parseInt(e.target.value) || 14 })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-500">Tage</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Nach 1. Mahnung → 2. Mahnung
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.reminder_days_third || 14}
                        onChange={(e) => setFormData({ ...formData, reminder_days_third: parseInt(e.target.value) || 14 })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-500">Tage</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Nach 2. Mahnung → Letzte Mahnung
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.reminder_days_final || 7}
                        onChange={(e) => setFormData({ ...formData, reminder_days_final: parseInt(e.target.value) || 7 })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-500">Tage</span>
                    </div>
                  </div>
                </div>

                {/* Beispiel-Timeline */}
                {(() => {
                  // Berechne realistische Daten ab 1. Januar
                  const baseDate = new Date(2025, 0, 1); // 1. Januar 2025
                  const formatExampleDate = (daysToAdd: number) => {
                    const date = new Date(baseDate);
                    date.setDate(date.getDate() + daysToAdd);
                    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
                  };

                  const days1 = formData.reminder_days_first || 7;
                  const days2 = days1 + (formData.reminder_days_second || 14);
                  const days3 = days2 + (formData.reminder_days_third || 14);
                  const days4 = days3 + (formData.reminder_days_final || 7);

                  return (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-2">Beispiel bei Fälligkeit am 1. Januar:</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-cyan-900/50 text-cyan-400 rounded">
                          {formatExampleDate(days1)}: Erinnerung
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded">
                          {formatExampleDate(days2)}: 1. Mahnung
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className="px-2 py-1 bg-orange-900/50 text-orange-400 rounded">
                          {formatExampleDate(days3)}: 2. Mahnung
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded">
                          {formatExampleDate(days4)}: Letzte
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
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

          {/* Help Panel - Sidebar */}
          <div className="xl:w-[600px] 2xl:w-[700px] shrink-0">
            <div className="xl:sticky xl:top-20 space-y-4">
              {/* 2x2 Grid für Workflow + Einstellungen-Hilfe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Workflow Guide - App-Ablauf */}
                <WorkflowGuide />

                {/* Firmendaten Hilfe */}
                <HelpPanel
                  tips={settingsHelp.company}
                  title="So nutzt du die Einstellungen"
                  collapsible={false}
                />
              </div>

              {/* 2x2 Grid für Quick Tips + Keyboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quick Tips */}
                <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-800/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="font-semibold text-white">Schnell-Tipps</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>Änderungen mit <strong className="text-white">Speichern</strong> bestätigen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>Logo & Unterschrift auf <strong className="text-white">allen</strong> Dokumenten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>Bezahlte Rechnungen sind <strong className="text-white">gesperrt</strong></span>
                    </li>
                  </ul>
                </div>

                {/* Keyboard Shortcut */}
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-800/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Search className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Tastenkürzel</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Schnellsuche</span>
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-gray-300">⌘K</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Windows/Linux</span>
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-gray-300">Strg+K</kbd>
                    </div>
                    <p className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                      Suche nach Rechnungen, Kunden oder Angeboten
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
