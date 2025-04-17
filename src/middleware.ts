import { NextResponse, type NextRequest } from 'next/server'; // Combined imports
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

  // Create supabase client specific to this middleware request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          req.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          req.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // No need to explicitly refresh session here, getSession handles it if needed by ssr helper
  // await supabase.auth.getSession();

  // Get session data using the middleware-specific client
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
    console.log(`Middleware: DETECTED authenticated user (ID: ${user.id}) on auth page (${pathname}). Preparing redirect...`); // ADDED Log
    // Simplified: Redirect all logged-in users to dashboard for now.
    // Later, could add profile fetch here to redirect admins to /admin if needed,
    // but that adds latency to the middleware. Client-side check might be better for role-based.
    const targetPath = '/dashboard';
    const redirectUrl = req.nextUrl.clone(); // Renamed variable for clarity
    redirectUrl.pathname = targetPath;
    console.log(`Middleware: Redirect URL calculated: ${redirectUrl.toString()}`); // ADDED Log
    console.log(`Middleware: Executing NextResponse.redirect to ${targetPath}...`); // ADDED Log
    return NextResponse.redirect(redirectUrl); // Use renamed variable
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
