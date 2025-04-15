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

  // --- ONLY Protect Non-Public Paths for Logged-Out Users ---
  // If the user is NOT logged in AND they are trying to access a path
  // that IS NOT public, redirect them to signin.
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // --- REMOVED ALL OTHER REDIRECT LOGIC ---
  // Allow ALL other requests through. The client-side AuthRedirector
  // component will handle redirecting logged-in users away from /signin
  // or non-admins away from /admin based on the loaded AuthProvider state.

  return response; // Return the response (potentially with updated cookies)
}

// Matcher config
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};