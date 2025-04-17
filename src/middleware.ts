import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // --- ADDED LOGS for Env Var Diagnosis ---
  console.log("--- Middleware Execution Start ---");
  console.log("Middleware Check - NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Exists' : 'MISSING!'
  );
  console.log("Middleware Check - NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Exists' : 'MISSING!'
  );
  // --- END ADDED LOGS ---

  // Use const - cookie handlers should mutate response.cookies
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Initialize client (will fail if env vars are truly missing and '!' causes error)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Always get session first to handle cookie operations
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = req.nextUrl;

  // Define paths accessible without authentication
  const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback' ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/');

  // Only redirect if NOT logged in and accessing a non-public path
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user detected, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // --- ADDED: Redirect logged-in users away from auth pages ---
  if (user && (pathname === '/signin' || pathname === '/signup')) {
    console.log(`Middleware: User is authenticated, accessing auth path ${pathname}. Checking role...`);
    // Fetch profile to determine role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`Middleware: Error fetching profile for redirect: ${profileError.message}`);
      // Fallback: redirect to dashboard if profile fetch fails
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    const isAdmin = profileData?.is_admin === true;
    const redirectPath = isAdmin ? '/admin' : '/dashboard';
    console.log(`Middleware: Redirecting authenticated ${isAdmin ? 'admin' : 'user'} from ${pathname} to ${redirectPath}`);
    const url = req.nextUrl.clone();
    url.pathname = redirectPath;
    return NextResponse.redirect(url);
  }
  // --- END ADDED ---

  console.log(`Middleware: Allowing request to proceed for path ${pathname}. User authenticated: ${!!user}`);
  // Allow all other requests through
  return response;
}

// Matcher config
export const config = {
  matcher: [
    /* Match all request paths except for the ones starting with: */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
