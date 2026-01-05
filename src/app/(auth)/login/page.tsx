'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isVerified = searchParams.get('verified') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe deinen Posteingang.');
        } else {
          setError('E-Mail oder Passwort ist falsch.');
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
        <CardTitle>Anmelden</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isVerified && (
            <div className="rounded-lg bg-green-900/50 border border-green-800 p-3 text-sm text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>E-Mail bestätigt! Du kannst dich jetzt anmelden.</span>
            </div>
          )}

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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Anmelden
          </Button>

          <p className="text-center text-sm text-gray-400">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-blue-400 hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
