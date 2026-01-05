'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 Stunde in Millisekunden

export function AutoLogout() {
  const router = useRouter();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/?session=expired');
  }, [supabase, router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    // Events die als Aktivität zählen
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Timer starten
    resetTimer();

    // Event Listener hinzufügen
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  // Diese Komponente rendert nichts
  return null;
}
