import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Create response object needed for setting cookies via ssr client
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If `set` is called, update request cookies for current request immediately
          req.cookies.set({ name, value, ...options });
          // Prepare response to set cookie on browser
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If `remove` is called, update request cookies for current request immediately
          req.cookies.set({ name, value: '', ...options });
          // Prepare response to remove cookie on browser
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Use getUser() to validate session server-side
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Define paths accessible without a user session
  const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback' || // Auth callback MUST be public
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/'); // Example: Allow public webhooks

  // --- Simplified Route Protection ---
  // If the user is NOT logged in AND they are trying to access a path
  // that IS NOT public, redirect them to signin.
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    // Clone the URL and modify pathname for redirect
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Allow all other requests to proceed.
  // Client-side logic in AuthProvider or page components will handle:
  // - Redirecting logged-in users away from /signin, /signup
  // - Checking for admin role on /admin pages
  return response; // Return response (might contain updated cookies)
}

// Matcher config - adjust if needed
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase internal auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};