import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Correct syntax for disabling the rule on the next line:
  // eslint-disable-next-line prefer-const
  let response = NextResponse.next({ // Keep 'let' as cookie handlers might need to reassign response
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
          // This pattern sometimes requires reassigning response object in ssr examples
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
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

  // If user is NOT logged in AND accessing a non-public path, redirect
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Optional: Redirect logged-in users away from auth pages
  if (user && (pathname.startsWith('/signin') || pathname.startsWith('/signup'))) {
     console.log(`Middleware: User logged in, accessing auth path ${pathname}, redirecting...`);
     // Check admin status to redirect appropriately
     const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
     if(profileData?.is_admin) {
        return NextResponse.redirect(new URL('/admin', req.url));
     } else {
        return NextResponse.redirect(new URL('/dashboard', req.url));
     }
  }

  // Allow request to proceed
  return response;
}

// Matcher config
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};