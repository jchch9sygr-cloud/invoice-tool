import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Erlaubte Redirect-Pfade (nur interne Seiten)
const ALLOWED_PATHS = ['/dashboard', '/invoices', '/quotes', '/customers', '/settings'];

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

  // Validiere redirect path - nur interne Pfade erlauben
  const next = nextParam && isValidRedirectPath(nextParam) ? nextParam : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
