'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Diese E-Mail ist bereits registriert.');
        } else {
          setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
        }
        return;
      }

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
            placeholder="Mindestens 6 Zeichen"
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
