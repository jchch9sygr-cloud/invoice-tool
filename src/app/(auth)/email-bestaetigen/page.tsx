'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmailConfirmationPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });

        if (error) {
          setMessage('Fehler beim Senden. Bitte versuche es später erneut.');
        } else {
          setMessage('E-Mail wurde erneut gesendet!');
        }
      }
    } catch {
      setMessage('Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-900/50 flex items-center justify-center">
          <Mail className="h-8 w-8 text-blue-400" />
        </div>
        <CardTitle>E-Mail bestätigen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-gray-400">
          Bitte bestätige deine E-Mail-Adresse, um RechnungsBlitz nutzen zu können.
        </p>

        <p className="text-center text-sm text-gray-500">
          Wir haben dir eine E-Mail mit einem Bestätigungslink gesendet.
          Klicke auf den Link, um dein Konto zu aktivieren.
        </p>

        {message && (
          <div className={`rounded-lg p-3 text-sm text-center ${
            message.includes('Fehler')
              ? 'bg-red-900/50 border border-red-800 text-red-400'
              : 'bg-green-900/50 border border-green-800 text-green-400'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-2 pt-4">
          <Button
            onClick={handleResendEmail}
            className="w-full"
            variant="outline"
            disabled={loading}
          >
            <Mail className="h-4 w-4 mr-2" />
            {loading ? 'Wird gesendet...' : 'E-Mail erneut senden'}
          </Button>

          <Button
            onClick={handleRefresh}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ich habe bestätigt - Weiter
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-gray-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>

        <p className="text-center text-xs text-gray-600 pt-2">
          Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.
        </p>
      </CardContent>
    </Card>
  );
}
