import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Use const - cookie handlers mutate response.cookies
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  // Call getSession to handle cookie sync
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const { pathname } = req.nextUrl;

  // Define public paths
  const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback' ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/');

  const isAdminPath = pathname.startsWith('/admin');

  // --- Redirect Logged-Out Users from Protected Paths ---
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // --- Handle Logged-In Users ---
  if (user) {
    // Fetch profile once for logged-in user checks
    console.log(`Middleware: Logged-in user ${user.id}. Fetching profile...`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && profile.is_admin;
    console.log(`Middleware: User ${user.id} profile fetched. isAdmin=${isAdmin}. Error: ${profileError?.message ?? 'None'}`);

    // --- Redirect Logged-In Users from Root Path ---
    if (pathname === '/') {
        const targetPath = isAdmin ? '/admin' : '/dashboard';
        console.log(`Middleware: Logged-in user (isAdmin=${isAdmin}) on root path '/'. Redirecting to ${targetPath}`);
        const url = req.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
    }

    // --- Redirect Logged-In Users from Other Public Auth Paths ---
    if (isPublicPath /* pathname !== '/' is implied by the check above */) {
      const targetPath = isAdmin ? '/admin' : '/dashboard'; // Admins hitting /signin etc. should also go to /admin
      console.log(`Middleware: Logged-in user (isAdmin=${isAdmin}) on public auth path ${pathname}. Redirecting to ${targetPath}`);
      const url = req.nextUrl.clone();
      url.pathname = targetPath;
      return NextResponse.redirect(url);
    }

    // --- Protect Admin Routes ---
    if (isAdminPath) {
      console.log(`Middleware: User accessing admin path ${pathname}. isAdmin=${isAdmin}`);
      if (!isAdmin) {
        // Profile fetch error already logged above if applicable
        console.error(`Middleware: Admin access denied for user ${user.id} to path ${pathname}. Redirecting to /dashboard.`);
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard'; // Or a specific 'unauthorized' page
        return NextResponse.redirect(url);
      }
      console.log(`Middleware: Admin access granted for user ${user.id} to path ${pathname}.`);
    }
    // Allow access to other non-public, non-admin paths for logged-in users (e.g., /dashboard)
  }

  // Allow request to proceed if no redirects were triggered
  return response;
}

// Matcher config
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};