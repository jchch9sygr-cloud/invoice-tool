'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema } from '@/lib/validations';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Zod-Validierung
    const validation = registerSchema.safeParse({ email, password, passwordConfirm });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Validierungsfehler');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        if (error.message.includes('already registered')) {
          setError('Diese E-Mail ist bereits registriert.');
        } else if (error.message.includes('Email rate limit')) {
          setError('Zu viele Anfragen. Bitte warte einen Moment.');
        } else if (error.message.includes('Invalid email')) {
          setError('Ungültige E-Mail-Adresse.');
        } else if (error.message.includes('Signups not allowed')) {
          setError('Registrierungen sind deaktiviert. Bitte Supabase Auth-Einstellungen prüfen.');
        } else {
          setError(`Fehler: ${error.message}`);
        }
        return;
      }

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError('Diese E-Mail ist bereits registriert.');
        return;
      }

      // If user needs to confirm email (no session = email confirmation required)
      if (data?.user && !data?.session) {
        setSuccess('email_confirmation_required');
        return;
      }

      // If session exists, user is logged in
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Konto erstellen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success === 'email_confirmation_required' && (
            <div className="rounded-lg bg-blue-900/50 border border-blue-800 p-4 text-sm text-blue-300">
              <p className="font-semibold mb-2 text-blue-200">Fast geschafft!</p>
              <p>Wir haben eine Bestätigungs-E-Mail an <span className="font-medium text-blue-100">{email}</span> gesendet.</p>
              <p className="mt-2">Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.</p>
              <p className="mt-3 text-blue-400 text-xs">Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.</p>
              <Link href="/login" className="inline-block mt-3 text-blue-400 hover:text-blue-300 underline">
                Zur Anmeldung
              </Link>
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="E-Mail"
            placeholder="name@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label="Passwort"
            placeholder="Mind. 12 Zeichen, Groß-/Kleinbuchstaben, Zahl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            id="passwordConfirm"
            type="password"
            label="Passwort bestätigen"
            placeholder="Passwort wiederholen"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Registrieren
          </Button>

          <p className="text-center text-sm text-gray-400">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">
              Anmelden
            </Link>
          </p>

          <p className="text-center text-xs text-gray-500">
            3 Rechnungen kostenlos. Keine Kreditkarte nötig.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
