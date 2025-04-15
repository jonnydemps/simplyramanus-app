import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Start with the basic response object
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
          // Important: The `set` method from `createServerClient` needs to be able
          // to modify the cookies of the *response* object.
          // We directly modify the `response` object created at the start.
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Same as above, modify the response object directly.
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Crucial: Refresh session cookies by calling getSession().
  // This allows the server client to potentially refresh tokens and set cookies
  // on the 'response' object before we make decisions.
  // We get the user data from the session returned here.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user; // Extract user from session

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

  // If user is NOT logged in and trying to access a non-public path
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // If user IS logged in and tries to access signin/signup
  // Let's keep this redirect logic client-side for now to isolate the main issue
  // if (user && (pathname.startsWith('/signin') || pathname.startsWith('/signup'))) {
  //    return NextResponse.redirect(new URL('/dashboard', req.url));
  // }


  // If we reach here, the user is either authenticated OR accessing a public path.
  // Allow the request to proceed and return the potentially modified response (with cookies).
  return response;
}

// Matcher config remains the same
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};