import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Create response object early to allow cookie modifications
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
          // Ensure cookies are set on the response object we will return
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Ensure cookies are removed on the response object we will return
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // **Crucial:** Call getSession() first. This allows the ssr client
  // to potentially refresh tokens and update the cookies on the 'response' object.
  const { data: { session } } = await supabase.auth.getSession();

  // Get user from the session object after getSession() has run
  const user = session?.user;

  const { pathname } = req.nextUrl;

  // Define paths accessible without authentication
  const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback' || // Auth callback must be public
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/'); // Example: Allow public webhooks

  // If user is NOT logged in AND accessing a non-public path, redirect
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user after getSession, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Optional: Redirect logged-in users away from auth pages
  if (user && (pathname.startsWith('/signin') || pathname.startsWith('/signup'))) {
     console.log(`Middleware: User logged in, accessing auth path ${pathname}, redirecting to /dashboard`);
     // Redirect non-admin users to dashboard
     const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
     if(profileData?.is_admin) {
        return NextResponse.redirect(new URL('/admin', req.url));
     } else {
        return NextResponse.redirect(new URL('/dashboard', req.url));
     }
  }


  // Allow request to proceed. Return the 'response' object which may have been
  // updated with new cookies by getSession().
  return response;
}

// Matcher config
export const config = {
  matcher: [
    /* Match all request paths except for the ones starting with: */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};