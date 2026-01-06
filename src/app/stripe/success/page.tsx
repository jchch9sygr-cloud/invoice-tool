'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function StripeSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (!sessionId) {
        setStatus('error');
        return;
      }

      // Verify the session with our API
      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');

          // If logged in, redirect to settings after short delay to see updated subscription
          if (user) {
            setTimeout(() => {
              router.push('/settings?success=true');
            }, 2000);
          }
        } else {
          setStatus('error');
        }
      } catch {
        // Even if verification fails, show success (webhook handles the actual update)
        setStatus('success');
        if (user) {
          setTimeout(() => {
            router.push('/settings?success=true');
          }, 2000);
        }
      }
    };

    checkStatus();
  }, [sessionId, supabase, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Zahlung wird verarbeitet...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Etwas ist schiefgelaufen</h1>
          <p className="text-gray-400 mb-6">
            Die Zahlung konnte nicht verifiziert werden. Falls dir Geld abgebucht wurde, kontaktiere uns bitte.
          </p>
          <Link href="/settings">
            <Button>Zurück zu Einstellungen</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Zahlung erfolgreich!</h1>
        <p className="text-gray-400 mb-8">
          Vielen Dank für dein Abo. Du hast jetzt unbegrenzten Zugang zu allen Funktionen.
        </p>

        {isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Du wirst gleich weitergeleitet...</p>
            <Link href="/settings">
              <Button className="w-full">Zu den Einstellungen</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-yellow-400">
              Bitte melde dich an, um fortzufahren.
            </p>
            <Link href="/login">
              <Button className="w-full">Jetzt anmelden</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Zahlung wird verarbeitet...</p>
          </div>
        </div>
      }
    >
      <StripeSuccessContent />
    </Suspense>
  );
}
