import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Erlaubte Redirect-Pfade (nur interne Seiten)
const ALLOWED_PATHS = ['/dashboard', '/invoices', '/quotes', '/customers', '/settings', '/login'];

function isValidRedirectPath(path: string): boolean {
  // Muss mit / beginnen und darf keine externen URLs sein
  if (!path.startsWith('/')) return false;
  // Keine Protocol-Handler oder double slashes
  if (path.startsWith('//') || path.includes('://')) return false;
  // Prüfe gegen erlaubte Pfade
  return ALLOWED_PATHS.some(allowed => path === allowed || path.startsWith(allowed + '/'));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const type = searchParams.get('type');

  // Validiere redirect path - nur interne Pfade erlauben
  const next = nextParam && isValidRedirectPath(nextParam) ? nextParam : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Bei E-Mail-Bestätigung (type=signup, type=email, oder frisch bestätigter User)
      // Zur Login-Seite mit Erfolgsmeldung redirecten
      const isEmailConfirmation = type === 'signup' || type === 'email' || type === 'email_change';

      // Auch wenn kein type, aber User ist neu bestätigt (email_confirmed_at kurz vor jetzt)
      const emailConfirmedAt = data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null;
      const isRecentlyConfirmed = emailConfirmedAt && (Date.now() - emailConfirmedAt.getTime()) < 60000; // 1 Minute

      if (isEmailConfirmation || isRecentlyConfirmed) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?verified=true`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
