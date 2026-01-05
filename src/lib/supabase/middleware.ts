import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/dashboard', '/customers', '/invoices', '/quotes', '/settings'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if not authenticated
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to email confirmation page if email not confirmed
  if (isProtectedPath && user && !user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/email-bestaetigen';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages (except email confirmation page)
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname === path
  );
  const isEmailConfirmPage = request.nextUrl.pathname === '/email-bestaetigen';

  // If user is on email confirmation page but email is now confirmed, redirect to dashboard
  if (isEmailConfirmPage && user?.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    // If email not confirmed, go to confirmation page
    if (!user.email_confirmed_at) {
      url.pathname = '/email-bestaetigen';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Prevent browser caching of HTML pages
  supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  supabaseResponse.headers.set('Pragma', 'no-cache');
  supabaseResponse.headers.set('Expires', '0');

  return supabaseResponse;
}
