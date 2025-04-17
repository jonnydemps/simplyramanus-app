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

  // Refresh session to ensure auth state is fresh for the server context
  await supabase.auth.getSession();

  // Now get the session data again after refresh
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = req.nextUrl;

  // Define AUTH pages (where unauthenticated users SHOULD be allowed)
  const isAuthPage =
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback';

  // Define truly PUBLIC pages/assets (accessible to everyone, always)
  const isPublicAsset =
      pathname === '/' || // Allow homepage
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/'); // Add other public assets/routes here

  // Redirect UNAUTHENTICATED users trying to access PROTECTED pages
  // Protected pages are anything NOT an auth page and NOT a public asset.
  if (!user && !isAuthPage && !isPublicAsset) {
    console.log(`Middleware: No user detected, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // --- ADDED: Redirect AUTHENTICATED users trying to access auth pages ---
  // If user is logged in and tries to go to signin/signup, redirect them away.
  if (user && isAuthPage) {
    // Simplified: Redirect all logged-in users to dashboard for now.
    // Later, could add profile fetch here to redirect admins to /admin if needed,
    // but that adds latency to the middleware. Client-side check might be better for role-based.
    const targetPath = '/dashboard';
    console.log(`Middleware: Authenticated user accessing auth page ${pathname}, redirecting to ${targetPath}`);
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
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
