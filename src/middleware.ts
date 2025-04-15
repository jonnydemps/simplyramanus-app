import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Use const here - the object's properties (cookies) can still be mutated
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
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mutates the cookies property of the existing 'response' object
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Mutates the cookies property of the existing 'response' object
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Always get the session to allow the ssr client to potentially set cookies
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user; // Get user from the session result

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

  // If user is NOT logged in AND accessing a non-public path, redirect
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Allow all other requests to proceed
  // Client-side logic handles redirecting logged-in users from auth pages
  // and checking admin role for admin pages.
  return response; // Return the response object (potentially with updated cookies)
}

// Matcher config
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